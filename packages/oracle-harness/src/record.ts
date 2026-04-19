import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type {
  BodyMatcher,
  HttpScenario,
  Scenario,
} from '@ethercalc/shared/oracle-scenarios';

import { encodeBase64 } from './matchers.ts';
import { headersToRecord, normalizeHeaders } from './headers.ts';

/**
 * The JSON artifact format. A recorded scenario is just a cloned
 * scenario with `expect` filled in from the oracle's actual response.
 * Keeping it this way means replay.ts doesn't need a separate loader
 * schema — it just parses the same `HttpScenario` type.
 */
export interface RecordedFile {
  readonly scenario: HttpScenario;
}

export interface RecordOptions {
  readonly targetUrl: string;
  readonly outDir: string;
  /** Defaults to `fetch`; tests pass a stub. */
  readonly fetcher?: typeof fetch;
  /** Defaults to `writeFile` from `node:fs/promises`; tests pass a stub. */
  readonly writer?: (path: string, contents: string) => Promise<void>;
  /**
   * Override the default matcher resolver. By default we infer one
   * from the response `Content-Type`: JSON bodies → `json`, empty
   * bodies / explicit 404s / redirects → `ignore` (with the regex
   * header assertion carrying the semantic weight), everything else
   * → `exact`.
   */
  readonly matcherForResponse?: (status: number, headers: Record<string, string>) => BodyMatcher;
  /** Injected logger so tests can assert progress output. */
  readonly log?: (line: string) => void;
}

export interface RecordResult {
  readonly scenario: HttpScenario;
  readonly path: string;
}

/** Default matcher selector — see RecordOptions above. */
export function defaultMatcherForResponse(
  status: number,
  headers: Record<string, string>,
): BodyMatcher {
  if (status >= 300 && status < 400) return 'ignore';
  if (status === 204 || status === 304) return 'ignore';
  const ct = (headers['content-type'] ?? '').toLowerCase();
  if (ct.includes('application/json')) return 'json';
  return 'exact';
}

/**
 * Sanitize a scenario name into a safe relative path fragment. The
 * scenario naming convention uses `/` as a family separator
 * (`static/get-root-index`), which happens to line up with fs path
 * separators — we just need to guard against `..` and absolute paths.
 */
export function scenarioPath(outDir: string, name: string): string {
  if (name.includes('..') || name.startsWith('/')) {
    throw new Error(`unsafe scenario name: ${JSON.stringify(name)}`);
  }
  return join(outDir, `${name}.json`);
}

/** Base64-encode the body of a fetch Response safely in all sizes. */
export async function encodeResponseBody(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  return encodeBase64(new Uint8Array(buffer));
}

/** Write a recorded artifact to disk, creating parent directories. */
export async function persistRecording(
  path: string,
  file: RecordedFile,
  writer: (path: string, contents: string) => Promise<void>,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writer(path, `${JSON.stringify(file, null, 2)}\n`);
}

/** Default file writer used when `opts.writer` is omitted. Split out so tests can exercise the fallback path directly. */
export const defaultWriter = (path: string, contents: string): Promise<void> =>
  writeFile(path, contents, 'utf8');

/** Default HTTP fetcher. Wrap the global so tests can stub it via the shared helper. */
export const defaultFetcher: typeof fetch = (input, init) => fetch(input, init);

/** Record a single HTTP scenario against the oracle. */
export async function recordOne(
  scenario: HttpScenario,
  opts: RecordOptions,
): Promise<RecordResult> {
  const fetcher = opts.fetcher ?? defaultFetcher;
  const writer = opts.writer ?? defaultWriter;
  const matcherFor = opts.matcherForResponse ?? defaultMatcherForResponse;

  const requestHeaders = scenario.request.headers ?? {};
  const url = new URL(scenario.request.path, opts.targetUrl).toString();
  const init: RequestInit = { method: scenario.request.method };
  if (Object.keys(requestHeaders).length > 0) init.headers = { ...requestHeaders };
  if (scenario.request.bodyBase64 !== undefined) {
    init.body = new Uint8Array(
      atob(scenario.request.bodyBase64)
        .split('')
        .map((ch) => ch.charCodeAt(0)),
    );
  }
  const response = await fetcher(url, init);
  const rawHeaders = headersToRecord(response.headers);
  const headers = normalizeHeaders(rawHeaders);
  const bodyBase64 = await encodeResponseBody(response);
  const matcher = matcherFor(response.status, headers);

  const recorded: HttpScenario = {
    ...scenario,
    expect: {
      status: response.status,
      headers,
      bodyBase64,
      bodyMatcher: matcher,
    },
  };
  const path = scenarioPath(opts.outDir, scenario.name);
  await persistRecording(path, { scenario: recorded }, writer);
  opts.log?.(`recorded ${scenario.name} → ${response.status}`);
  return { scenario: recorded, path };
}

/**
 * Record an iterable of scenarios in order. WebSocket scenarios are
 * skipped with a TODO — see Phase 7 in the plan.
 */
export async function recordAll(
  scenarios: Iterable<Scenario>,
  opts: RecordOptions,
): Promise<readonly RecordResult[]> {
  const results: RecordResult[] = [];
  for (const scenario of scenarios) {
    if (scenario.kind === 'ws') {
      // TODO(Phase 7): record WebSocket transcripts. For now the
      // harness only handles stateless HTTP scenarios; WS scenarios
      // sit in scenarios/ws/ but the recorder will skip them.
      opts.log?.(`skipping ws scenario ${scenario.name} (Phase 7)`);
      continue;
    }
    results.push(await recordOne(scenario, opts));
  }
  return results;
}
