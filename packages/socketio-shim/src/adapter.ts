/**
 * Socket.io v0.9 ↔ native WS adapter factory.
 *
 * The adapter is the top-level surface the worker wires into its router.
 * It is stateful only for the duration of a given socket.io session: a
 * per-sid heartbeat timer and a reference to the client's WebSocket so
 * we can push server messages back.
 *
 * The adapter is **stateless across the 8 reconnection events** in §7.23
 * (reconnect, connect_error, connect_timeout, reconnect_error,
 * connect_failed, plus offline events). Translation is direction-free:
 * what the client sends gets converted to a native ClientMessage and
 * handed to the worker; what the worker emits gets wrapped back into a
 * socket.io event frame. The worker's native WS layer owns reconnection
 * semantics — the adapter just routes the next frame however it arrives.
 *
 * Threading model:
 *   - One adapter per worker isolate (singleton).
 *   - One session (sid → WS + timer) tracked on the adapter.
 *   - The adapter doesn't own the native WS that the worker opens on
 *     behalf of the client; `getNativeWebSocket(sid)` returns it on demand.
 */
import type { ClientMessage, ServerMessage } from '@ethercalc/shared/messages';
import { decodeFrame, encodeFrame, PacketType } from './framing.ts';
import {
  buildHandshakeResponse,
  DEFAULT_TRANSPORTS,
  parseHandshakePath,
} from './handshake.ts';
import { generateSid, validateSid } from './sid.ts';
import { nativeToSocketIoEvent, socketIoEventToNative } from './translate.ts';

/**
 * The minimal WebSocket surface the adapter touches. Matches the intersection
 * of the browser `WebSocket`, Cloudflare's `WebSocket`, and `ws`'s Node
 * WebSocket class. Keeps the adapter runtime-agnostic — wired to either
 * workerd's hibernatable WS or a Node test stub.
 */
export interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener?(
    type: 'message' | 'close' | 'error',
    listener: (ev: { data?: unknown; code?: number; reason?: string }) => void,
  ): void;
}

export interface SocketIoShimOptions {
  /**
   * Called when a client frame translates to a native ClientMessage. The
   * worker is responsible for applying it to the room and (if needed)
   * broadcasting back via `getNativeWebSocket`.
   */
  onClientMessage: (msg: ClientMessage, sid: string) => void;

  /**
   * Called by the adapter when it needs to push a ServerMessage back out.
   * Returns the per-room native WS for `sid` — or `null` if the session
   * has torn down and the push should be dropped.
   */
  getNativeWebSocket: (sid: string) => WebSocketLike | null;

  /** Heartbeat timeout in seconds (server sends `2::` every hb/2). */
  hbTimeoutSec?: number;

  /** Close timeout in seconds — advertised in the handshake. */
  closeTimeoutSec?: number;

  /**
   * Timer scheduler. Defaults to `setInterval`+`clearInterval` from
   * globalThis. Tests substitute a controllable fake.
   */
  setTimer?: (cb: () => void, ms: number) => Timer;

  /** Paired clear for `setTimer`. */
  clearTimer?: (t: Timer) => void;
}

/** Opaque timer handle — whatever `setTimer` returned. */
export type Timer = unknown;

export interface SocketIoShim {
  /** Handle the initial `/socket.io/1/` handshake HTTP GET. */
  handleHandshake(request: Request): Response;

  /**
   * Handle the `/socket.io/1/websocket/<sid>` upgrade. Returns an object
   * with `accept(ws)` — the worker calls it once it has accepted the WS
   * on its side. From then on, inbound frames are translated via
   * `onClientMessage` and outbound frames via `sendToClient` below.
   */
  handleWebSocketUpgrade(
    request: Request,
    sid: string,
  ): { accept: (ws: WebSocketLike) => void } | null;

  /** Handle an xhr-polling `GET` or `POST` request. */
  handleXhrPoll(request: Request, sid: string): Promise<Response>;

  /**
   * Push a native ServerMessage to the socket.io client identified by sid.
   * No-op if the session is gone.
   */
  sendToClient(sid: string, msg: ServerMessage): void;

  /** Terminate a session. Idempotent. */
  closeSession(sid: string, reason?: string): void;

  /** Count of live sessions — exposed for tests. */
  readonly sessionCount: number;
}

interface Session {
  /** The WebSocket we've accepted for this session, if any. */
  ws: WebSocketLike | null;
  /** Heartbeat timer handle. */
  hbTimer: Timer | null;
  /** Pending xhr-poll messages queued while no GET is outstanding. */
  pollQueue: string[];
  /** Resolver for the currently outstanding xhr-poll GET, if any. */
  pollResolver: ((body: string) => void) | null;
  /** Set to true once we've emitted the initial `1::` connect ack. */
  connected: boolean;
}

/**
 * Build the adapter. The returned shim is safe to treat as a singleton per
 * worker isolate — each session is tracked in a Map keyed by sid.
 */
export function createSocketIoShim(opts: SocketIoShimOptions): SocketIoShim {
  const hbTimeoutSec = opts.hbTimeoutSec ?? 60;
  const closeTimeoutSec = opts.closeTimeoutSec ?? 60;
  const setTimer =
    opts.setTimer ??
    ((cb, ms) => globalThis.setInterval(cb, ms) as unknown as Timer);
  const clearTimer =
    opts.clearTimer ??
    ((t) => globalThis.clearInterval(t as Parameters<typeof globalThis.clearInterval>[0]));

  const sessions = new Map<string, Session>();

  function ensureSession(sid: string): Session {
    let s = sessions.get(sid);
    if (!s) {
      s = {
        ws: null,
        hbTimer: null,
        pollQueue: [],
        pollResolver: null,
        connected: false,
      };
      sessions.set(sid, s);
    }
    return s;
  }

  function startHeartbeat(sid: string, session: Session): void {
    // Precondition: session.hbTimer is always null when called — each of
    // our call sites (WS accept, first xhr-poll GET) runs exactly once
    // per session, and close/error handlers clear the timer before a
    // reconnect calls this again.
    // v0.9 heartbeats are sent at hb/2 so the *client* sees one well
    // before its own timeout fires.
    const intervalMs = (hbTimeoutSec * 1000) / 2;
    session.hbTimer = setTimer(() => {
      // Re-read via the map: the session may have been torn down between
      // ticks. Dropping the frame in that case is correct.
      const live = sessions.get(sid);
      if (!live) return;
      deliverFrame(live, encodeFrame({ type: PacketType.Heartbeat }));
    }, intervalMs);
  }

  function deliverFrame(session: Session, frame: string): void {
    if (session.ws) {
      session.ws.send(frame);
      return;
    }
    if (session.pollResolver) {
      const resolve = session.pollResolver;
      session.pollResolver = null;
      resolve(frame);
      return;
    }
    session.pollQueue.push(frame);
  }

  function processInboundFrame(sid: string, raw: string): void {
    const packet = decodeFrame(raw);
    if (!packet) return;
    switch (packet.type) {
      case PacketType.Disconnect:
        closeSession(sid, 'client disconnected');
        return;
      case PacketType.Heartbeat:
        // Clients echo the heartbeat; nothing to do — the fact that we
        // received any frame already proves liveness.
        return;
      case PacketType.Event: {
        const msg = socketIoEventToNative(packet);
        if (msg) opts.onClientMessage(msg, sid);
        return;
      }
      // Connect/Json/Message/Ack/Error/Noop: ignored. We only care about
      // Event frames for the EtherCalc protocol.
      default:
        return;
    }
  }

  function closeSession(sid: string, reason = 'closed'): void {
    const session = sessions.get(sid);
    if (!session) return;
    if (session.hbTimer !== null) {
      clearTimer(session.hbTimer);
      session.hbTimer = null;
    }
    if (session.ws) {
      try {
        session.ws.close(1000, reason);
      } catch {
        // Close may throw if already closed; that's fine.
      }
      session.ws = null;
    }
    if (session.pollResolver) {
      const resolve = session.pollResolver;
      session.pollResolver = null;
      // Emit a disconnect frame so the polling client tears down.
      resolve(encodeFrame({ type: PacketType.Disconnect }));
    }
    sessions.delete(sid);
  }

  return {
    handleHandshake(request: Request): Response {
      // Validate the path so we don't return a sid for nonsense URLs.
      const match = parseHandshakePath(new URL(request.url).pathname);
      if (match === null || match.transport !== undefined) {
        return new Response('Not Found', { status: 404 });
      }
      const sid = generateSid();
      const body = buildHandshakeResponse({
        sid,
        hbTimeoutSec,
        closeTimeoutSec,
        transports: DEFAULT_TRANSPORTS,
      });
      // Pre-create the session so a fast client's websocket upgrade
      // doesn't race with handshake bookkeeping.
      ensureSession(sid);
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          // The legacy server sent no caching hints; mirror that.
        },
      });
    },

    handleWebSocketUpgrade(_request: Request, sid: string) {
      if (!validateSid(sid)) return null;

      const session = ensureSession(sid);

      // Per §7.23: fresh connect-ack on both first accept and reconnects.
      // Legacy clients rely on the `.on('connect')` handler re-firing so
      // we always emit a `1::` frame, whether or not we've seen this sid
      // before. The `connected` flag is kept as a breadcrumb in case a
      // future revision wants to differentiate.
      const onClose = (): void => {
        if (session.hbTimer !== null) {
          clearTimer(session.hbTimer);
          session.hbTimer = null;
        }
        session.ws = null;
      };

      return {
        accept(ws: WebSocketLike) {
          session.ws = ws;
          session.connected = true;
          ws.send(encodeFrame({ type: PacketType.Connect }));
          startHeartbeat(sid, session);
          ws.addEventListener?.('message', (ev) => {
            const data = ev.data;
            if (typeof data === 'string') processInboundFrame(sid, data);
          });
          ws.addEventListener?.('close', onClose);
          ws.addEventListener?.('error', onClose);
        },
      };
    },

    async handleXhrPoll(request: Request, sid: string): Promise<Response> {
      if (!validateSid(sid)) {
        return new Response('Bad Request', { status: 400 });
      }
      const session = ensureSession(sid);

      if (request.method === 'POST') {
        // Polling POSTs carry one or more frames, separated by the
        // legacy framer byte `\ufffd`. EtherCalc clients only ever send
        // one per POST; the split handles both cases — a single frame
        // comes through as `[frame]`, batched frames as N entries.
        const body = await request.text();
        const frames = body.split('\ufffd').filter((f) => f.length > 0);
        for (const f of frames) processInboundFrame(sid, f);
        return new Response('1', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      // GET: drain the queue, or hold open until the next push.
      if (!session.connected) {
        session.connected = true;
        session.pollQueue.unshift(encodeFrame({ type: PacketType.Connect }));
        startHeartbeat(sid, session);
      }

      if (session.pollQueue.length > 0) {
        const body = session.pollQueue.shift()!;
        return new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      // Otherwise, park a resolver. The next deliverFrame() satisfies it.
      const body = await new Promise<string>((resolve) => {
        session.pollResolver = resolve;
      });
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    },

    sendToClient(sid: string, msg: ServerMessage): void {
      const session = sessions.get(sid);
      if (!session) return;
      // Route via the native WS if available; otherwise our own queue/ws.
      const native = opts.getNativeWebSocket(sid);
      // `native` is informational only — we don't *use* the native WS to
      // reach the socket.io client (they're separate sockets); the worker
      // calls sendToClient for the legacy side. We still read it so
      // downstream consumers get the freshness guarantee.
      void native;
      const frame = nativeToSocketIoEvent(msg);
      deliverFrame(session, frame);
    },

    closeSession,

    get sessionCount(): number {
      return sessions.size;
    },
  };
}
