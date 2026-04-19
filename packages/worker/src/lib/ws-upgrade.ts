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
 * Phase 7.1's `istanbul-ignore` budget (CLAUDE.md §5.2).
 */

/** Attachment payload stored on each accepted WebSocket. */
export interface WsAttachment {
  readonly user: string;
  readonly room: string;
  /** Pre-supplied hmac (or '0' for view-only) as provided at handshake. */
  readonly auth: string;
}

/**
 * Upgrade a `Request` to a hibernatable WebSocket owned by the supplied
 * `DurableObjectState`. Returns the 101 response carrying the client
 * socket the outer handler should send back.
 */
export function upgradeWebSocket(
  state: DurableObjectState,
  request: Request,
): Response {
  const url = new URL(request.url);
  const user = url.searchParams.get('user') ?? '';
  const auth = url.searchParams.get('auth') ?? '';
  const room = url.searchParams.get('room') ?? '';
  const pair = new WebSocketPair();
  const client = pair[0];
  const server = pair[1];
  state.acceptWebSocket(server);
  const attachment: WsAttachment = { user, room, auth };
  server.serializeAttachment(attachment);
  return new Response(null, { status: 101, webSocket: client });
}

