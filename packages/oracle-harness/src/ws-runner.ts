import type {
  HttpScenario,
  WsExpectStep,
  WsScenario,
  WsStep,
} from '@ethercalc/shared/oracle-scenarios';

import { diffHeaders, headersToRecord, normalizeHeaders } from './headers.ts';
import { dispatchMatcher } from './matchers.ts';
import {
  buildScenarioRequestInit,
  defaultMatcherForResponse,
  encodeResponseBody,
} from './record.ts';
import { applyWsNormalizer } from './ws-normalize.ts';
import { openWsSession, type WsSession, type WsTransport } from './ws-transport.ts';

export interface WsRunnerOptions {
  readonly targetUrl: string;
  readonly transport: WsTransport;
  readonly mode: 'record' | 'replay';
  readonly fetcher?: typeof fetch;
  readonly wsFactory?: import('./ws-transport.ts').WsFactory;
  readonly ioClientFactory?: import('./ws-transport.ts').IoClientFactory;
}

export interface WsRunResult {
  readonly ok: boolean;
  readonly error?: string;
  /** Populated in record mode with captured expect payloads. */
  readonly scenario?: WsScenario;
}

const DEFAULT_EXPECT_TIMEOUT_MS = 5_000;

/** Run a WS scenario step-by-step; record mode fills expect steps, replay asserts them. */
export async function runWsScenario(
  scenario: WsScenario,
  opts: WsRunnerOptions,
): Promise<WsRunResult> {
  const fetcher = opts.fetcher ?? fetch;
  const sessions = new Map<string, WsSession>();
  const recordedSteps: WsStep[] = [];

  try {
    for (const step of scenario.steps) {
      const outcome = await runStep(step, {
        scenario,
        opts,
        fetcher,
        sessions,
        recordedSteps,
      });
      if (!outcome.ok) return outcome;
    }
    const recorded: WsScenario =
      opts.mode === 'record'
        ? applyWsNormalizer({ ...scenario, steps: recordedSteps })
        : scenario;
    return { ok: true, scenario: recorded };
  } finally {
    for (const session of sessions.values()) session.close();
    sessions.clear();
  }
}

interface StepContext {
  readonly scenario: WsScenario;
  readonly opts: WsRunnerOptions;
  readonly fetcher: typeof fetch;
  readonly sessions: Map<string, WsSession>;
  readonly recordedSteps: WsStep[];
}

async function runStep(step: WsStep, ctx: StepContext): Promise<WsRunResult> {
  switch (step.type) {
    case 'connect': {
      const id = step.id ?? 'default';
      const session = await openWsSession({
        targetUrl: ctx.opts.targetUrl,
        connectUrl: step.url,
        transport: ctx.opts.transport,
        fetcher: ctx.fetcher,
        ...(ctx.opts.wsFactory !== undefined ? { wsFactory: ctx.opts.wsFactory } : {}),
        ...(ctx.opts.ioClientFactory !== undefined
          ? { ioClientFactory: ctx.opts.ioClientFactory }
          : {}),
      });
      ctx.sessions.set(id, session);
      ctx.recordedSteps.push(step);
      return { ok: true };
    }
    case 'send': {
      const session = requireSession(ctx.sessions, step.id);
      session.send(step.msg);
      ctx.recordedSteps.push(step);
      return { ok: true };
    }
    case 'expect': {
      const session = requireSession(ctx.sessions, step.id);
      const timeoutMs = step.timeoutMs ?? DEFAULT_EXPECT_TIMEOUT_MS;
      let actual: unknown;
      try {
        actual = await session.waitForMessage(timeoutMs);
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
      if (ctx.opts.mode === 'record') {
        ctx.recordedSteps.push({ ...step, msg: actual });
        return { ok: true };
      }
      const err = diffWsMessage(step, actual);
      if (err) return { ok: false, error: err };
      ctx.recordedSteps.push(step);
      return { ok: true };
    }
    case 'http': {
      const httpScenario: HttpScenario = {
        name: `${ctx.scenario.name}/inline-http`,
        kind: 'http',
        request: step.request,
        ...(step.expect !== undefined ? { expect: step.expect } : {}),
      };
      const url = new URL(step.request.path, ctx.opts.targetUrl).toString();
      const response = await ctx.fetcher(url, buildScenarioRequestInit(httpScenario));
      if (ctx.opts.mode === 'record') {
        const headers = normalizeHeaders(headersToRecord(response.headers));
        const bodyBase64 = await encodeResponseBody(response);
        const matcher = defaultMatcherForResponse(response.status, headers);
        const recordedStep = {
          ...step,
          expect: {
            status: response.status,
            headers,
            bodyBase64,
            bodyMatcher: matcher,
          },
        };
        ctx.recordedSteps.push(recordedStep);
        return { ok: true };
      }
      if (!step.expect) return { ok: false, error: 'inline http step has no recorded expect' };
      if (response.status !== step.expect.status) {
        return {
          ok: false,
          error: `inline http status: expected ${step.expect.status}, got ${response.status}`,
        };
      }
      const actualHeaders = normalizeHeaders(headersToRecord(response.headers));
      const headerErr = diffHeaders(step.expect.headers, actualHeaders);
      if (headerErr) return { ok: false, error: headerErr };
      const bodyBuffer = new Uint8Array(await response.arrayBuffer());
      const matcher = step.expect.bodyMatcher ?? 'exact';
      const bodyErr = dispatchMatcher(matcher, {
        expectedBase64: step.expect.bodyBase64,
        actualBytes: bodyBuffer,
      });
      if (bodyErr) return { ok: false, error: bodyErr };
      ctx.recordedSteps.push(step);
      return { ok: true };
    }
    case 'sleep': {
      await new Promise((resolve) => setTimeout(resolve, step.ms));
      ctx.recordedSteps.push(step);
      return { ok: true };
    }
    case 'close': {
      const id = step.id ?? 'default';
      const session = ctx.sessions.get(id);
      session?.close();
      ctx.sessions.delete(id);
      ctx.recordedSteps.push(step);
      return { ok: true };
    }
    default: {
      const _exhaustive: never = step;
      return { ok: false, error: `unknown ws step type: ${JSON.stringify(_exhaustive)}` };
    }
  }
}

function requireSession(sessions: Map<string, WsSession>, id: string | undefined): WsSession {
  const key = id ?? 'default';
  const session = sessions.get(key);
  if (!session) throw new Error(`no ws session for id ${JSON.stringify(key)}`);
  return session;
}

/** Compare an expected WS frame against the actual payload. */
export function diffWsMessage(step: WsExpectStep, actual: unknown): string | null {
  const mode = step.match ?? 'exact';
  if (mode === 'partial') {
    return partialMatch(step.msg, actual, '$');
  }
  if (!deepEqual(step.msg, actual)) {
    return `ws message mismatch: expected ${stableStringify(step.msg)}, got ${stableStringify(actual)}`;
  }
  return null;
}

function partialMatch(expected: unknown, actual: unknown, path: string): string | null {
  if (expected === null || typeof expected !== 'object' || Array.isArray(expected)) {
    if (!deepEqual(expected, actual)) {
      return `ws partial mismatch at ${path}: expected ${stableStringify(expected)}, got ${stableStringify(actual)}`;
    }
    return null;
  }
  if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
    return `ws partial mismatch at ${path}: expected object, got ${stableStringify(actual)}`;
  }
  const expObj = expected as Record<string, unknown>;
  const actObj = actual as Record<string, unknown>;
  for (const [key, expVal] of Object.entries(expObj)) {
    const childPath = `${path}.${key}`;
    if (typeof expVal === 'string' && expVal.startsWith('re:')) {
      const actualVal = actObj[key];
      if (typeof actualVal !== 'string' || !new RegExp(expVal.slice(3)).test(actualVal)) {
        return `ws partial mismatch at ${childPath}: expected ${expVal}, got ${JSON.stringify(actualVal)}`;
      }
      continue;
    }
    const err = partialMatch(expVal, actObj[key], childPath);
    if (err) return err;
  }
  return null;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (Array.isArray(b)) return false;
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = Object.keys(ao);
  if (keys.length !== Object.keys(bo).length) return false;
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false;
    if (!deepEqual(ao[k], bo[k])) return false;
  }
  return true;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[k] = (v as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return v;
  });
}