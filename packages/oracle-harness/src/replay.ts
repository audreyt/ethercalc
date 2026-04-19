import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import { diffHeaders, headersToRecord, normalizeHeaders } from './headers.ts';
import { dispatchMatcher } from './matchers.ts';
import { defaultFetcher, type RecordedFile } from './record.ts';

export interface ReplayOptions {
  readonly targetUrl: string;
  readonly recordedDir: string;
  readonly fetcher?: typeof fetch;
  /** Recursive directory listing; tests inject a stub. */
  readonly listFiles?: (dir: string) => Promise<readonly string[]>;
  /** File read; tests inject a stub. */
  readonly readFile?: (path: string) => Promise<string>;
  readonly log?: (line: string) => void;
}

export interface ReplayResult {
  readonly scenario: HttpScenario;
  readonly ok: boolean;
  readonly error?: string;
}

/** Walk a directory recursively and return every `.json` file path. */
export async function listRecordedFiles(dir: string): Promise<readonly string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listRecordedFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

/** Parse a recorded JSON artifact. Throws on malformed input. */
export function parseRecordedFile(raw: string): RecordedFile {
  const parsed = JSON.parse(raw) as RecordedFile;
  if (!parsed.scenario || parsed.scenario.kind !== 'http') {
    throw new Error('recorded artifact is not an http scenario');
  }
  if (!parsed.scenario.expect) {
    throw new Error(`scenario ${parsed.scenario.name} has no recorded expectation`);
  }
  return parsed;
}

/**
 * Replay a single recorded scenario. Returns `{ok:true}` on match,
 * `{ok:false, error}` on any divergence. Does not throw on assertion
 * failure — the caller decides whether to abort the whole run.
 */
export async function replayOne(
  scenario: HttpScenario,
  opts: ReplayOptions,
): Promise<ReplayResult> {
  const fetcher = opts.fetcher ?? defaultFetcher;
  if (!scenario.expect) {
    return { scenario, ok: false, error: 'scenario has no `expect` — re-record against the oracle' };
  }
  const url = new URL(scenario.request.path, opts.targetUrl).toString();
  // `redirect: 'manual'` must match what the recorder did, or we'd
  // observe a 200 for scenarios the oracle recorded as 302.
  const init: RequestInit = { method: scenario.request.method, redirect: 'manual' };
  const requestHeaders = scenario.request.headers ?? {};
  if (Object.keys(requestHeaders).length > 0) init.headers = { ...requestHeaders };
  const response = await fetcher(url, init);
  if (response.status !== scenario.expect.status) {
    return {
      scenario,
      ok: false,
      error: `status: expected ${scenario.expect.status}, got ${response.status}`,
    };
  }
  const actualHeaders = normalizeHeaders(headersToRecord(response.headers));
  const headerErr = diffHeaders(scenario.expect.headers, actualHeaders);
  if (headerErr) return { scenario, ok: false, error: headerErr };
  const bodyBuffer = new Uint8Array(await response.arrayBuffer());
  const matcher = scenario.expect.bodyMatcher ?? 'exact';
  const bodyErr = dispatchMatcher(matcher, {
    expectedBase64: scenario.expect.bodyBase64,
    actualBytes: bodyBuffer,
  });
  if (bodyErr) return { scenario, ok: false, error: bodyErr };
  return { scenario, ok: true };
}

/** Replay every recorded artifact in `opts.recordedDir` against the target. */
export async function replayAll(opts: ReplayOptions): Promise<readonly ReplayResult[]> {
  const lister = opts.listFiles ?? listRecordedFiles;
  const reader = opts.readFile ?? ((p) => readFile(p, 'utf8'));
  const files = await lister(opts.recordedDir);
  const results: ReplayResult[] = [];
  for (const file of files) {
    const parsed = parseRecordedFile(await reader(file));
    const result = await replayOne(parsed.scenario, opts);
    if (opts.log) {
      if (result.ok) opts.log(`  ok  ${parsed.scenario.name}`);
      else opts.log(`  FAIL ${parsed.scenario.name}: ${result.error}`);
    }
    results.push(result);
  }
  return results;
}
