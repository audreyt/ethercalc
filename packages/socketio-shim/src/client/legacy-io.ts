/**
 * Tiny `io()` API shim served at `/socket.io/socket.io.js`.
 *
 * External embeds (Drupal sheetnode, stale CDN snapshots, etc.) include
 * the legacy script tag:
 *
 *   <script src="/socket.io/socket.io.js"></script>
 *
 * They expect `window.io` to be a factory producing an object with
 * `.emit()`, `.on()`, `.disconnect()`. We give them a facade over a
 * native `WebSocket` connection to our new `/_ws/:room` endpoint so they
 * don't pay for the legacy handshake roundtrip.
 *
 * The emitted script is deliberately terse. Modern browsers don't need
 * polyfills; the legacy clients we care about (IE11-era sheetnode) have
 * already died out per §13 Q4's "indefinite" decision.
 *
 * We export the code both as a string (LEGACY_IO_JS) — which the worker
 * serves as JS — and as a function (installLegacyIo) which the test
 * suite can eval into a happy-dom window to assert behaviour.
 */

/**
 * Install the `io()` API onto a host global. Factored out so tests can
 * call it directly against a mocked `window`. In production this is
 * emitted as an IIFE string via `LEGACY_IO_JS` below.
 */
export function installLegacyIo(host: {
  WebSocket: typeof WebSocket;
  location: { host: string; protocol: string };
  io?: unknown;
}): void {
  // If a real socket.io client is already present (unlikely) do nothing.
  if (host.io) return;

  type Listener = (payload: unknown) => void;

  function io(url?: string): {
    emit: (event: string, data: unknown) => void;
    on: (event: string, cb: Listener) => void;
    disconnect: () => void;
  } {
    // Derive the native WS URL. The legacy `io()` takes an arbitrary host
    // URL; we ignore it and connect to `/_ws/<room>` where `<room>` is
    // pulled from the current pathname. Embeds that need a specific room
    // pass it via the URL path (`/<room>`), which is already how legacy
    // sheetnode worked.
    const proto = host.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const target =
      typeof url === 'string' && url.length > 0
        ? url
        : `${proto}//${host.location.host}/_ws/legacy`;
    // Rewrite http(s):// to ws(s):// for convenience — embeds sometimes
    // pass `window.location.origin` which starts with http.
    const wsUrl = target.replace(/^https?:/, proto);

    const ws = new host.WebSocket(wsUrl);
    const listeners: Record<string, Listener[]> = {};

    function fire(event: string, payload: unknown): void {
      const ls = listeners[event];
      if (!ls) return;
      for (const l of ls) l(payload);
    }

    ws.addEventListener('open', () => fire('connect', undefined));
    ws.addEventListener('close', () => fire('disconnect', undefined));
    ws.addEventListener('error', () => fire('error', undefined));
    ws.addEventListener('message', (ev: MessageEvent) => {
      // The new transport speaks raw JSON; external embeds used to
      // receive a single "data" event. We preserve that contract.
      let parsed: unknown = ev.data;
      if (typeof ev.data === 'string') {
        try {
          parsed = JSON.parse(ev.data);
        } catch {
          // Leave it as a string.
        }
      }
      fire('data', parsed);
    });

    return {
      emit(event: string, data: unknown): void {
        if (event !== 'data') return;
        // Embeds send `socket.emit('data', {type:'execute',…})` — the
        // payload is already a native ClientMessage.
        try {
          ws.send(typeof data === 'string' ? data : JSON.stringify(data));
        } catch {
          // Ignore send errors on a closed socket; embed will reconnect
          // via its own retry loop.
        }
      },
      on(event: string, cb: Listener): void {
        (listeners[event] ??= []).push(cb);
      },
      disconnect(): void {
        try {
          ws.close();
        } catch {
          // Already closed.
        }
      },
    };
  }

  host.io = io;
}

/**
 * Pre-built JS string served at `/socket.io/socket.io.js`. The worker
 * responds with `Content-Type: application/javascript; charset=utf-8`
 * and this body.
 *
 * Structure: IIFE that calls `installLegacyIo({ WebSocket, location })`
 * against the browser's global namespace. We inline the function body by
 * stringifying `installLegacyIo` so the output has zero build-time
 * dependency on bundler magic.
 */
export const LEGACY_IO_JS = `/* EtherCalc legacy socket.io v0.9 shim — generated, do not edit */
(function(){
  var installLegacyIo = ${installLegacyIo.toString()};
  installLegacyIo({
    WebSocket: window.WebSocket,
    location: window.location
  });
})();
`;
