import type { WsExpectStep, WsScenario } from '@ethercalc/shared/oracle-scenarios';

import { ORACLE_PHASE3_TEMPLATE_ROOM } from './scenarios/fixtures.ts';

export type WsNormalizeHook = (scenario: WsScenario) => WsScenario;

/** Clone-room suffix left behind by `GET /:template/form` (FINDINGS F-13). */
export const FORM_CLONE_ROOM_RE = new RegExp(
  `^${ORACLE_PHASE3_TEMPLATE_ROOM}_[a-z0-9]{12}$`,
);

/** Bare 12-char rooms left behind by /_from/:template and POST /_ replay scenarios. */
export const AUTOGEN_ROOM_RE = /^[a-z0-9]{12}$/;

export function isReplayGeneratedRoom(room: string): boolean {
  return FORM_CLONE_ROOM_RE.test(room) || AUTOGEN_ROOM_RE.test(room);
}

/**
 * Rewrite volatile fields in recorded WS expect steps. Applied after the
 * recorder captures live oracle frames, before persisting JSON artifacts.
 */
export const WS_NORMALIZERS: Readonly<Record<string, WsNormalizeHook>> = {
  'ws/ask-log': (scenario) => normalizeAskLogExpect(scenario),
  'ws/execute-command': (scenario) => normalizeExecuteExpect(scenario),
  'ws/ask-recalc': (scenario) => normalizeAskRecalcExpect(scenario),
  'ws/chat': (scenario) => normalizeAskLogExpect(scenario),
  'ws/ask-ecell': (scenario) => normalizeAskLogExpect(scenario),
  'ws/stop-huddle': (scenario) => normalizeAskLogExpect(scenario),
  'ws/ecell': (scenario) => normalizeAskLogExpect(scenario),
};

export function getWsNormalizer(name: string): WsNormalizeHook | null {
  return WS_NORMALIZERS[name] ?? null;
}

export function applyWsNormalizer(scenario: WsScenario): WsScenario {
  const hook = getWsNormalizer(scenario.name);
  return hook ? hook(scenario) : scenario;
}

function normalizeAskLogExpect(scenario: WsScenario): WsScenario {
  return {
    ...scenario,
    steps: scenario.steps.map((step) => {
      if (step.type !== 'expect') return step;
      const msg = step.msg as { snapshot?: string };
      if (typeof msg.snapshot !== 'string') return step;
      return {
        ...step,
        match: 'partial' as const,
        msg: {
          type: 'log',
          room: (msg as { room?: string }).room,
          log: (msg as { log?: unknown }).log ?? [],
          chat: (msg as { chat?: unknown }).chat ?? [],
          snapshot: 're:.*',
        },
      };
    }),
  };
}

function normalizeExecuteExpect(scenario: WsScenario): WsScenario {
  return {
    ...scenario,
    steps: scenario.steps.map((step) => {
      if (step.type !== 'expect') return step;
      const msg = step.msg as { snapshot?: string; type?: string };
      if (msg.type !== 'log' || typeof msg.snapshot !== 'string') return step;
      return normalizeAskLogExpectStep(step);
    }),
  };
}

function normalizeAskLogExpectStep(step: WsExpectStep): WsExpectStep {
  const msg = step.msg as { room?: string; log?: unknown; chat?: unknown };
  return {
    ...step,
    match: 'partial',
    msg: {
      type: 'log',
      room: msg.room,
      log: msg.log ?? [],
      chat: msg.chat ?? [],
      snapshot: 're:.*ws-phase3.*',
    },
  };
}

function normalizeAskRecalcExpect(scenario: WsScenario): WsScenario {
  return {
    ...scenario,
    steps: scenario.steps.map((step) => {
      if (step.type !== 'expect') return step;
      const msg = step.msg as { type?: string; room?: string; log?: unknown; snapshot?: string };
      if (msg.type !== 'recalc' || typeof msg.snapshot !== 'string') return step;
      return {
        ...step,
        match: 'partial' as const,
        msg: {
          type: 'recalc',
          room: msg.room,
          log: msg.log ?? [],
          snapshot: 're:.*',
        },
      };
    }),
  };
}