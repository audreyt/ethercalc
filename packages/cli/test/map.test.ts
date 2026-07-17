import { describe, expect, it } from 'vite-plus/test';

import { buildLaunchPlan } from '../src/map.ts';

describe('buildLaunchPlan — empty', () => {
  it('produces the documented default bind on 0.0.0.0:8000', () => {
    expect(buildLaunchPlan({})).toEqual({
      wranglerArgs: ['dev', '--port', '8000', '--ip', '0.0.0.0'],
      env: {
        ETHERCALC_PORT: '8000',
        ETHERCALC_HOST: '0.0.0.0',
      },
      warnings: [
        'warning: no ETHERCALC_KEY set; anonymous read/write/delete is open. Restrict ingress or set --key/ETHERCALC_KEY.',
      ],
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
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('no ETHERCALC_KEY');
  });

  it('--host maps to wrangler --ip AND env ETHERCALC_HOST', () => {
    const plan = buildLaunchPlan({ host: '127.0.0.1' });
    expect(plan.wranglerArgs).toEqual(['dev', '--port', '8000', '--ip', '127.0.0.1']);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '127.0.0.1',
    });
    expect(plan.warnings).toEqual([]);
  });

  it('does not warn for localhost or IPv6 loopback binds', () => {
    expect(buildLaunchPlan({ host: 'localhost' }).warnings).toEqual([]);
    expect(buildLaunchPlan({ host: '::1' }).warnings).toEqual([]);
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
    expect(plan.warnings).toHaveLength(1);
  });

  it('--key maps to env ETHERCALC_KEY only', () => {
    const plan = buildLaunchPlan({ key: 'hunter2' });
    expect(plan.wranglerArgs).toEqual(['dev', '--port', '8000', '--ip', '0.0.0.0']);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_KEY: 'hunter2',
    });
    expect(plan.warnings).toEqual([]);
  });

  it('--cors maps to env ETHERCALC_CORS=1', () => {
    const plan = buildLaunchPlan({ cors: true });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_CORS: '1',
    });
    expect(plan.warnings).toHaveLength(1);
  });

  it('--cors=false is dropped (flag was implicitly absent)', () => {
    // parseFlags never emits `cors: false`, but defend against it anyway.
    const plan = buildLaunchPlan({ cors: false });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
    });
    expect(plan.warnings).toHaveLength(1);
  });

  it('--basepath maps to env BASEPATH plus the legacy mirror', () => {
    const plan = buildLaunchPlan({ basepath: '/sheets' });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      BASEPATH: '/sheets',
      ETHERCALC_BASEPATH: '/sheets',
    });
    expect(plan.warnings).toHaveLength(1);
  });

  it('inherits ETHERCALC_BASEPATH from the environment when the flag is absent', () => {
    const plan = buildLaunchPlan({}, { ETHERCALC_BASEPATH: '/sheets' });
    expect(plan.env['BASEPATH']).toBe('/sheets');
    expect(plan.env['ETHERCALC_BASEPATH']).toBe('/sheets');
  });

  it('lets --basepath override an inherited ETHERCALC_BASEPATH', () => {
    const plan = buildLaunchPlan(
      { basepath: '/flag' },
      { ETHERCALC_BASEPATH: '/env' },
    );
    expect(plan.env['BASEPATH']).toBe('/flag');
    expect(plan.env['ETHERCALC_BASEPATH']).toBe('/flag');
  });

  it('ignores an empty inherited ETHERCALC_BASEPATH', () => {
    const plan = buildLaunchPlan({}, { ETHERCALC_BASEPATH: '' });
    expect(plan.env['BASEPATH']).toBeUndefined();
    expect(plan.env['ETHERCALC_BASEPATH']).toBeUndefined();
  });

  it('--expire maps to env ETHERCALC_EXPIRE', () => {
    const plan = buildLaunchPlan({ expire: 3600 });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_EXPIRE: '3600',
    });
    expect(plan.warnings).toHaveLength(1);
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
      BASEPATH: '/etc',
      ETHERCALC_BASEPATH: '/etc',
    });
    expect(plan.warnings).toEqual([]);
  });

  it('inherits ETHERCALC_KEY from the process environment', () => {
    const plan = buildLaunchPlan({}, { ETHERCALC_KEY: 'from-env' });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_KEY: 'from-env',
    });
    expect(plan.warnings).toEqual([]);
  });

  it('lets --key override an inherited ETHERCALC_KEY', () => {
    const plan = buildLaunchPlan({ key: 'from-flag' }, { ETHERCALC_KEY: 'from-env' });
    expect(plan.env['ETHERCALC_KEY']).toBe('from-flag');
  });

  it('does not treat an empty inherited ETHERCALC_KEY as configured', () => {
    const plan = buildLaunchPlan({}, { ETHERCALC_KEY: '' });
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
    });
    expect(plan.warnings).toHaveLength(1);
  });
});

describe('buildLaunchPlan — deferred TLS flags', () => {
  it('--keyfile alone emits exactly one TLS warning', () => {
    const plan = buildLaunchPlan({ keyfile: 'k.pem', host: '127.0.0.1' });
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('--keyfile');
    expect(plan.wranglerArgs).toEqual(['dev', '--port', '8000', '--ip', '127.0.0.1']);
    expect(plan.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '127.0.0.1',
    });
  });

  it('--certfile alone emits the same warning', () => {
    const plan = buildLaunchPlan({ certfile: 'c.pem', host: '127.0.0.1' });
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toContain('reverse proxy');
  });

  it('both --keyfile and --certfile together emit one combined warning', () => {
    const plan = buildLaunchPlan({
      keyfile: 'k.pem',
      certfile: 'c.pem',
      host: '127.0.0.1',
    });
    expect(plan.warnings).toHaveLength(1);
  });

  it('adds the keyless warning separately on non-loopback binds', () => {
    const plan = buildLaunchPlan({ keyfile: 'k.pem' });
    expect(plan.warnings).toHaveLength(2);
    expect(plan.warnings[0]).toContain('--keyfile');
    expect(plan.warnings[1]).toContain('no ETHERCALC_KEY');
  });
});
