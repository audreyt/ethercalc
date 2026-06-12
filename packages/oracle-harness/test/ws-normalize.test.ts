import { describe, expect, it } from 'vitest';

import { applyWsNormalizer, FORM_CLONE_ROOM_RE, getWsNormalizer } from '../src/ws-normalize.ts';
import type { WsScenario } from '@ethercalc/shared/oracle-scenarios';

describe('FORM_CLONE_ROOM_RE', () => {
  it('matches template clone suffix rooms', () => {
    expect(FORM_CLONE_ROOM_RE.test('oracle-phase3-template_abc123def456')).toBe(true);
    expect(FORM_CLONE_ROOM_RE.test('oracle-phase3-template')).toBe(false);
  });
});

describe('WS_NORMALIZERS', () => {
  it('relaxes ask.log snapshot to a regex partial match', () => {
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [
        {
          type: 'expect',
          msg: {
            type: 'log',
            room: 'r',
            log: [],
            chat: [],
            snapshot: 'version:1.5\ncell:A1:t:oracle',
          },
        },
      ],
    };
    const out = applyWsNormalizer(scenario);
    expect(out.steps[0]).toMatchObject({
      match: 'partial',
      msg: { snapshot: 're:.*' },
    });
  });

  it('defaults missing log/chat arrays during ask-log normalization', () => {
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [
        {
          type: 'expect',
          msg: { type: 'log', room: 'r', snapshot: 'cell:A1:t:oracle' },
        },
      ],
    };
    const out = applyWsNormalizer(scenario);
    expect(out.steps[0]).toMatchObject({
      msg: { log: [], chat: [], snapshot: 're:.*' },
    });
  });

  it('preserves explicit log/chat arrays in ask-log normalization', () => {
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [
        {
          type: 'expect',
          msg: {
            type: 'log',
            room: 'r',
            log: ['a'],
            chat: ['b'],
            snapshot: 'cell:A1:t:oracle',
          },
        },
      ],
    };
    const out = applyWsNormalizer(scenario);
    expect(out.steps[0]).toMatchObject({
      msg: { log: ['a'], chat: ['b'], snapshot: 're:.*' },
    });
  });

  it('skips expect steps without a string snapshot', () => {
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [{ type: 'expect', msg: { type: 'log', snapshot: 42 } }],
    };
    expect(applyWsNormalizer(scenario).steps[0]).toEqual(scenario.steps[0]);
  });

  it('leaves non-log expect steps unchanged in ask-log normalizer', () => {
    const scenario: WsScenario = {
      name: 'ws/ask-log',
      kind: 'ws',
      steps: [{ type: 'expect', msg: { type: 'execute', room: 'r' } }],
    };
    expect(applyWsNormalizer(scenario).steps[0]).toEqual(scenario.steps[0]);
  });

  it('defaults missing log/chat in execute-command normalization', () => {
    const scenario: WsScenario = {
      name: 'ws/execute-command',
      kind: 'ws',
      steps: [
        {
          type: 'expect',
          msg: { type: 'log', room: 'r', snapshot: 'cell:A1:t:ws-phase3' },
        },
      ],
    };
    const out = applyWsNormalizer(scenario);
    expect(out.steps[0]).toMatchObject({
      msg: { log: [], chat: [], snapshot: 're:.*ws-phase3.*' },
    });
  });

  it('normalizes execute-command log snapshots', () => {
    const scenario: WsScenario = {
      name: 'ws/execute-command',
      kind: 'ws',
      steps: [
        {
          type: 'expect',
          msg: {
            type: 'log',
            room: 'r',
            log: ['x'],
            chat: ['y'],
            snapshot: 'cell:A1:t:ws-phase3',
          },
        },
      ],
    };
    const out = applyWsNormalizer(scenario);
    expect(out.steps[0]).toMatchObject({
      match: 'partial',
      msg: { log: ['x'], chat: ['y'], snapshot: 're:.*ws-phase3.*' },
    });
  });

  it('leaves non-log execute expects unchanged', () => {
    const scenario: WsScenario = {
      name: 'ws/execute-command',
      kind: 'ws',
      steps: [{ type: 'expect', msg: { type: 'execute', room: 'r' } }],
    };
    expect(applyWsNormalizer(scenario).steps[0]).toEqual(scenario.steps[0]);
  });

  it('returns null for unknown scenarios', () => {
    expect(getWsNormalizer('ws/connect')).toBeNull();
  });
});