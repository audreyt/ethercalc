import { describe, it, expect } from 'vitest';

import { NORMALIZATION_RULES, type Scenario } from '../src/oracle-scenarios.ts';

describe('NORMALIZATION_RULES', () => {
  it('has an entry for every BodyMatcher variant', () => {
    expect(Object.keys(NORMALIZATION_RULES).sort()).toEqual(
      ['exact', 'html', 'ignore', 'json', 'ods', 'scsave', 'xlsx'].sort(),
    );
  });

  it('each rule is a non-empty string', () => {
    for (const rule of Object.values(NORMALIZATION_RULES)) {
      expect(rule).toMatch(/\S/);
    }
  });
});

describe('Scenario type', () => {
  it('accepts an http scenario literal', () => {
    const s: Scenario = {
      name: 'GET-root',
      kind: 'http',
      request: { method: 'GET', path: '/' },
      expect: {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        bodyBase64: null,
      },
    };
    expect(s.kind).toBe('http');
  });

  it('accepts a ws scenario literal', () => {
    const s: Scenario = {
      name: 'ws-ask-log',
      kind: 'ws',
      steps: [
        { type: 'connect', url: 'wss://x/_ws/r?user=u' },
        { type: 'send', msg: { type: 'ask.log', room: 'r', user: 'u' } },
        { type: 'expect', msg: { type: 'log' }, match: 'partial' },
        { type: 'close' },
      ],
    };
    expect(s.kind).toBe('ws');
    expect(s.steps).toHaveLength(4);
  });
});
