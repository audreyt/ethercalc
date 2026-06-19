import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { HttpScenario, WsScenario } from '@ethercalc/shared/oracle-scenarios';

import { diffHeaders, headersToRecord, normalizeHeaders } from './headers.ts';
import { dispatchMatcher } from './matchers.ts';
import { applyNormalizer } from './normalize.ts';
import { buildScenarioRequestInit, defaultFetcher, type RecordedFile } from './record.ts';
import { ALL_SCENARIOS } from './scenarios/index.ts';
import { runWsScenario } from './ws-runner.ts';

export interface ReplayOptions {
  readonly targetUrl: string;
  readonly recordedDir: string;
  readonly fetcher?: typeof fetch;
  /** Recursive directory listing; tests inject a stub. */
  readonly listFiles?: (dir: string) => Promise<readonly string[]>;
  /** File read; tests inject a stub. */
  readonly readFile?: (path: string) => Promise<string>;
  readonly log?: (line: string) => void;
  /** Worker replay uses native WS; oracle self-check uses socket.io. */
  readonly wsTransport?: import('./ws-transport.ts').WsTransport;
  readonly wsFactory?: import('./ws-transport.ts').WsFactory;
  readonly ioClientFactory?: import('./ws-transport.ts').IoClientFactory;
}

export interface ReplayResult {
  readonly scenario: HttpScenario | WsScenario;
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
  if (!parsed.scenario) {
    throw new Error('recorded artifact has no scenario');
  }
  if (parsed.scenario.kind === 'http' && !parsed.scenario.expect) {
    throw new Error(`scenario ${parsed.scenario.name} has no recorded expectation`);
  }
  if (parsed.scenario.kind === 'ws' && !hasRecordedWsExpectations(parsed.scenario)) {
    throw new Error(`scenario ${parsed.scenario.name} has no recorded ws expectations`);
  }
  return parsed;
}

function hasRecordedWsExpectations(scenario: WsScenario): boolean {
  return scenario.steps.length > 0;
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
  const normalized = applyNormalizer(scenario);
  if (!normalized.expect) {
    return { scenario, ok: false, error: 'scenario has no `expect` — re-record against the oracle' };
  }
  const url = new URL(normalized.request.path, opts.targetUrl).toString();
  let response: Response;
  try {
    response = await fetcher(url, buildScenarioRequestInit(normalized));
  } catch (err) {
    // Network-layer errors (connection refused, Bun ZlibError on a
    // gzip-tagged 404, etc.) must NOT crash the whole replay — the
    // caller iterates scenarios and reports per-scenario failures.
    return {
      scenario: normalized,
      ok: false,
      error: `fetch failed: ${(err as Error).message}`,
    };
  }
  if (response.status !== normalized.expect.status) {
    return {
      scenario: normalized,
      ok: false,
      error: `status: expected ${normalized.expect.status}, got ${response.status}`,
    };
  }
  const actualHeaders = normalizeHeaders(headersToRecord(response.headers));
  const headerErr = diffHeaders(normalized.expect.headers, actualHeaders);
  if (headerErr) return { scenario: normalized, ok: false, error: headerErr };
  const matcher = normalized.expect.bodyMatcher ?? 'exact';
  if (matcher === 'ignore') return { scenario: normalized, ok: true };
  let bodyBuffer: Uint8Array;
  try {
    bodyBuffer = new Uint8Array(await response.arrayBuffer());
  } catch (err) {
    return {
      scenario: normalized,
      ok: false,
      error: `body read failed: ${(err as Error).message}`,
    };
  }
  const bodyErr = dispatchMatcher(matcher, {
    expectedBase64: normalized.expect.bodyBase64,
    actualBytes: bodyBuffer,
  });
  if (bodyErr) return { scenario: normalized, ok: false, error: bodyErr };
  return { scenario: normalized, ok: true };
}

/** Replay a single recorded WS scenario against the target. */
export async function replayWsOne(
  scenario: WsScenario,
  opts: ReplayOptions,
): Promise<ReplayResult> {
  const result = await runWsScenario(scenario, {
    targetUrl: opts.targetUrl,
    transport: opts.wsTransport ?? 'native',
    mode: 'replay',
    ...(opts.fetcher !== undefined ? { fetcher: opts.fetcher } : {}),
    ...(opts.wsFactory !== undefined ? { wsFactory: opts.wsFactory } : {}),
    ...(opts.ioClientFactory !== undefined ? { ioClientFactory: opts.ioClientFactory } : {}),
  });
  if (result.ok) return { scenario, ok: true };
  return result.error !== undefined
    ? { scenario, ok: false, error: result.error }
    : { scenario, ok: false };
}

/**
 * Sort recorded artifacts in scenario-catalog order so stateful batches
 * (PUT → export → DELETE) replay against a fresh oracle the same way
 * they were recorded. Unlisted files sort lexicographically after known
 * scenarios.
 */
export function sortRecordedByScenarioOrder(
  files: readonly string[],
  scenarios: readonly (HttpScenario | WsScenario)[],
): readonly string[] {
  const rank = new Map(scenarios.map((s, i) => [s.name, i]));
  return [...files].sort((a, b) => {
    const nameA = parseRecordedFileName(a);
    const nameB = parseRecordedFileName(b);
    const rankA = rank.get(nameA);
    const rankB = rank.get(nameB);
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    return nameA.localeCompare(nameB);
  });
}

/** Extract `family/scenario` from a `.../family/scenario.json` path. */
export function parseRecordedFileName(path: string): string {
  const parts = path.split('/');
  const base = parts[parts.length - 1]!;
  const stem = base.replace(/\.json$/, '');
  const dir = parts.length >= 2 ? parts[parts.length - 2] : undefined;
  return dir ? `${dir}/${stem}` : stem;
}

/** Replay every recorded artifact in `opts.recordedDir` against the target. */
export async function replayAll(opts: ReplayOptions): Promise<readonly ReplayResult[]> {
  const lister = opts.listFiles ?? listRecordedFiles;
  const reader = opts.readFile ?? ((p) => readFile(p, 'utf8'));
  const files = sortRecordedByScenarioOrder(
    await lister(opts.recordedDir),
    ALL_SCENARIOS,
  );
  const results: ReplayResult[] = [];
  for (const file of files) {
    const parsed = parseRecordedFile(await reader(file));
    const result =
      parsed.scenario.kind === 'ws'
        ? await replayWsOne(parsed.scenario, opts)
        : await replayOne(parsed.scenario, opts);
    if (opts.log) {
      if (result.ok) opts.log(`  ok  ${parsed.scenario.name}`);
      else opts.log(`  FAIL ${parsed.scenario.name}: ${result.error}`);
    }
    results.push(result);
  }
  return results;
}
