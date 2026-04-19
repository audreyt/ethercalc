import { describe, expect, it } from 'vitest';

import { buildLaunchPlan } from '../src/map.ts';

describe('buildLaunchPlan — empty', () => {
  it('produces the documented default bind on 0.0.0.0:8000', () => {
    expect(buildLaunchPlan({})).toEqual({
      wranglerArgs: ['dev', '--port', '8000', '--ip', '0.0.0.0'],
      env: {
        ETHERCALC_PORT: '8000',
        ETHERCALC_HOST: '0.0.0.0',
      },
      warnings: [],
    });
  });
});

describe('buildLaunchPlan — per-flag mappings', () => {
  it('--port maps to wrangler --port AND env ETHERCALC_PORT', () => {
    const plan = buildLaunchPlan({ port: 8080 });
    expect(plan.wranglerArgs).toEqual(['dev', '--port', '8080', '--ip', '0.0.0.0']);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8080',
      ETHERCALC_HOST: '0.0.0.0',
    });
    expect(plan.warnings).toEqual([]);
  });

  it('--host maps to wrangler --ip AND env ETHERCALC_HOST', () => {
    const plan = buildLaunchPlan({ host: '127.0.0.1' });
    expect(plan.wranglerArgs).toEqual(['dev', '--port', '8000', '--ip', '127.0.0.1']);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '127.0.0.1',
    });
  });

  it('--persist-to maps to wrangler --persist-to (no env mirror)', () => {
    const plan = buildLaunchPlan({ persistTo: '/data' });
    expect(plan.wranglerArgs).toEqual([
      'dev',
      '--port', '8000',
      '--ip', '0.0.0.0',
      '--persist-to', '/data',
    ]);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
    });
  });

  it('--key maps to env ETHERCALC_KEY only', () => {
    const plan = buildLaunchPlan({ key: 'hunter2' });
    expect(plan.wranglerArgs).toEqual(['dev', '--port', '8000', '--ip', '0.0.0.0']);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_KEY: 'hunter2',
    });
  });

  it('--cors maps to env ETHERCALC_CORS=1', () => {
    const plan = buildLaunchPlan({ cors: true });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_CORS: '1',
    });
  });

  it('--cors=false is dropped (flag was implicitly absent)', () => {
    // parseFlags never emits `cors: false`, but defend against it anyway.
    const plan = buildLaunchPlan({ cors: false });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
    });
  });

  it('--basepath maps to env ETHERCALC_BASEPATH', () => {
    const plan = buildLaunchPlan({ basepath: '/sheets' });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_BASEPATH: '/sheets',
    });
  });

  it('--expire maps to env ETHERCALC_EXPIRE', () => {
    const plan = buildLaunchPlan({ expire: 3600 });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_EXPIRE: '3600',
    });
  });

  it('all flags together produce the full plan', () => {
    const plan = buildLaunchPlan({
      key: 's3cr3t',
      cors: true,
      port: 9000,
      host: '0.0.0.0',
      expire: 3600,
      basepath: '/etc',
      persistTo: '/var/ethercalc',
    });
    expect(plan.wranglerArgs).toEqual([
      'dev',
      '--port', '9000',
      '--ip', '0.0.0.0',
      '--persist-to', '/var/ethercalc',
    ]);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '9000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_KEY: 's3cr3t',
      ETHERCALC_CORS: '1',
      ETHERCALC_EXPIRE: '3600',
      ETHERCALC_BASEPATH: '/etc',
    });
    expect(plan.warnings).toEqual([]);
  });
});

describe('buildLaunchPlan — deferred TLS flags', () => {
  it('--keyfile alone emits exactly one TLS warning', () => {
    const plan = buildLaunchPlan({ keyfile: 'k.pem' });
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('--keyfile');
    expect(plan.wranglerArgs).toEqual(['dev', '--port', '8000', '--ip', '0.0.0.0']);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
    });
  });

  it('--certfile alone emits the same warning', () => {
    const plan = buildLaunchPlan({ certfile: 'c.pem' });
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('reverse proxy');
  });

  it('both --keyfile and --certfile together emit one combined warning', () => {
    const plan = buildLaunchPlan({ keyfile: 'k.pem', certfile: 'c.pem' });
    expect(plan.warnings).toHaveLength(1);
  });
});
