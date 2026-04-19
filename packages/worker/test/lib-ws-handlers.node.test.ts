/**
 * Pure unit tests for `src/lib/ws-handlers.ts`. Every WS branch mocks a
 * `WsContext` and asserts the expected sequence of storage operations,
 * replies, and broadcasts.
 *
 * See `src/lib/ws-handlers.ts` module docstring for the Phase 7.1 extract
 * rationale. These tests replace the role of workers-pool-only integration
 * tests for branch coverage of the dispatch layer; the integration tests in
 * `ws.test.ts` and `legacy-socketio.test.ts` still exercise the full
 * hibernation-API wiring end-to-end.
 */
import { describe, expect, it, vi } from 'vitest';

import {
  dispatchWsMessage,
  handleAskEcell,
  handleAskEcells,
  handleAskLog,
  handleAskRecalc,
  handleChat,
  handleEcell,
  handleExecute,
  handleMyEcell,
  handleStopHuddle,
  type WsContext,
  type WsSiblingDO,
  type WsStorage,
} from '../src/lib/ws-handlers.ts';

import type { ClientMessage, ServerMessage } from '@ethercalc/shared/messages';

// ─── Fake context builders ─────────────────────────────────────────────────

interface StorageState {
  snapshot: string | undefined;
  log: Map<string, string>;
  chat: Map<string, string>;
  ecell: Map<string, string>;
  wiped: number;
}

function makeStorage(state: StorageState): WsStorage {
  let logSeq = state.log.size;
  let chatSeq = state.chat.size;
  return {
    async listPrefix(prefix: string): Promise<string[]> {
      if (prefix === 'log:') {
        return Array.from(state.log.keys()).sort().map((k) => state.log.get(k)!);
      }
      if (prefix === 'chat:') {
        return Array.from(state.chat.keys()).sort().map((k) => state.chat.get(k)!);
      }
      return [];
    },
    async listHash(prefix: string): Promise<Record<string, string>> {
      const out: Record<string, string> = {};
      if (prefix === 'ecell:') {
        for (const [k, v] of state.ecell) out[k] = v;
      }
      return out;
    },
    async putHash(prefix: string, key: string, value: string): Promise<void> {
      if (prefix === 'ecell:') state.ecell.set(key, value);
      else throw new Error(`unexpected putHash prefix: ${prefix}`);
    },
    async appendLog(prefix: string, value: string): Promise<void> {
      if (prefix === 'chat:') {
        state.chat.set(`chat:${String(chatSeq++).padStart(10, '0')}`, value);
      } else if (prefix === 'log:') {
        state.log.set(`log:${String(logSeq++).padStart(10, '0')}`, value);
      } else {
        throw new Error(`unexpected appendLog prefix: ${prefix}`);
      }
    },
    async getSnapshot(): Promise<string | undefined> {
      return state.snapshot as string | undefined;
    },
    async deleteAll(): Promise<void> {
      state.snapshot = undefined;
      state.log.clear();
      state.chat.clear();
      state.ecell.clear();
      state.wiped += 1;
    },
  };
}

interface CallLog {
  replies: ServerMessage[];
  broadcasts: Array<{ msg: ServerMessage; includeSelf: boolean }>;
  applied: string[];
  siblingFetches: Array<{ room: string; path: string; init: RequestInit | undefined }>;
}

interface MakeCtxOpts {
  authOk?: boolean;
  state?: StorageState;
  siblingFetchFails?: boolean;
  siblingResponseStatus?: number;
}

function makeCtx(opts: MakeCtxOpts = {}): { ctx: WsContext; calls: CallLog; state: StorageState } {
  const state: StorageState = opts.state ?? {
    snapshot: undefined,
    log: new Map(),
    chat: new Map(),
    ecell: new Map(),
    wiped: 0,
  };
  const calls: CallLog = {
    replies: [],
    broadcasts: [],
    applied: [],
    siblingFetches: [],
  };
  const ctx: WsContext = {
    room: 'r',
    user: 'u',
    auth: 'h',
    storage: makeStorage(state),
    async applyCommand(cmdstr: string): Promise<void> {
      calls.applied.push(cmdstr);
      state.log.set(
        `log:${String(state.log.size).padStart(10, '0')}`,
        cmdstr,
      );
      state.snapshot = 'SNAP';
    },
    async broadcast(msg, includeSelf) {
      calls.broadcasts.push({ msg, includeSelf });
    },
    async reply(msg) {
      calls.replies.push(msg);
    },
    async verifyAuth() {
      return opts.authOk !== false;
    },
    siblingDo(room: string): WsSiblingDO {
      return {
        async fetch(path: string, init?: RequestInit): Promise<Response> {
          calls.siblingFetches.push({ room, path, init });
          if (opts.siblingFetchFails) throw new Error('sibling gone');
          return new Response(null, { status: opts.siblingResponseStatus ?? 202 });
        },
      };
    },
  };
  return { ctx, calls, state };
}

// ─── Handler-by-handler coverage ───────────────────────────────────────────

describe('handleChat', () => {
  it('persists chat to storage and broadcasts to peers (not self)', async () => {
    const { ctx, calls, state } = makeCtx();
    await handleChat(ctx, { type: 'chat', room: 'r', user: 'u', msg: 'hi' });
    expect(Array.from(state.chat.values())).toEqual(['hi']);
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!).toEqual({
      msg: { type: 'chat', room: 'r', user: 'u', msg: 'hi' },
      includeSelf: false,
    });
    expect(calls.replies).toHaveLength(0);
  });

  it('appends multiple chat messages in order', async () => {
    const { ctx, state } = makeCtx();
    await handleChat(ctx, { type: 'chat', room: 'r', user: 'u', msg: 'a' });
    await handleChat(ctx, { type: 'chat', room: 'r', user: 'u', msg: 'b' });
    expect(Array.from(state.chat.values())).toEqual(['a', 'b']);
  });
});

describe('handleAskEcells', () => {
  it('replies with the full ecells map, no broadcast', async () => {
    const state: StorageState = {
      snapshot: undefined,
      log: new Map(),
      chat: new Map(),
      ecell: new Map([['alice', 'A1'], ['bob', 'B2']]),
      wiped: 0,
    };
    const { ctx, calls } = makeCtx({ state });
    await handleAskEcells(ctx, { type: 'ask.ecells', room: 'r' });
    expect(calls.replies).toEqual([
      { type: 'ecells', room: 'r', ecells: { alice: 'A1', bob: 'B2' } },
    ]);
    expect(calls.broadcasts).toHaveLength(0);
  });

  it('replies with an empty ecells map when no ecells stored', async () => {
    const { ctx, calls } = makeCtx();
    await handleAskEcells(ctx, { type: 'ask.ecells', room: 'r' });
    expect(calls.replies[0]!).toEqual({
      type: 'ecells',
      room: 'r',
      ecells: {},
    });
  });
});

describe('handleMyEcell', () => {
  it('persists the user cell and broadcasts to peers', async () => {
    const { ctx, calls, state } = makeCtx();
    await handleMyEcell(ctx, {
      type: 'my.ecell',
      room: 'r',
      user: 'alice',
      ecell: 'A1',
    });
    expect(state.ecell.get('alice')).toBe('A1');
    expect(calls.broadcasts).toEqual([
      {
        msg: { type: 'my.ecell', room: 'r', user: 'alice', ecell: 'A1' },
        includeSelf: false,
      },
    ]);
  });

  it('skips storage write when user is empty but still broadcasts', async () => {
    const { ctx, calls, state } = makeCtx();
    await handleMyEcell(ctx, {
      type: 'my.ecell',
      room: 'r',
      user: '',
      ecell: 'C3',
    });
    expect(state.ecell.size).toBe(0);
    expect(calls.broadcasts).toHaveLength(1);
  });

  it('upserts an existing user to a new cell', async () => {
    const state: StorageState = {
      snapshot: undefined,
      log: new Map(),
      chat: new Map(),
      ecell: new Map([['alice', 'A1']]),
      wiped: 0,
    };
    const { ctx } = makeCtx({ state });
    await handleMyEcell(ctx, {
      type: 'my.ecell',
      room: 'r',
      user: 'alice',
      ecell: 'D4',
    });
    expect(state.ecell.get('alice')).toBe('D4');
  });
});

describe('handleExecute', () => {
  it('drops silently when auth fails', async () => {
    const { ctx, calls } = makeCtx({ authOk: false });
    await handleExecute(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'set A1 value n 1',
    });
    expect(calls.applied).toHaveLength(0);
    expect(calls.broadcasts).toHaveLength(0);
    expect(calls.siblingFetches).toHaveLength(0);
  });

  it('drops silently on the text-wiki filter command', async () => {
    const { ctx, calls } = makeCtx();
    await handleExecute(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'set sheet defaulttextvalueformat text-wiki',
    });
    expect(calls.applied).toHaveLength(0);
    expect(calls.broadcasts).toHaveLength(0);
  });

  it('applies a normal command, then broadcasts with includeSelf=false', async () => {
    const { ctx, calls, state } = makeCtx();
    await handleExecute(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'set A1 value n 1',
    });
    expect(calls.applied).toEqual(['set A1 value n 1']);
    expect(state.snapshot).toBe('SNAP');
    expect(Array.from(state.log.values())).toEqual(['set A1 value n 1']);
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.includeSelf).toBe(false);
    expect(calls.broadcasts[0]!.msg.type).toBe('execute');
  });

  it('broadcast payload carries auth field through when supplied', async () => {
    const { ctx, calls } = makeCtx();
    await handleExecute(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      auth: 'abc',
      cmdstr: 'set A1 value n 1',
    });
    const frame = calls.broadcasts[0]!.msg as ServerMessage & { auth?: string };
    expect(frame.auth).toBe('abc');
  });

  it('submitform forwards sibling commands and broadcasts with includeSelf=true', async () => {
    const { ctx, calls } = makeCtx();
    await handleExecute(ctx, {
      type: 'execute',
      room: 'mysheet',
      user: 'u',
      cmdstr: 'submitform\rset A1 value n 1\rset A2 value n 2',
    });
    expect(calls.applied).toHaveLength(0);
    expect(calls.siblingFetches).toHaveLength(1);
    expect(calls.siblingFetches[0]!.room).toBe('mysheet_formdata');
    expect(calls.siblingFetches[0]!.path).toBe('https://do.local/_do/commands');
    expect(calls.siblingFetches[0]!.init?.method).toBe('POST');
    expect(calls.siblingFetches[0]!.init?.body).toBe(
      'set A1 value n 1\rset A2 value n 2',
    );
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.includeSelf).toBe(true);
    const execFrame = calls.broadcasts[0]!.msg as ServerMessage & {
      include_self?: boolean;
    };
    expect(execFrame.include_self).toBe(true);
  });

  it('submitform on a room already suffixed _formdata keeps the same room', async () => {
    const { ctx, calls } = makeCtx();
    await handleExecute(ctx, {
      type: 'execute',
      room: 'x_formdata',
      user: 'u',
      cmdstr: 'submitform\rset A1 value n 1',
    });
    expect(calls.siblingFetches[0]!.room).toBe('x_formdata');
  });

  it('submitform with no payload skips sibling fetch but still broadcasts', async () => {
    const { ctx, calls } = makeCtx();
    await handleExecute(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'submitform',
    });
    expect(calls.siblingFetches).toHaveLength(0);
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.includeSelf).toBe(true);
  });

  it('submitform still broadcasts when sibling fetch throws', async () => {
    const { ctx, calls } = makeCtx({ siblingFetchFails: true });
    await handleExecute(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'submitform\rset A1 value n 1',
    });
    expect(calls.siblingFetches).toHaveLength(1);
    expect(calls.broadcasts).toHaveLength(1);
  });

  it('submitform tolerates a non-2xx sibling response (never throws)', async () => {
    const { ctx, calls } = makeCtx({ siblingResponseStatus: 502 });
    await handleExecute(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'submitform\rrow',
    });
    expect(calls.siblingFetches).toHaveLength(1);
    expect(calls.broadcasts).toHaveLength(1);
  });
});

describe('handleAskLog', () => {
  it('replies with snapshot + log + chat from storage', async () => {
    const state: StorageState = {
      snapshot: 'SAVE',
      log: new Map([['log:0000000000', 'cmd-1']]),
      chat: new Map([['chat:0000000000', 'hi']]),
      ecell: new Map(),
      wiped: 0,
    };
    const { ctx, calls } = makeCtx({ state });
    await handleAskLog(ctx, { type: 'ask.log', room: 'r', user: 'u' });
    expect(calls.replies).toEqual([
      {
        type: 'log',
        room: 'r',
        log: ['cmd-1'],
        chat: ['hi'],
        snapshot: 'SAVE',
      },
    ]);
    expect(calls.broadcasts).toHaveLength(0);
  });

  it('replies with empty arrays and empty snapshot when storage is clean', async () => {
    const { ctx, calls } = makeCtx();
    await handleAskLog(ctx, { type: 'ask.log', room: 'r', user: 'u' });
    expect(calls.replies[0]!).toEqual({
      type: 'log',
      room: 'r',
      log: [],
      chat: [],
      snapshot: '',
    });
  });
});

describe('handleAskRecalc', () => {
  it('replies with recalc payload containing snapshot + log', async () => {
    const state: StorageState = {
      snapshot: 'SAVE',
      log: new Map([
        ['log:0000000000', 'a'],
        ['log:0000000001', 'b'],
      ]),
      chat: new Map([['chat:0000000000', 'hi']]),
      ecell: new Map(),
      wiped: 0,
    };
    const { ctx, calls } = makeCtx({ state });
    await handleAskRecalc(ctx, { type: 'ask.recalc', room: 'r' });
    expect(calls.replies[0]!).toEqual({
      type: 'recalc',
      room: 'r',
      log: ['a', 'b'],
      snapshot: 'SAVE',
    });
  });

  it('returns empty snapshot when none stored', async () => {
    const { ctx, calls } = makeCtx();
    await handleAskRecalc(ctx, { type: 'ask.recalc', room: 'r' });
    const frame = calls.replies[0] as ServerMessage & { snapshot: string };
    expect(frame.snapshot).toBe('');
  });
});

describe('handleStopHuddle', () => {
  it('drops silently when auth fails', async () => {
    const state: StorageState = {
      snapshot: 'SAVE',
      log: new Map([['log:0000000000', 'x']]),
      chat: new Map(),
      ecell: new Map(),
      wiped: 0,
    };
    const { ctx, calls } = makeCtx({ authOk: false, state });
    await handleStopHuddle(ctx, { type: 'stopHuddle', room: 'r' });
    expect(calls.broadcasts).toHaveLength(0);
    expect(state.wiped).toBe(0);
    expect(state.snapshot).toBe('SAVE');
  });

  it('wipes storage and broadcasts stopHuddle on successful auth', async () => {
    const state: StorageState = {
      snapshot: 'SAVE',
      log: new Map([['log:0000000000', 'x']]),
      chat: new Map([['chat:0000000000', 'hi']]),
      ecell: new Map([['alice', 'A1']]),
      wiped: 0,
    };
    const { ctx, calls } = makeCtx({ state });
    await handleStopHuddle(ctx, { type: 'stopHuddle', room: 'r' });
    expect(state.wiped).toBe(1);
    expect(state.snapshot).toBeUndefined();
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.msg).toEqual({ type: 'stopHuddle', room: 'r' });
    // Peers-only — sender already knows it stopped the huddle.
    expect(calls.broadcasts[0]!.includeSelf).toBe(false);
  });

  it('preserves auth field on the broadcast payload when supplied', async () => {
    const { ctx, calls } = makeCtx();
    await handleStopHuddle(ctx, {
      type: 'stopHuddle',
      room: 'r',
      auth: 'h',
    });
    const frame = calls.broadcasts[0]!.msg as ServerMessage & { auth?: string };
    expect(frame.auth).toBe('h');
  });
});

describe('handleEcell', () => {
  it('drops silently when auth fails', async () => {
    const { ctx, calls } = makeCtx({ authOk: false });
    await handleEcell(ctx, {
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
    });
    expect(calls.broadcasts).toHaveLength(0);
  });

  it('broadcasts the ecell frame (not persisted) when auth OK', async () => {
    const { ctx, calls, state } = makeCtx();
    await handleEcell(ctx, {
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
    });
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.msg).toEqual({
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
    });
    // `ecell` is a broadcast-only frame; it does NOT touch storage.
    expect(state.ecell.size).toBe(0);
    // Peers only — sender already knows its own cursor.
    expect(calls.broadcasts[0]!.includeSelf).toBe(false);
  });

  it('preserves original + auth optional fields in the broadcast', async () => {
    const { ctx, calls } = makeCtx();
    await handleEcell(ctx, {
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
      original: 'B2',
      auth: 'h',
    });
    const frame = calls.broadcasts[0]!.msg as ServerMessage & {
      original?: string;
      auth?: string;
    };
    expect(frame.original).toBe('B2');
    expect(frame.auth).toBe('h');
  });
});

describe('handleAskEcell', () => {
  // Cursor-poll relay (new after the 2026-04-20 browser smoke found the
  // legacy catch-all `@on data` rebroadcast was missing). No storage
  // touch; no auth gate; pure peer-only broadcast.
  it('rebroadcasts the ask.ecell frame to peers without auth', async () => {
    const { ctx, calls, state } = makeCtx({ authOk: false });
    await handleAskEcell(ctx, { type: 'ask.ecell', room: 'r', user: 'alice' });
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.msg).toEqual({
      type: 'ask.ecell',
      room: 'r',
      user: 'alice',
    });
    expect(calls.broadcasts[0]!.includeSelf).toBe(false);
    expect(state.ecell.size).toBe(0);
    expect(state.log.size).toBe(0);
    expect(state.chat.size).toBe(0);
    expect(calls.replies).toHaveLength(0);
    expect(calls.applied).toHaveLength(0);
  });
});

// ─── dispatchWsMessage routing ─────────────────────────────────────────────

describe('dispatchWsMessage', () => {
  it('routes chat', async () => {
    const { ctx, calls, state } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'chat',
      room: 'r',
      user: 'u',
      msg: 'x',
    });
    expect(Array.from(state.chat.values())).toEqual(['x']);
    expect(calls.broadcasts).toHaveLength(1);
  });

  it('routes ask.ecells', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, { type: 'ask.ecells', room: 'r' });
    expect(calls.replies).toHaveLength(1);
    expect(calls.replies[0]!.type).toBe('ecells');
  });

  it('routes my.ecell', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'my.ecell',
      room: 'r',
      user: 'alice',
      ecell: 'A1',
    });
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.msg.type).toBe('my.ecell');
  });

  it('routes execute', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'set A1 value n 1',
    });
    expect(calls.applied).toEqual(['set A1 value n 1']);
  });

  it('routes ask.log', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, { type: 'ask.log', room: 'r', user: 'u' });
    expect(calls.replies).toHaveLength(1);
    expect(calls.replies[0]!.type).toBe('log');
  });

  it('routes ask.recalc', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, { type: 'ask.recalc', room: 'r' });
    expect(calls.replies).toHaveLength(1);
    expect(calls.replies[0]!.type).toBe('recalc');
  });

  it('routes stopHuddle', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, { type: 'stopHuddle', room: 'r' });
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.msg.type).toBe('stopHuddle');
  });

  it('routes ecell', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
    });
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.msg.type).toBe('ecell');
  });

  it('routes ask.ecell (cursor poll) and rebroadcasts to peers', async () => {
    const { ctx, calls, state } = makeCtx();
    await dispatchWsMessage(ctx, { type: 'ask.ecell', room: 'r', user: 'asker' });
    expect(calls.broadcasts).toHaveLength(1);
    expect(calls.broadcasts[0]!.msg).toEqual({
      type: 'ask.ecell',
      room: 'r',
      user: 'asker',
    });
    // Not include_self (peers only).
    expect(calls.broadcasts[0]!.includeSelf).toBe(false);
    // No storage writes (pure relay).
    expect(state.log.size).toBe(0);
    expect(state.chat.size).toBe(0);
    expect(state.ecell.size).toBe(0);
    expect(calls.replies).toHaveLength(0);
  });

  it('never-case: dispatch with a fabricated unknown type is a no-op', async () => {
    // We force-cast through `unknown` to bypass the TS exhaustiveness
    // check; at runtime the switch default is the only remaining branch
    // and exits cleanly.
    const { ctx, calls } = makeCtx();
    const fabricated = {
      type: 'not-a-real-type',
      room: 'r',
    } as unknown as ClientMessage;
    await dispatchWsMessage(ctx, fabricated);
    expect(calls.broadcasts).toHaveLength(0);
    expect(calls.replies).toHaveLength(0);
    expect(calls.applied).toHaveLength(0);
  });
});

// ─── Integration-style tests exercising the full dispatcher surface ────────

describe('dispatchWsMessage end-to-end interactions', () => {
  it('chat + ask.log sequence echoes the chat back on query', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'chat',
      room: 'r',
      user: 'alice',
      msg: 'hello',
    });
    await dispatchWsMessage(ctx, { type: 'ask.log', room: 'r', user: 'u' });
    const logReply = calls.replies.find((r) => r.type === 'log') as
      | (ServerMessage & { chat: string[] })
      | undefined;
    expect(logReply?.chat).toEqual(['hello']);
  });

  it('execute + ask.log sequence returns the applied command', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'execute',
      room: 'r',
      user: 'alice',
      cmdstr: 'set A1 value n 42',
    });
    await dispatchWsMessage(ctx, { type: 'ask.log', room: 'r', user: 'u' });
    const logReply = calls.replies.find((r) => r.type === 'log') as
      | (ServerMessage & { log: string[]; snapshot: string })
      | undefined;
    expect(logReply?.log).toEqual(['set A1 value n 42']);
    expect(logReply?.snapshot).toBe('SNAP');
  });

  it('my.ecell + ask.ecells sequence returns the stored cursor', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'my.ecell',
      room: 'r',
      user: 'alice',
      ecell: 'C3',
    });
    await dispatchWsMessage(ctx, { type: 'ask.ecells', room: 'r' });
    const reply = calls.replies.find((r) => r.type === 'ecells') as
      | (ServerMessage & { ecells: Record<string, string> })
      | undefined;
    expect(reply?.ecells).toEqual({ alice: 'C3' });
  });

  it('stopHuddle wipes after prior chat/log entries', async () => {
    const { ctx, calls, state } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'chat',
      room: 'r',
      user: 'u',
      msg: 'hi',
    });
    await dispatchWsMessage(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'set A1 value n 1',
    });
    await dispatchWsMessage(ctx, { type: 'stopHuddle', room: 'r' });
    expect(state.wiped).toBe(1);
    expect(state.log.size).toBe(0);
    expect(state.chat.size).toBe(0);
    // And a stopHuddle broadcast follows.
    expect(
      calls.broadcasts.some((b) => b.msg.type === 'stopHuddle'),
    ).toBe(true);
  });
});

// ─── Context wiring edge cases ─────────────────────────────────────────────

describe('WsContext wiring corners', () => {
  it('verifyAuth returning false gates both stopHuddle and ecell independently', async () => {
    const { ctx, calls, state } = makeCtx({ authOk: false });
    await dispatchWsMessage(ctx, { type: 'stopHuddle', room: 'r' });
    await dispatchWsMessage(ctx, {
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
    });
    expect(calls.broadcasts).toHaveLength(0);
    expect(state.wiped).toBe(0);
  });

  it('verifyAuth is only called for write/ecell types (not ask.* or chat/my.ecell)', async () => {
    const authSpy = vi.fn<() => Promise<boolean>>(async () => true);
    const base = makeCtx();
    const ctx: WsContext = { ...base.ctx, verifyAuth: authSpy };
    await dispatchWsMessage(ctx, {
      type: 'chat',
      room: 'r',
      user: 'u',
      msg: 'x',
    });
    await dispatchWsMessage(ctx, { type: 'ask.ecells', room: 'r' });
    await dispatchWsMessage(ctx, {
      type: 'my.ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
    });
    await dispatchWsMessage(ctx, { type: 'ask.log', room: 'r', user: 'u' });
    await dispatchWsMessage(ctx, { type: 'ask.recalc', room: 'r' });
    await dispatchWsMessage(ctx, { type: 'ask.ecell', room: 'r', user: 'u' });
    expect(authSpy).not.toHaveBeenCalled();
  });

  it('broadcast receives the exact frame produced by the builder helpers', async () => {
    const { ctx, calls } = makeCtx();
    await dispatchWsMessage(ctx, {
      type: 'execute',
      room: 'r',
      user: 'u',
      auth: 'hmac',
      cmdstr: 'set A1 value n 1',
    });
    const frame = calls.broadcasts[0]!.msg as ServerMessage & {
      auth?: string;
      include_self?: boolean;
      cmdstr?: string;
    };
    expect(frame.type).toBe('execute');
    expect(frame.cmdstr).toBe('set A1 value n 1');
    expect(frame.auth).toBe('hmac');
    expect(frame.include_self).toBeUndefined();
  });
});
