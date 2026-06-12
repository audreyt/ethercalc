import { describe, expect, it, vi } from 'vitest';

import { encodeBase64 } from '../src/matchers.ts';
import { diffWsMessage, runWsScenario } from '../src/ws-runner.ts';
import type { WsEvent, WsLike } from '../src/ws-transport.ts';
import { stubIoClient } from './ws-mock.ts';
import type { WsScenario } from '@ethercalc/shared/oracle-scenarios';

class MockWebSocket implements WsLike {
  readyState = 1;
  private listeners = new Map<string, Array<(ev: WsEvent) => void>>();

  send = vi.fn();
  close = vi.fn();

  addEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
    const bucket = this.listeners.get(type) ?? [];
    bucket.push(listener);
    this.listeners.set(type, bucket);
    if (type === 'open') queueMicrotask(() => listener({}));
  }

  removeEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
    const bucket = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      bucket.filter((l) => l !== listener),
    );
  }

  emit(data: string) {
    for (const listener of this.listeners.get('message') ?? []) listener({ data });
  }
}

function wsFactory(sockets: MockWebSocket[]): (url: string) => WsLike {
  return () => {
    const ws = new MockWebSocket();
    sockets.push(ws);
    return ws;
  };
}

describe('diffWsMessage', () => {
  it('supports partial matching with re: fields', () => {
    const err = diffWsMessage(
      {
        type: 'expect',
        msg: { type: 'log', snapshot: 're:.*oracle.*' },
        match: 'partial',
      },
      { type: 'log', snapshot: 'cell:A1:t:oracle' },
    );
    expect(err).toBeNull();
  });

  it('reports mismatches in exact mode', () => {
    const err = diffWsMessage(
      { type: 'expect', msg: { type: 'log', room: 'a' } },
      { type: 'log', room: 'b' },
    );
    expect(err).toMatch(/mismatch/);
  });
});

describe('runWsScenario', () => {
  it('records connect/close over socket.io 1.x transport', async () => {
    const stub = stubIoClient();
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'close' },
      ],
    };
    const result = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'socketio',
      mode: 'record',
      ioClientFactory: stub.factory,
    });
    expect(result.ok).toBe(true);
  });

  it('records connect/send/expect steps over native transport', async () => {
    const sockets: MockWebSocket[] = [];
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'send', msg: { type: 'ask.log', room: 'r', user: 'u' } },
        { type: 'expect', msg: { type: 'log' }, match: 'partial' },
        { type: 'close' },
      ],
    };
    const run = runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'record',
      wsFactory: wsFactory(sockets),
    });
    queueMicrotask(() => {
      sockets[0]!.emit(JSON.stringify({ type: 'log', room: 'r', log: [], chat: [], snapshot: '' }));
    });
    const result = await run;
    expect(result.ok).toBe(true);
    const expectStep = result.scenario!.steps.find((s) => s.type === 'expect');
    expect(expectStep).toMatchObject({
      type: 'expect',
      match: 'partial',
      msg: { type: 'log', room: 'r', log: [], chat: [], snapshot: 're:.*' },
    });
  });

  it('replays and asserts recorded expectations', async () => {
    const sockets: MockWebSocket[] = [];
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        {
          type: 'expect',
          msg: { type: 'log', room: 'r' },
          match: 'partial',
        },
        { type: 'close' },
      ],
    };
    const run = runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      wsFactory: wsFactory(sockets),
    });
    queueMicrotask(() => {
      sockets[0]!.emit(JSON.stringify({ type: 'log', room: 'r', log: [] }));
    });
    const result = await run;
    expect(result.ok).toBe(true);
  });

  it('records inline http setup steps', async () => {
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [
        {
          type: 'http',
          request: { method: 'PUT', path: '/_/r', bodyBase64: encodeBase64(new Uint8Array([1])) },
        },
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'close' },
      ],
    };
    const fetcher: typeof fetch = async () =>
      new Response('OK', { status: 201, headers: { 'content-type': 'text/plain' } });
    const result = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'record',
      fetcher,
      wsFactory: wsFactory([]),
    });
    expect(result.ok).toBe(true);
    const httpStep = result.scenario!.steps[0];
    expect(httpStep).toMatchObject({ type: 'http', expect: { status: 201, bodyMatcher: 'exact' } });
  });

  it('fails replay on ws message mismatch and missing session', async () => {
    const sockets: MockWebSocket[] = [];
    const mismatch: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'expect', msg: { type: 'log', room: 'expected' }, match: 'partial' },
      ],
    };
    const run = runWsScenario(mismatch, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      wsFactory: wsFactory(sockets),
    });
    queueMicrotask(() => {
      sockets[0]!.emit(JSON.stringify({ type: 'log', room: 'actual' }));
    });
    const bad = await run;
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/partial mismatch/);

    const noSession: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [{ type: 'send', msg: { type: 'chat' } }],
    };
    await expect(
      runWsScenario(noSession, {
        targetUrl: 'http://host.test',
        transport: 'native',
        mode: 'replay',
        wsFactory: wsFactory([]),
      }),
    ).rejects.toThrow(/no ws session/);
  });

  it('replays inline http steps and reports failures', async () => {
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [
        {
          type: 'http',
          request: { method: 'GET', path: '/_/r' },
          expect: {
            status: 200,
            headers: { 'content-type': 'text/plain' },
            bodyBase64: encodeBase64(new TextEncoder().encode('ok')),
          },
        },
      ],
    };
    const ok = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      fetcher: async () => new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }),
    });
    expect(ok.ok).toBe(true);

    const missingExpect: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [{ type: 'http', request: { method: 'GET', path: '/_/r' } }],
    };
    const noExpect = await runWsScenario(missingExpect, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      fetcher: async () => new Response('ok', { status: 200 }),
    });
    expect(noExpect.ok).toBe(false);

    const statusMismatch = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      fetcher: async () => new Response('ok', { status: 500 }),
    });
    expect(statusMismatch.error).toMatch(/inline http status/);

    const headerMismatch = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      fetcher: async () =>
        new Response('ok', { status: 200, headers: { 'content-type': 'text/html' } }),
    });
    expect(headerMismatch.error).toMatch(/content-type/);

    const bodyMismatch = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      fetcher: async () =>
        new Response('nope', { status: 200, headers: { 'content-type': 'text/plain' } }),
    });
    expect(bodyMismatch.error).toMatch(/length differs/);

    const ignoreBody: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [
        {
          type: 'http',
          request: { method: 'GET', path: '/_/r' },
          expect: {
            status: 200,
            headers: {},
            bodyBase64: encodeBase64(new TextEncoder().encode('recorded')),
            bodyMatcher: 'ignore',
          },
        },
      ],
    };
    const ignored = await runWsScenario(ignoreBody, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      fetcher: async () => new Response('different body', { status: 200 }),
    });
    expect(ignored.ok).toBe(true);
  });

  it('honors sleep steps and multi-id sessions', async () => {
    const sockets: MockWebSocket[] = [];
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u', id: 'a' },
        { type: 'sleep', ms: 1 },
        { type: 'close', id: 'a' },
      ],
    };
    const result = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'record',
      wsFactory: wsFactory(sockets),
    });
    expect(result.ok).toBe(true);
    expect(result.scenario!.steps.map((s) => s.type)).toEqual(['connect', 'sleep', 'close']);
  });

  it('compares exact messages including arrays and nested objects', () => {
    expect(
      diffWsMessage({ type: 'expect', msg: { nested: { ok: true } } }, { nested: { ok: true } }),
    ).toBeNull();
    expect(diffWsMessage({ type: 'expect', msg: null }, { x: 1 })).toMatch(/mismatch/);
    expect(diffWsMessage({ type: 'expect', msg: 1 }, 2)).toMatch(/mismatch/);
    expect(diffWsMessage({ type: 'expect', msg: { a: 1 } }, null)).toMatch(/mismatch/);
    expect(diffWsMessage({ type: 'expect', msg: [1] }, [1, 2])).toMatch(/mismatch/);
    expect(diffWsMessage({ type: 'expect', msg: { a: 1 } }, [1])).toMatch(/mismatch/);
    expect(diffWsMessage({ type: 'expect', msg: { a: 1, b: 2 } }, { a: 1 })).toMatch(/mismatch/);
    expect(diffWsMessage({ type: 'expect', msg: { a: 1 } }, 1)).toMatch(/mismatch/);
    expect(
      diffWsMessage({ type: 'expect', msg: [1, 2] }, [1, 2]),
    ).toBeNull();
    expect(
      diffWsMessage({ type: 'expect', msg: [1, 2] }, [1, 3]),
    ).toMatch(/mismatch/);
    expect(
      diffWsMessage({ type: 'expect', msg: { a: 1, b: 2 } }, { a: 1, c: 2 }),
    ).toMatch(/mismatch/);
    expect(
      diffWsMessage(
        { type: 'expect', msg: { nested: { x: 1 } }, match: 'partial' },
        { nested: 'nope' },
      ),
    ).toMatch(/expected object/);
    expect(
      diffWsMessage(
        { type: 'expect', msg: { id: 're:^[a-z]+$' }, match: 'partial' },
        { id: 42 },
      ),
    ).toMatch(/partial mismatch/);
    expect(diffWsMessage({ type: 'expect', msg: 'x', match: 'partial' }, 'y')).toMatch(
      /partial mismatch/,
    );
  });

  it('returns an error for unknown step types', async () => {
    const scenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [{ type: 'bogus' }],
    } as unknown as WsScenario;
    const result = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      wsFactory: wsFactory([]),
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/unknown ws step/);
  });

  it('fails replay when the expected frame never arrives', async () => {
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'expect', msg: { type: 'log' }, timeoutMs: 30 },
      ],
    };
    const result = await runWsScenario(scenario, {
      targetUrl: 'http://host.test',
      transport: 'native',
      mode: 'replay',
      wsFactory: wsFactory([]),
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/timed out/);
  });
});