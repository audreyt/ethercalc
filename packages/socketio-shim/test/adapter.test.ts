import { describe, expect, it } from 'vitest';
import type { ClientMessage, ServerMessage } from '@ethercalc/shared/messages';
import {
  createSocketIoShim,
  type SocketIoShimOptions,
  type WebSocketLike,
} from '../src/adapter.ts';
import { decodeFrame, encodeFrame, PacketType } from '../src/framing.ts';
import { nativeToSocketIoEvent } from '../src/translate.ts';

/** A minimal fake WS that records outbound frames and routes event listeners. */
class FakeWebSocket implements WebSocketLike {
  readonly sent: string[] = [];
  closed: { code: number | undefined; reason: string | undefined } | null = null;
  private readonly listeners = new Map<string, Array<(ev: any) => void>>();
  sendThrows = false;
  closeThrows = false;

  send(data: string): void {
    if (this.sendThrows) throw new Error('boom');
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    if (this.closeThrows) throw new Error('close-boom');
    this.closed = { code, reason };
  }

  addEventListener(
    type: 'message' | 'close' | 'error',
    listener: (ev: any) => void,
  ): void {
    const bucket = this.listeners.get(type) ?? [];
    bucket.push(listener);
    this.listeners.set(type, bucket);
  }

  /** Drive inbound events from the test side. */
  emit(type: 'message' | 'close' | 'error', ev: any): void {
    const bucket = this.listeners.get(type) ?? [];
    for (const l of bucket) l(ev);
  }
}

/** A fake timer harness — caller can advance ticks deterministically. */
function makeFakeTimerHarness(): {
  setTimer: NonNullable<SocketIoShimOptions['setTimer']>;
  clearTimer: NonNullable<SocketIoShimOptions['clearTimer']>;
  advance(): void;
  count(): number;
} {
  type Entry = { cb: () => void; ms: number; live: boolean };
  const entries: Entry[] = [];
  return {
    setTimer(cb, ms) {
      const entry: Entry = { cb, ms, live: true };
      entries.push(entry);
      return entry;
    },
    clearTimer(t) {
      const entry = t as Entry;
      entry.live = false;
    },
    advance() {
      for (const e of entries) if (e.live) e.cb();
    },
    count() {
      return entries.filter((e) => e.live).length;
    },
  };
}

const VALID_SID = '0123456789abcdef0123456789abcdef';

function makeShim(
  overrides: Partial<SocketIoShimOptions> = {},
): {
  shim: ReturnType<typeof createSocketIoShim>;
  clientMessages: Array<{ msg: ClientMessage; sid: string }>;
  timers: ReturnType<typeof makeFakeTimerHarness>;
  nativeWs: Map<string, WebSocketLike | null>;
} {
  const clientMessages: Array<{ msg: ClientMessage; sid: string }> = [];
  const nativeWs = new Map<string, WebSocketLike | null>();
  const timers = makeFakeTimerHarness();
  const shim = createSocketIoShim({
    onClientMessage: (msg, sid) => clientMessages.push({ msg, sid }),
    getNativeWebSocket: (sid) => nativeWs.get(sid) ?? null,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    ...overrides,
  });
  return { shim, clientMessages, timers, nativeWs };
}

describe('handleHandshake', () => {
  it('returns a 200 with a handshake body for /socket.io/1/', () => {
    const { shim } = makeShim();
    const resp = shim.handleHandshake(new Request('https://x/socket.io/1/'));
    expect(resp.status).toBe(200);
  });

  it('body matches <sid>:<hb>:<close>:<transports>', async () => {
    const { shim } = makeShim({ hbTimeoutSec: 30, closeTimeoutSec: 45 });
    const resp = shim.handleHandshake(new Request('https://x/socket.io/1/'));
    const body = await resp.text();
    // Replace the sid with a placeholder for stable assertion.
    expect(body).toMatch(/^[0-9a-f]{32}:30:45:websocket,xhr-polling$/);
  });

  it('returns a text/plain content type', async () => {
    const { shim } = makeShim();
    const resp = shim.handleHandshake(new Request('https://x/socket.io/1/'));
    expect(resp.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  });

  it('returns 404 for non-handshake paths', () => {
    const { shim } = makeShim();
    const resp = shim.handleHandshake(
      new Request('https://x/socket.io/1/websocket/abc'),
    );
    expect(resp.status).toBe(404);
  });

  it('returns 404 for non-socket.io paths', () => {
    const { shim } = makeShim();
    const resp = shim.handleHandshake(new Request('https://x/some/other/path'));
    expect(resp.status).toBe(404);
  });

  it('registers a session for the new sid', async () => {
    const { shim } = makeShim();
    expect(shim.sessionCount).toBe(0);
    shim.handleHandshake(new Request('https://x/socket.io/1/'));
    expect(shim.sessionCount).toBe(1);
  });

  it('uses default hb/close timeouts when omitted', async () => {
    const { shim } = makeShim();
    const body = await shim.handleHandshake(new Request('https://x/socket.io/1/')).text();
    expect(body.split(':').slice(1).join(':')).toBe('60:60:websocket,xhr-polling');
  });
});

describe('handleWebSocketUpgrade', () => {
  it('returns null for invalid sid', () => {
    const { shim } = makeShim();
    expect(shim.handleWebSocketUpgrade(new Request('https://x/'), 'bad')).toBeNull();
  });

  it('sends a 1:: connect frame when accepted', () => {
    const { shim } = makeShim();
    const ws = new FakeWebSocket();
    const result = shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID);
    expect(result).not.toBeNull();
    result!.accept(ws);
    expect(ws.sent[0]).toBe(encodeFrame({ type: PacketType.Connect }));
  });

  it('starts the heartbeat timer', () => {
    const { shim, timers } = makeShim();
    const ws = new FakeWebSocket();
    const result = shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID);
    result!.accept(ws);
    expect(timers.count()).toBe(1);
  });

  it('heartbeat interval is exactly (hbTimeoutSec * 1000) / 2 ms', () => {
    // Pin the formula so mutations flipping the ` / 2` to ` * 2` or
    // dropping the `* 1000` don't survive. Legacy socket.io 0.9 sends
    // heartbeats at hb/2 so the client sees one well before its own
    // timeout fires (see adapter.ts line ~164).
    type TimerEntry = { ms: number };
    for (const hbTimeoutSec of [10, 30, 60]) {
      const harness: { setTimer: NonNullable<SocketIoShimOptions['setTimer']>; entries: TimerEntry[] } = {
        entries: [],
        setTimer(cb, ms) {
          const entry = { ms };
          harness.entries.push(entry);
          return entry;
        },
      };
      const shim = createSocketIoShim({
        onClientMessage: () => undefined,
        getNativeWebSocket: () => null,
        setTimer: harness.setTimer,
        clearTimer: () => undefined,
        hbTimeoutSec,
      });
      shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(new FakeWebSocket());
      expect(harness.entries).toHaveLength(1);
      expect(harness.entries[0]?.ms).toBe((hbTimeoutSec * 1000) / 2);
    }
  });

  it('sends a heartbeat when the timer fires', () => {
    const { shim, timers } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.sent.length = 0;
    timers.advance();
    expect(ws.sent).toContain(encodeFrame({ type: PacketType.Heartbeat }));
  });

  it('routes an inbound event frame to onClientMessage', () => {
    const { shim, clientMessages } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);

    const msg: ClientMessage = { type: 'chat', room: 'r', user: 'u', msg: 'hi' };
    const frame = encodeFrame({
      type: PacketType.Event,
      data: JSON.stringify({ name: 'data', args: [msg] }),
    });
    ws.emit('message', { data: frame });
    expect(clientMessages).toEqual([{ msg, sid: VALID_SID }]);
  });

  it('ignores non-string inbound messages', () => {
    const { shim, clientMessages } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.emit('message', { data: new ArrayBuffer(4) });
    expect(clientMessages).toHaveLength(0);
  });

  it('ignores malformed inbound frames', () => {
    const { shim, clientMessages } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.emit('message', { data: 'garbage' });
    expect(clientMessages).toHaveLength(0);
  });

  it('ignores heartbeat frames from client', () => {
    const { shim, clientMessages } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.emit('message', { data: encodeFrame({ type: PacketType.Heartbeat }) });
    expect(clientMessages).toHaveLength(0);
  });

  it('tears down the session on inbound disconnect frame', () => {
    const { shim } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    expect(shim.sessionCount).toBe(1);
    ws.emit('message', { data: encodeFrame({ type: PacketType.Disconnect }) });
    expect(shim.sessionCount).toBe(0);
  });

  it('ignores non-event non-special packet types (e.g. Json)', () => {
    const { shim, clientMessages } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.emit('message', { data: encodeFrame({ type: PacketType.Json, data: '{}' }) });
    expect(clientMessages).toHaveLength(0);
  });

  it('drops the event when the packet translates to null (unknown type)', () => {
    const { shim, clientMessages } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    const frame = encodeFrame({
      type: PacketType.Event,
      data: JSON.stringify({ name: 'data', args: [{ type: 'made.up' }] }),
    });
    ws.emit('message', { data: frame });
    expect(clientMessages).toHaveLength(0);
  });

  it('clears the heartbeat timer on close', () => {
    const { shim, timers } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    expect(timers.count()).toBe(1);
    ws.emit('close', {});
    expect(timers.count()).toBe(0);
  });

  it('clears the heartbeat timer on error', () => {
    const { shim, timers } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.emit('error', {});
    expect(timers.count()).toBe(0);
  });

  it('close handler is idempotent with the subsequent error', () => {
    // Exercise the branch where hbTimer is already null on error.
    const { shim, timers } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.emit('close', {});
    ws.emit('error', {});
    expect(timers.count()).toBe(0);
  });

  it('reconnection with the same sid emits a second connect frame', () => {
    const { shim } = makeShim();
    const ws1 = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws1);
    ws1.emit('close', {});

    const ws2 = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws2);
    expect(ws2.sent[0]).toBe(encodeFrame({ type: PacketType.Connect }));
  });

  it('works when the WS lacks addEventListener (optional-chain branch)', () => {
    // A spartan WS that doesn't expose addEventListener should still be
    // acceptable — send() remains available so we can push heartbeats
    // and server messages.
    const { shim } = makeShim();
    const minimalWs: WebSocketLike = {
      send: () => {},
      close: () => {},
    };
    const result = shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID);
    // Should not throw.
    result!.accept(minimalWs);
    expect(shim.sessionCount).toBe(1);
  });
});

describe('sendToClient', () => {
  it('pushes a 5:: event frame to the connected WS', () => {
    const { shim, nativeWs } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.sent.length = 0;
    nativeWs.set(VALID_SID, ws);

    const msg: ServerMessage = { type: 'ignore' };
    shim.sendToClient(VALID_SID, msg);
    expect(ws.sent[0]).toBe(nativeToSocketIoEvent(msg));
  });

  it('is a no-op for unknown sid', () => {
    const { shim } = makeShim();
    shim.sendToClient('nonexistent', { type: 'ignore' });
    // Nothing to assert beyond "didn't throw"; sessionCount stays 0.
    expect(shim.sessionCount).toBe(0);
  });

  it('queues the frame when no WS is attached (post-handshake, pre-upgrade)', async () => {
    // Simulate the brief window between handshake and WS upgrade: the
    // session exists but has no WS. The frame should end up in the poll
    // queue and be drained by the next xhr-poll GET.
    const { shim } = makeShim();
    const handshake = shim.handleHandshake(new Request('https://x/socket.io/1/'));
    const sid = (await handshake.text()).split(':')[0]!;
    shim.sendToClient(sid, { type: 'ignore' });

    const poll = await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${sid}`),
      sid,
    );
    const body = await poll.text();
    // The first poll also injects the connect ack before our queued msg.
    expect(body).toContain('1::');
    // Subsequent polls return our queued event.
    const poll2 = await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${sid}`),
      sid,
    );
    const body2 = await poll2.text();
    expect(body2.startsWith('5:::')).toBe(true);
  });

  it('resolves an outstanding xhr-poll GET when a message arrives', async () => {
    const { shim } = makeShim();
    const handshake = shim.handleHandshake(new Request('https://x/socket.io/1/'));
    const sid = (await handshake.text()).split(':')[0]!;

    // Drain the initial `1::` connect ack so the poll that follows parks
    // with an empty queue.
    await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${sid}`),
      sid,
    );

    // Start a poll without awaiting it yet; then push a message.
    const pending = shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${sid}`),
      sid,
    );
    shim.sendToClient(sid, { type: 'ignore' });

    const resp = await pending;
    expect((await resp.text()).startsWith('5:::')).toBe(true);
  });
});

describe('handleXhrPoll', () => {
  it('rejects an invalid sid with 400', async () => {
    const { shim } = makeShim();
    const resp = await shim.handleXhrPoll(
      new Request('https://x/socket.io/1/xhr-polling/bad'),
      'bad',
    );
    expect(resp.status).toBe(400);
  });

  it('POST routes the body to onClientMessage', async () => {
    const { shim, clientMessages } = makeShim();
    const msg: ClientMessage = { type: 'chat', room: 'r', user: 'u', msg: 'hi' };
    const frame = encodeFrame({
      type: PacketType.Event,
      data: JSON.stringify({ name: 'data', args: [msg] }),
    });

    const resp = await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`, {
        method: 'POST',
        body: frame,
      }),
      VALID_SID,
    );
    expect(resp.status).toBe(200);
    expect(await resp.text()).toBe('1');
    expect(clientMessages).toEqual([{ msg, sid: VALID_SID }]);
  });

  it('POST ignores empty body', async () => {
    const { shim, clientMessages } = makeShim();
    const resp = await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`, {
        method: 'POST',
        body: '',
      }),
      VALID_SID,
    );
    expect(resp.status).toBe(200);
    expect(clientMessages).toHaveLength(0);
  });

  it('POST handles framer-delimited (\\ufffd) multi-frame bodies', async () => {
    // Legacy xhr-polling uses \ufffd as a frame separator for batched
    // client posts. Single POSTs never use it but the spec supports it.
    const { shim, clientMessages } = makeShim();
    const msg1: ClientMessage = { type: 'ask.recalc', room: 'r' };
    const msg2: ClientMessage = { type: 'ask.ecells', room: 'r' };
    const f1 = encodeFrame({
      type: PacketType.Event,
      data: JSON.stringify({ name: 'data', args: [msg1] }),
    });
    const f2 = encodeFrame({
      type: PacketType.Event,
      data: JSON.stringify({ name: 'data', args: [msg2] }),
    });
    const resp = await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`, {
        method: 'POST',
        body: `${f1}\ufffd${f2}`,
      }),
      VALID_SID,
    );
    expect(resp.status).toBe(200);
    expect(clientMessages.map((x) => x.msg.type)).toEqual(['ask.recalc', 'ask.ecells']);
  });

  it('GET emits the connect ack on first call', async () => {
    const { shim } = makeShim();
    const resp = await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    const body = await resp.text();
    expect(body).toBe(encodeFrame({ type: PacketType.Connect }));
  });

  it('GET starts the heartbeat on first call', async () => {
    const { shim, timers } = makeShim();
    await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    expect(timers.count()).toBe(1);
  });

  it('GET does not re-emit connect on subsequent calls', async () => {
    const { shim } = makeShim();
    await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    // Park a second GET; we'll unblock it with a sendToClient.
    const pending = shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    shim.sendToClient(VALID_SID, { type: 'ignore' });
    const body = await (await pending).text();
    expect(body.startsWith('5:::')).toBe(true);
  });

  it('heartbeat timer fires a frame into the poll queue', async () => {
    const { shim, timers } = makeShim();
    await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    timers.advance(); // push a heartbeat
    const resp = await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    expect(await resp.text()).toBe(encodeFrame({ type: PacketType.Heartbeat }));
  });
});

describe('closeSession', () => {
  it('is a no-op for unknown sid', () => {
    const { shim } = makeShim();
    shim.closeSession('nonexistent');
    expect(shim.sessionCount).toBe(0);
  });

  it('closes the attached WS', () => {
    const { shim } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    shim.closeSession(VALID_SID, 'bye');
    expect(ws.closed).toEqual({ code: 1000, reason: 'bye' });
  });

  it('swallows errors from ws.close()', () => {
    const { shim } = makeShim();
    const ws = new FakeWebSocket();
    ws.closeThrows = true;
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    expect(() => shim.closeSession(VALID_SID)).not.toThrow();
  });

  it('resolves any outstanding xhr poll with a disconnect frame', async () => {
    const { shim } = makeShim();
    // Drain the initial connect ack so the next poll actually parks.
    await shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    const pending = shim.handleXhrPoll(
      new Request(`https://x/socket.io/1/xhr-polling/${VALID_SID}`),
      VALID_SID,
    );
    shim.closeSession(VALID_SID);
    const resp = await pending;
    expect(await resp.text()).toBe(encodeFrame({ type: PacketType.Disconnect }));
  });

  it('clears the heartbeat timer', () => {
    const { shim, timers } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    shim.closeSession(VALID_SID);
    expect(timers.count()).toBe(0);
  });

  it('removes the session', () => {
    const { shim } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    expect(shim.sessionCount).toBe(1);
    shim.closeSession(VALID_SID);
    expect(shim.sessionCount).toBe(0);
  });

  it('uses the default "closed" reason when none is given', () => {
    const { shim } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    shim.closeSession(VALID_SID);
    expect(ws.closed?.reason).toBe('closed');
  });

  it('handles a second close when hbTimer was already cleared (close → closeSession)', () => {
    // WS close handler clears hbTimer and nulls ws. A later explicit
    // closeSession should still tear down the session without throwing.
    const { shim, timers } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    ws.emit('close', {});
    expect(timers.count()).toBe(0);
    shim.closeSession(VALID_SID);
    expect(shim.sessionCount).toBe(0);
  });
});

describe('defaults', () => {
  it('does not throw when setTimer/clearTimer are omitted', () => {
    // Smoke test: the adapter must not blow up without timer overrides.
    // We accept the real setInterval but clear it immediately so we don't
    // leak a handle.
    const shim = createSocketIoShim({
      onClientMessage: () => {},
      getNativeWebSocket: () => null,
      hbTimeoutSec: 3600, // long enough that the test exits first
    });
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    shim.closeSession(VALID_SID);
    // The default clearInterval call above (wired through closeSession)
    // would throw if the default timer path were broken — success = no
    // throw.
    expect(shim.sessionCount).toBe(0);
  });
});

describe('native websocket lookup', () => {
  it('sendToClient reads the native ws for the sid (informational call)', () => {
    const seenLookups: string[] = [];
    const shim = createSocketIoShim({
      onClientMessage: () => {},
      getNativeWebSocket: (sid) => {
        seenLookups.push(sid);
        return null;
      },
    });
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    shim.sendToClient(VALID_SID, { type: 'ignore' });
    expect(seenLookups).toContain(VALID_SID);
  });
});

describe('heartbeat reentrancy', () => {
  it('heartbeat callback is a no-op when the session is gone by the time it fires', () => {
    // We use a "stubborn" timer harness that ignores clearTimer — the
    // real-world case is a race where a tick is already queued on the
    // event loop when closeSession runs. The adapter's heartbeat closure
    // defensively re-looks-up the session and returns if it's gone.
    const scheduledCallbacks: Array<() => void> = [];
    const shim = createSocketIoShim({
      onClientMessage: () => {},
      getNativeWebSocket: () => null,
      setTimer: (cb) => {
        scheduledCallbacks.push(cb);
        return cb;
      },
      // Intentionally a no-op: simulate a tick that's already in flight
      // by the time closeSession fires.
      clearTimer: () => {},
    });
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);
    shim.closeSession(VALID_SID);

    // Now fire the "in-flight" tick. It should return early without
    // pushing another frame onto ws.sent.
    const tick = scheduledCallbacks[0]!;
    expect(() => tick()).not.toThrow();
    // Only the initial `1::` connect and the close-emitted frames; no
    // heartbeat added post-close. ws.sent[0] = connect; that's it.
    expect(ws.sent).toEqual([encodeFrame({ type: PacketType.Connect })]);
  });
});

describe('frame decoding robustness', () => {
  it('decodes a frame via decodeFrame when WS delivers it', () => {
    // Smoke test asserting we use decodeFrame for inbound data.
    const { shim, clientMessages } = makeShim();
    const ws = new FakeWebSocket();
    shim.handleWebSocketUpgrade(new Request('https://x/'), VALID_SID)!.accept(ws);

    // Multi-colon JSON must survive intact.
    const msg: ClientMessage = { type: 'chat', room: 'r:1', user: 'u', msg: 'a:b' };
    const frame = encodeFrame({
      type: PacketType.Event,
      data: JSON.stringify({ name: 'data', args: [msg] }),
    });
    ws.emit('message', { data: frame });
    expect(clientMessages[0]?.msg).toEqual(msg);

    // And the frame decodes symmetrically.
    expect(decodeFrame(frame)?.type).toBe(PacketType.Event);
  });
});
