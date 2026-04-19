/**
 * Integration tests for the legacy socket.io v0.9 compatibility shim
 * (@ethercalc/socketio-shim wired via `src/routes/legacy-socketio.ts`).
 * Exercises handshake format, JS shim delivery, and basic path routing
 * under the real Hono app.
 */
import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

import worker from '../src/index.ts';

async function request(method: string, path: string, init: RequestInit = {}) {
  const req = new Request(`https://example.test${path}`, { method, ...init });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

describe('legacy socket.io shim — routes', () => {
  it('GET /socket.io/socket.io.js serves the LEGACY_IO_JS body', async () => {
    const res = await request('GET', '/socket.io/socket.io.js');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/javascript/);
    const body = await res.text();
    // Shim has a stable header comment; check for the LEGACY_IO_JS sentinel.
    expect(body).toContain('EtherCalc legacy socket.io v0.9 shim');
    expect(body).toContain('installLegacyIo');
  });

  it('GET /socket.io/1/ returns a colon-delimited handshake body', async () => {
    const res = await request('GET', '/socket.io/1/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/plain/);
    const body = await res.text();
    // `<sid>:<hbTimeoutSec>:<closeTimeoutSec>:<transports>`
    const parts = body.split(':');
    expect(parts).toHaveLength(4);
    expect(parts[0]!.length).toBe(32); // 32-char hex sid
    expect(Number(parts[1])).toBeGreaterThan(0);
    expect(Number(parts[2])).toBeGreaterThan(0);
    expect(parts[3]!).toContain('websocket');
  });

  it('GET /socket.io/1 (no trailing slash) also handshakes', async () => {
    const res = await request('GET', '/socket.io/1');
    expect(res.status).toBe(200);
    const body = await res.text();
    const parts = body.split(':');
    expect(parts).toHaveLength(4);
  });

  it('GET /socket.io/bogus returns 404 (no catch-all leak)', async () => {
    const res = await request('GET', '/socket.io/bogus');
    expect(res.status).toBe(404);
  });

  it('GET /socket.io/1/websocket/<sid> without Upgrade header returns 426', async () => {
    // Valid-format sid placeholder; the shim rejects missing Upgrade before
    // it ever looks at the sid itself.
    const res = await request(
      'GET',
      '/socket.io/1/websocket/0123456789abcdef0123456789abcdef',
    );
    expect(res.status).toBe(426);
  });

  it('POST /socket.io/1/xhr-polling/<sid> with bad sid returns 400', async () => {
    const res = await request('POST', '/socket.io/1/xhr-polling/too-short');
    expect(res.status).toBe(400);
  });
});
