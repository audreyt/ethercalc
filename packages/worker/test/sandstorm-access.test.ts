import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it } from 'vite-plus/test';

import worker from '../src/index.ts';

async function request(method: string, path: string, permission = 'read'): Promise<Response> {
  const context = createExecutionContext();
  const response = await worker.fetch(
    new Request(`https://example.test${path}`, {
      method,
      headers: { 'X-Sandstorm-Permissions': permission },
      ...(method === 'GET' ? {} : { body: 'data' }),
    }),
    { ...env, ETHERCALC_SANDSTORM: '1' } as never,
    context,
  );
  await waitOnExecutionContext(context);
  return response;
}

describe('Sandstorm room mutations', () => {
  it('blocks viewer writes through both URL shapes and template cloning', async () => {
    expect((await request('PUT', '/=sheet.xlsx')).status).toBe(403);
    expect((await request('POST', '/=sheet.csv')).status).toBe(403);
    expect((await request('PUT', '/_/=sheet/xlsx')).status).toBe(403);
    expect((await request('POST', '/_/=sheet/csv')).status).toBe(403);
    expect((await request('GET', '/sheet/form')).status).toBe(403);
  });

  it('allows an editor to use the ordinary room write route', async () => {
    const response = await request('PUT', '/_/sandstorm-editor', 'modify');
    expect(response.status).toBe(201);
  });
});
