/**
 * Exercises the WranglerTarget by stubbing the exec hook. Assertions
 * reason about exact invocations (including SQL escaping).
 */
import { describe, it, expect } from 'vitest';
import { WranglerTarget, type Exec } from '../../src/targets/wrangler.ts';

type Call = { cmd: string; args: string[] };

function recorder(exit = 0, stderr = ''): { exec: Exec; calls: Call[] } {
  const calls: Call[] = [];
  const exec: Exec = (cmd, args) => {
    calls.push({ cmd, args: [...args] });
    return { status: exit, stdout: '', stderr };
  };
  return { exec, calls };
}

describe('WranglerTarget — configuration + defaults', () => {
  it('defaults bunPath and wranglerArgs', () => {
    const { exec } = recorder();
    const t = new WranglerTarget({ d1Name: 'd1', kvName: 'kv', exec });
    expect(t.bunPath).toBe('bunx');
    expect(t.wranglerArgs).toEqual(['--local']);
  });

  it('honors explicit bunPath and wranglerArgs overrides', () => {
    const { exec } = recorder();
    const t = new WranglerTarget({
      d1Name: 'd1',
      kvName: 'kv',
      bunPath: '/usr/local/bin/bunx',
      wranglerArgs: ['--env', 'staging'],
      exec,
    });
    expect(t.bunPath).toBe('/usr/local/bin/bunx');
    expect(t.wranglerArgs).toEqual(['--env', 'staging']);
  });
});

describe('WranglerTarget — DO-storage seeding via D1', () => {
  it('putSnapshot issues two d1-execute calls (snapshot + meta:updated_at)', async () => {
    const { exec, calls } = recorder();
    const t = new WranglerTarget({
      d1Name: 'rooms-db',
      kvName: 'ROOMS_INDEX',
      exec,
      now: () => 42,
    });
    await t.putSnapshot('foo', "O'Reilly");
    expect(calls).toHaveLength(2);
    expect(calls[0]?.cmd).toBe('bunx');
    expect(calls[0]?.args.slice(0, 5)).toEqual([
      'wrangler',
      'd1',
      'execute',
      'rooms-db',
      '--local',
    ]);
    // SQL embedded as the last arg. Verify the SQL quoting: O'Reilly → O''Reilly
    expect(calls[0]?.args.at(-1)).toContain("VALUES('foo', 'snapshot', 'O''Reilly')");
    expect(calls[1]?.args.at(-1)).toContain(
      "VALUES('foo', 'meta:updated_at', '42')",
    );
  });

  it('putLog/Audit/Chat shell out once each', async () => {
    const { exec, calls } = recorder();
    const t = new WranglerTarget({ d1Name: 'd', kvName: 'k', exec });
    await t.putLog('r', 1, 'cmd');
    await t.putAudit('r', 2, 'cmd2');
    await t.putChat('r', 3, 'hi');
    expect(calls).toHaveLength(3);
    expect(calls[0]?.args.at(-1)).toMatch(/log:\d{16}/);
    expect(calls[1]?.args.at(-1)).toMatch(/audit:\d{16}/);
    expect(calls[2]?.args.at(-1)).toMatch(/chat:\d{16}/);
  });

  it('putEcell shells out with ecell:<user> key', async () => {
    const { exec, calls } = recorder();
    const t = new WranglerTarget({ d1Name: 'd', kvName: 'k', exec });
    await t.putEcell('r', 'alice', 'A1');
    expect(calls[0]?.args.at(-1)).toContain("'ecell:alice'");
  });
});

describe('WranglerTarget — setRoomIndex', () => {
  it('fires both the D1 rooms write and the KV exists put', async () => {
    const { exec, calls } = recorder();
    const t = new WranglerTarget({ d1Name: 'ethercalc', kvName: 'ROOMS', exec });
    await t.setRoomIndex('meeting', 1700000000000);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.args).toContain('d1');
    expect(calls[0]?.args.at(-1)).toContain(
      "INSERT OR REPLACE INTO rooms(room, updated_at, cors_public) VALUES('meeting', 1700000000000, 0);",
    );
    expect(calls[1]?.args).toEqual([
      'wrangler',
      'kv',
      'key',
      'put',
      'rooms:exists:meeting',
      '1',
      '--binding',
      'ROOMS',
      '--local',
    ]);
  });

  it('truncates floating-point updatedAt values to integers in SQL', async () => {
    const { exec, calls } = recorder();
    const t = new WranglerTarget({ d1Name: 'd', kvName: 'k', exec });
    await t.setRoomIndex('r', 1.7);
    expect(calls[0]?.args.at(-1)).toContain('updated_at, cors_public) VALUES(');
    expect(calls[0]?.args.at(-1)).toContain(", 1, 0);");
  });
});

describe('WranglerTarget — error propagation', () => {
  it('throws when exec returns a non-zero exit code', () => {
    const { exec } = recorder(1, 'wrangler: auth required');
    const t = new WranglerTarget({ d1Name: 'd', kvName: 'k', exec });
    // setRoomIndex returns a Promise but the underlying shell-out is
    // synchronous, so the error propagates synchronously from the method
    // body before the Promise is even returned. Assert both shapes by
    // wrapping the invocation.
    expect(() => t.setRoomIndex('r', 1)).toThrow(/wrangler invocation failed/);
  });
});
