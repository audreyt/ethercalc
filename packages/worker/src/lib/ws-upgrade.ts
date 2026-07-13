/* istanbul ignore file */
/**
 * Workers-only WebSocket upgrade helper. Isolated in its own file (with
 * `istanbul ignore file` at the top) because the hibernation-API path
 * requires `WebSocketPair`, `state.acceptWebSocket`, and a `Response`
 * that allows `status: 101` + `webSocket: client` — none of which exist
 * in the Node runtime where istanbul coverage runs. End-to-end coverage
 * for this code lives in the workers-pool integration tests
 * (`test/ws.test.ts`, `test/legacy-socketio.test.ts`, `test/room.test
 * .ts`).
 *
 * This is one of the narrow island of truly-untestable-in-Node glue per
 * Phase 7.1's `istanbul-ignore` budget (AGENTS.md §5.2).
 */

/** Attachment payload stored on each accepted WebSocket. */
export interface WsAttachment {
  readonly user: string;
  readonly room: string;
  /** Pre-supplied hmac (or '0' for view-only) as provided at handshake. */
  readonly auth: string;
  /** Sandstorm SH-6: whether `modify` was granted at handshake. */
  readonly sandstormModify?: boolean;
  /**
   * True for sockets accepted via the legacy socket.io v0.9 path. Message
   * frames are colon-delimited socket.io packets (`5:::{…}`) rather than
   * raw JSON, and outbound replies must be re-wrapped with
   * `nativeToSocketIoEvent`. Heartbeats (`2::`) are handled by the DO's
   * hibernatable `setWebSocketAutoResponse` pair — not a JS timer.
   */
  readonly legacy?: boolean;
}

/**
 * Upgrade a `Request` to a hibernatable WebSocket owned by the supplied
 * `DurableObjectState`. Returns the 101 response carrying the client
 * socket the outer handler should send back.
 */
export function upgradeWebSocket(
  state: DurableObjectState,
  request: Request,
  opts?: { readonly sandstormModify?: boolean },
): Response {
  const url = new URL(request.url);
  const user = url.searchParams.get('user') ?? '';
  const auth = url.searchParams.get('auth') ?? '';
  const room = url.searchParams.get('room') ?? '';
  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];
  state.acceptWebSocket(server);
  const attachment: WsAttachment = {
    user,
    room,
    auth,
    ...(opts?.sandstormModify !== undefined
      ? { sandstormModify: opts.sandstormModify }
      : {}),
  };
  server.serializeAttachment(attachment);
  return new Response(null, { status: 101, webSocket: client });
}

/**
 * Accept a legacy socket.io v0.9 WebSocket onto the DO via the hibernation
 * API. Tags the socket `legacy` and marks the attachment so
 * `webSocketMessage` / send paths use socket.io framing. Emits the v0.9
 * connect ack (`1::`) immediately; subsequent heartbeats (`2::` ↔ `2::`)
 * are handled by `state.setWebSocketAutoResponse` configured on the DO.
 */
export function upgradeLegacySocketIo(state: DurableObjectState): Response {
  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];
  state.acceptWebSocket(server, ['legacy']);
  const attachment: WsAttachment = {
    user: '',
    room: '',
    auth: '',
    legacy: true,
  };
  server.serializeAttachment(attachment);
  // v0.9 clients wait for the connect packet before emitting. Safe to send
  // while still inside the upgrade request — the socket is accepted.
  try {
    server.send('1::');
  } catch {
    // Peer already gone; hibernation will surface the close.
  }
  return new Response(null, { status: 101, webSocket: client });
}

