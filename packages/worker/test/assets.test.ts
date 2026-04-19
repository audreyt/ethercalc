import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

import worker from '../src/index.ts';

/**
 * Workers integration tests for the Phase 4.1/11 asset layer.
 *
 * Strategy: we stub `env.ASSETS` with an in-test Fetcher whose responses
 * mimic what Cloudflare's Workers Assets binding would return. This
 * keeps the test hermetic (no dependency on having built `assets/`
 * during CI-test ordering) and lets us assert the exact pathname the
 * route handler forwarded for each endpoint.
 *
 * Route inventory covered (see CLAUDE.md §6.1 + §7 items 24/26/29):
 *   - `/`, `/_start`, `/favicon.ico` (+ 9 icon siblings)
 *   - `/manifest.appcache` — DevMode dynamic stub AND prod pass-through
 *   - `/manifest.json`, `/browserconfig.xml`
 *   - `/l10n/<lang>.json` — all 7 locales
 *   - `/static/socialcalc.js`, `/static/player.js`
 *   - `/static/form<part>.js` — colon-route
 *   - `/:template/appeditor` — panels.html
 *   - `/:template/form` — stubbed 503 until Phase 5
 *   - `/:room` (no-KEY → serves; KEY-no-auth → 302)
 *   - `/:room` with `=` prefix → multi/index.html
 *
 * Tests run inside workerd via `@cloudflare/vitest-pool-workers`; no
 * coverage gate (see CLAUDE.md §5.2). Every branch is independently
 * covered by the pure-logic tests under `test/*.node.test.ts`.
 */

interface StubAssetCall {
  readonly pathname: string;
}

function makeStubFetcher(map: Map<string, { body: string; contentType: string }>): {
  readonly fetcher: Fetcher;
  readonly calls: StubAssetCall[];
} {
  const calls: StubAssetCall[] = [];
  const fetcher: Fetcher = {
    fetch: async (input: RequestInfo | URL): Promise<Response> => {
      const url =
        typeof input === 'string'
          ? new URL(input)
          : input instanceof URL
            ? input
            : new URL((input as Request).url);
      calls.push({ pathname: url.pathname });
      const hit = map.get(url.pathname);
      if (!hit) {
        return new Response('Not Found', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      return new Response(hit.body, {
        status: 200,
        headers: { 'Content-Type': hit.contentType },
      });
    },
  } as Fetcher;
  return { fetcher, calls };
}

async function call(
  path: string,
  opts: {
    readonly ASSETS?: Fetcher;
    readonly DEVMODE?: string;
    readonly ETHERCALC_KEY?: string;
  } = {},
): Promise<Response> {
  const req = new Request(`https://example.test${path}`, { redirect: 'manual' });
  const ctx = createExecutionContext();
  // Merge our test-specified bindings over the miniflare-provided env.
  const mergedEnv = { ...(env as Record<string, unknown>), ...opts };
  const res = await worker.fetch(req, mergedEnv as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

/** Build a stub ASSETS for the icon/HTML family. */
function buildFullStub(): {
  readonly ASSETS: Fetcher;
  readonly calls: StubAssetCall[];
} {
  const map = new Map<string, { body: string; contentType: string }>([
    ['/index.html', { body: '<html>index</html>', contentType: 'text/html; charset=utf-8' }],
    [
      '/multi/index.html',
      { body: '<html>multi</html>', contentType: 'text/html; charset=utf-8' },
    ],
    ['/start.html', { body: '<html>start</html>', contentType: 'text/html; charset=utf-8' }],
    ['/panels.html', { body: '<html>panels</html>', contentType: 'text/html; charset=utf-8' }],
    ['/favicon.ico', { body: 'ICO-BYTES', contentType: 'image/x-icon' }],
    ['/favicon-16x16.png', { body: 'PNG16', contentType: 'image/png' }],
    ['/favicon-32x32.png', { body: 'PNG32', contentType: 'image/png' }],
    ['/apple-touch-icon.png', { body: 'APPLE', contentType: 'image/png' }],
    ['/android-chrome-192x192.png', { body: 'ANDRO', contentType: 'image/png' }],
    ['/mstile-150x150.png', { body: 'MS150', contentType: 'image/png' }],
    ['/mstile-310x310.png', { body: 'MS310', contentType: 'image/png' }],
    ['/safari-pinned-tab.svg', { body: '<svg/>', contentType: 'image/svg+xml' }],
    ['/browserconfig.xml', { body: '<?xml?>', contentType: 'application/xml' }],
    ['/manifest.json', { body: '{}', contentType: 'application/json' }],
    ['/manifest.appcache', { body: 'CACHE MANIFEST\n', contentType: 'text/cache-manifest' }],
    [
      '/static/socialcalc.js',
      { body: '/* SocialCalc */', contentType: 'application/javascript' },
    ],
    ['/static/player.js', { body: '/* player */', contentType: 'application/javascript' }],
    ['/formbuilder.js', { body: '/* form builder */', contentType: 'application/javascript' }],
    ['/l10n/en.json', { body: '{"lang":"en"}', contentType: 'application/json' }],
    ['/l10n/de.json', { body: '{"lang":"de"}', contentType: 'application/json' }],
    ['/l10n/es-ES.json', { body: '{"lang":"es"}', contentType: 'application/json' }],
    ['/l10n/fr.json', { body: '{"lang":"fr"}', contentType: 'application/json' }],
    ['/l10n/ru-RU.json', { body: '{"lang":"ru"}', contentType: 'application/json' }],
    ['/l10n/zh-CN.json', { body: '{"lang":"zh-CN"}', contentType: 'application/json' }],
    ['/l10n/zh-TW.json', { body: '{"lang":"zh-TW"}', contentType: 'application/json' }],
  ]);
  const { fetcher, calls } = makeStubFetcher(map);
  return { ASSETS: fetcher, calls };
}

describe('GET / (root)', () => {
  it('proxies through ASSETS to /index.html', async () => {
    const stub = buildFullStub();
    const res = await call('/', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>index</html>');
    expect(stub.calls).toEqual([{ pathname: '/index.html' }]);
  });

  it('returns 404 when ASSETS is unbound', async () => {
    // Explicitly strip the miniflare-provided ASSETS binding to test
    // the unbound fallback branch. `exactOptionalPropertyTypes` forbids
    // `ASSETS: undefined`, so we go through a cast + delete instead.
    const mergedEnv: Record<string, unknown> = { ...(env as Record<string, unknown>) };
    delete mergedEnv['ASSETS'];
    const req = new Request('https://example.test/', { redirect: 'manual' });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, mergedEnv as never, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });
});

describe('GET /_start', () => {
  it('serves start.html via ASSETS', async () => {
    const stub = buildFullStub();
    const res = await call('/_start', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>start</html>');
    expect(stub.calls.at(-1)?.pathname).toBe('/start.html');
  });
});

describe('icon family (10 paths)', () => {
  const icons: Array<[string, string]> = [
    ['/favicon.ico', 'ICO-BYTES'],
    ['/favicon-16x16.png', 'PNG16'],
    ['/favicon-32x32.png', 'PNG32'],
    ['/apple-touch-icon.png', 'APPLE'],
    ['/android-chrome-192x192.png', 'ANDRO'],
    ['/mstile-150x150.png', 'MS150'],
    ['/mstile-310x310.png', 'MS310'],
    ['/safari-pinned-tab.svg', '<svg/>'],
    ['/browserconfig.xml', '<?xml?>'],
    ['/manifest.json', '{}'],
  ];
  for (const [path, expectedBody] of icons) {
    it(`serves ${path}`, async () => {
      const stub = buildFullStub();
      const res = await call(path, { ASSETS: stub.ASSETS });
      expect(res.status).toBe(200);
      expect(await res.text()).toBe(expectedBody);
      expect(stub.calls.at(-1)?.pathname).toBe(path);
    });
  }
});

describe('GET /manifest.appcache', () => {
  it('serves the static file when DEVMODE is off', async () => {
    const stub = buildFullStub();
    const res = await call('/manifest.appcache', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('CACHE MANIFEST\n');
    expect(stub.calls.at(-1)?.pathname).toBe('/manifest.appcache');
  });

  it('returns the dynamic DevMode stub when DEVMODE=1 (without hitting ASSETS)', async () => {
    const stub = buildFullStub();
    const res = await call('/manifest.appcache', {
      ASSETS: stub.ASSETS,
      DEVMODE: '1',
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/cache-manifest');
    const body = await res.text();
    expect(body).toMatch(/^CACHE MANIFEST\n\n#\d+\n\nNETWORK:\n\*\n$/);
    // ASSETS should NOT have been called — DevMode stub is pure.
    expect(stub.calls.some((c) => c.pathname === '/manifest.appcache')).toBe(false);
  });

  it('supports DEVMODE=true alias', async () => {
    const stub = buildFullStub();
    const res = await call('/manifest.appcache', {
      ASSETS: stub.ASSETS,
      DEVMODE: 'true',
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/^CACHE MANIFEST\n/);
  });
});

describe('GET /l10n/<lang>.json', () => {
  // Keep in sync with the 7 locales under assets/l10n/ (§7 item 24).
  const locales = ['en', 'de', 'es-ES', 'fr', 'ru-RU', 'zh-CN', 'zh-TW'];
  for (const lang of locales) {
    it(`serves /l10n/${lang}.json`, async () => {
      const stub = buildFullStub();
      const res = await call(`/l10n/${lang}.json`, { ASSETS: stub.ASSETS });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { lang: string };
      expect(body.lang).toBeTruthy();
      expect(stub.calls.at(-1)?.pathname).toBe(`/l10n/${lang}.json`);
    });
  }

  it('404s when the lang file is missing in the ASSETS map', async () => {
    const stub = buildFullStub();
    const res = await call('/l10n/xx.json', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(404);
  });
});

describe('GET /static/socialcalc.js', () => {
  it('serves the vendored SocialCalc runtime through ASSETS', async () => {
    const stub = buildFullStub();
    const res = await call('/static/socialcalc.js', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('/* SocialCalc */');
    expect(stub.calls.at(-1)?.pathname).toBe('/static/socialcalc.js');
  });
});

describe('GET /static/player.js', () => {
  it('serves the built client bundle through ASSETS', async () => {
    const stub = buildFullStub();
    const res = await call('/static/player.js', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('/* player */');
    expect(stub.calls.at(-1)?.pathname).toBe('/static/player.js');
  });
});

describe('GET /static/form<part>.js (colon route)', () => {
  it('extracts the :part and forwards to /form<part>.js', async () => {
    const stub = buildFullStub();
    const res = await call('/static/formbuilder.js', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('/* form builder */');
    expect(stub.calls.at(-1)?.pathname).toBe('/formbuilder.js');
  });

  it('404s when the part has no matching file in ASSETS', async () => {
    const stub = buildFullStub();
    const res = await call('/static/formnonsense.js', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(404);
  });
});

describe('GET /:template/appeditor', () => {
  it('serves panels.html from ASSETS', async () => {
    const stub = buildFullStub();
    const res = await call('/tpl/appeditor', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>panels</html>');
    expect(stub.calls.at(-1)?.pathname).toBe('/panels.html');
  });
});

describe('GET /:template/form', () => {
  it('returns the Phase 5 stub with status 503', async () => {
    const stub = buildFullStub();
    const res = await call('/tpl/form', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(503);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=UTF-8');
    expect(await res.text()).toContain('Phase 5');
  });
});

describe('GET /:room (entry)', () => {
  it('serves /index.html when no KEY configured', async () => {
    const stub = buildFullStub();
    const res = await call('/some-room', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>index</html>');
    expect(stub.calls.at(-1)?.pathname).toBe('/index.html');
  });

  it('serves /multi/index.html for =-prefixed rooms (no KEY)', async () => {
    const stub = buildFullStub();
    const res = await call('/=workbook', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>multi</html>');
    expect(stub.calls.at(-1)?.pathname).toBe('/multi/index.html');
  });

  it('302s to ?auth=0 when KEY set and auth missing', async () => {
    const stub = buildFullStub();
    const res = await call('/locked-room', {
      ASSETS: stub.ASSETS,
      ETHERCALC_KEY: 'secret',
    });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/locked-room?auth=0');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=UTF-8');
  });

  it('serves index.html when KEY set and auth present', async () => {
    const stub = buildFullStub();
    const res = await call('/locked-room?auth=abc', {
      ASSETS: stub.ASSETS,
      ETHERCALC_KEY: 'secret',
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>index</html>');
    expect(stub.calls.at(-1)?.pathname).toBe('/index.html');
  });

  it('does NOT shadow stateless reserved paths (/_new gets 302, not index)', async () => {
    // Regression guard — if the catch-all registers too early, /_new
    // would fall into the entry handler and return index.html instead.
    const stub = buildFullStub();
    const res = await call('/_new', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/^\/[0-9a-z]{12}$/);
    // And the assets stub should not have been asked for /_new.
    expect(stub.calls.some((c) => c.pathname === '/_new')).toBe(false);
  });

  it('does NOT shadow /_health', async () => {
    const stub = buildFullStub();
    const res = await call('/_health', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('does NOT shadow /:room/edit redirect', async () => {
    const stub = buildFullStub();
    const res = await call('/my-room/edit', { ASSETS: stub.ASSETS });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/my-room?auth=my-room');
  });
});
