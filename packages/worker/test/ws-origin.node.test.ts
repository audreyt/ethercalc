import { describe, expect, it } from 'vite-plus/test';
import { isAllowedWebSocketOrigin } from '../src/lib/ws-origin.ts';

describe('WebSocket origin checks', () => {
  it('accepts a matching browser origin and rejects a foreign one', () => {
    const same = new Request('https://example.test/_ws/r', {
      headers: { Origin: 'https://example.test' },
    });
    const foreign = new Request('https://example.test/_ws/r', {
      headers: { Origin: 'https://other.test' },
    });
    expect(isAllowedWebSocketOrigin(same, 'https://example.test', false)).toBe(true);
    expect(isAllowedWebSocketOrigin(foreign, 'https://example.test', false)).toBe(false);
    expect(isAllowedWebSocketOrigin(foreign, null, false)).toBe(false);
  });

  it('allows non-browser anonymous clients but requires Origin with a session cookie', () => {
    const request = new Request('https://example.test/_ws/r');
    expect(isAllowedWebSocketOrigin(request, 'https://example.test', false)).toBe(true);
    expect(isAllowedWebSocketOrigin(request, 'https://example.test', true)).toBe(false);
  });

  it('uses the request origin for self-hosts without a configured origin', () => {
    const request = new Request('http://localhost:8787/_ws/r', {
      headers: { Origin: 'http://localhost:8787' },
    });
    expect(isAllowedWebSocketOrigin(request, undefined, true)).toBe(true);
  });
});
