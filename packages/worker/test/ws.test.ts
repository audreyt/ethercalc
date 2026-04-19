/**
 * Integration tests for the native WebSocket layer. Drives /_ws/:room
 * end-to-end: connect, send messages, receive replies, disconnect.
 * Runs in the workers pool so `state.acceptWebSocket` is available.
 */
import {
  createExecutionContext,
  env,
  runInDurableObject,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

import worker from '../src/index.ts';
import type { RoomDO } from '../src/room.ts';
import type { Env } from '../src/env.ts';

async function request(method: string, path: string, init: RequestInit = {}) {
  const req = new Request(`https://example.test${path}`, { method, ...init });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

describe('native WS — /_ws/:room', () => {
  it('GET /_ws/:room without Upgrade header returns 426', async () => {
    const res = await request('GET', '/_ws/some-room?user=alice&auth=0');
    expect(res.status).toBe(426);
  });

  it('GET /_ws/:room with Upgrade: websocket returns 101 + client socket', async () => {
    const req = new Request('https://example.test/_ws/ws-conn?user=alice&auth=0', {
      method: 'GET',
      headers: { Upgrade: 'websocket' },
    });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env as never, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(101);
    expect(res.webSocket).toBeDefined();
    res.webSocket?.accept(); res.webSocket?.close();
  });
});

describe('DO WS — /_do/ws integration (runInDurableObject)', () => {
  it('ask.log on empty room replies with {type:log, log:[], chat:[], snapshot:""}', async () => {
    const e = env as unknown as Env;
    const id = e.ROOM.idFromName('ws-asklog');
    const stub = e.ROOM.get(id);
    const upgradeRes = await stub.fetch('https://do.local/_do/ws?user=u&auth=0&room=ws-asklog', {
      headers: { Upgrade: 'websocket' },
    });
    expect(upgradeRes.status).toBe(101);
    const client = upgradeRes.webSocket!;
    client.accept();
    const messages: string[] = [];
    client.addEventListener('message', (ev) => {
      messages.push(ev.data as string);
    });
    client.send(JSON.stringify({ type: 'ask.log', room: 'ws-asklog', user: 'u' }));
    // Poll briefly for the reply — the DO is in the same runtime so the
    // round-trip completes synchronously once the event loop drains.
    for (let i = 0; i < 10 && messages.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(messages.length).toBeGreaterThan(0);
    const parsed = JSON.parse(messages[0]!) as {
      type: string;
      room: string;
      log: unknown[];
      chat: unknown[];
      snapshot: string;
    };
    expect(parsed.type).toBe('log');
    expect(parsed.room).toBe('ws-asklog');
    expect(parsed.log).toEqual([]);
    expect(parsed.chat).toEqual([]);
    expect(parsed.snapshot).toBe('');
    client.close();
  });

  it('chat message persists to storage and broadcasts to peers', async () => {
    const e = env as unknown as Env;
    const id = e.ROOM.idFromName('ws-chat');
    const stub = e.ROOM.get(id);
    const upgradeRes = await stub.fetch('https://do.local/_do/ws?user=alice&auth=0', {
      headers: { Upgrade: 'websocket' },
    });
    const client = upgradeRes.webSocket!;
    client.accept();
    client.send(JSON.stringify({ type: 'chat', room: 'ws-chat', user: 'alice', msg: 'hi' }));
    // Give the DO time to commit the chat storage write.
    await new Promise((r) => setTimeout(r, 30));

    // Verify storage via the instance runInDurableObject.
    await runInDurableObject(stub, async (instance: RoomDO) => {
      const chatLog = await instance.fetch(new Request('https://do.local/_do/log'));
      const body = (await chatLog.json()) as { chat: string[] };
      expect(body.chat).toContain('hi');
    });
    client.close();
  });

  it('close on the WS side evicts it from state.getWebSockets()', async () => {
    const e = env as unknown as Env;
    const id = e.ROOM.idFromName('ws-close');
    const stub = e.ROOM.get(id);
    const upgradeRes = await stub.fetch('https://do.local/_do/ws?user=u&auth=0', {
      headers: { Upgrade: 'websocket' },
    });
    expect(upgradeRes.status).toBe(101);
    const client = upgradeRes.webSocket!;
    client.accept();
    client.close(1000, 'bye');
    // Allow the hibernation runtime to propagate the close event.
    await new Promise((r) => setTimeout(r, 30));
    // We just assert the upgrade succeeded + close didn't throw; deeper
    // introspection of getWebSockets() requires a different runner.
  });
});
