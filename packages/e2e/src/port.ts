/**
 * Pick a free TCP port on `127.0.0.1`. Lets the OS assign one, then closes
 * the listener. There is a tiny TOCTOU window between release and re-bind
 * — acceptable for test fixtures, where a retry is cheap.
 */
import { createServer } from 'node:net';

export async function pickFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (addr === null || typeof addr === 'string') {
        srv.close();
        reject(new Error('Failed to obtain a free port'));
        return;
      }
      const port = addr.port;
      srv.close(() => resolve(port));
    });
  });
}
