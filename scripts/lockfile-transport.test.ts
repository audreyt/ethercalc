import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'bun:test';

// Nightly 2026-09-15: `vp install` in the staging-dry-run job failed with
// `failed to download emitter@http://github.com/...: ConnectionRefused`.
// A transitive tarball pinned to plain HTTP is one blocked port-80 egress
// away from red CI, so every *resolved* fetch target must use HTTPS.
// (Upstream manifests may still *declare* `http://` ranges — e.g.
// socket.io-parser@2.2.0 does — but bun records those verbatim inside the
// parent's `dependencies` map and never fetches them once `overrides`
// redirects the resolution. Only `name@http://…` tuples are downloads.)
const root = resolve(import.meta.dir, '..');

describe('lockfile transport', () => {
  test('bun.lock resolves no package over plain HTTP', () => {
    const lock = readFileSync(resolve(root, 'bun.lock'), 'utf8');
    const offenders = lock.split('\n').filter((line) => line.includes('@http://'));
    expect(offenders).toEqual([]);
  });

  test('no workspace package.json declares a plain-HTTP dependency', async () => {
    const glob = new Bun.Glob('packages/*/package.json');
    const files = ['package.json', ...[...glob.scanSync({ cwd: root, absolute: false })]];
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(resolve(root, file), 'utf8');
      const pkg = JSON.parse(text) as Record<string, Record<string, string> | undefined>;
      for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'overrides'] as const) {
        for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
          if (typeof spec === 'string' && spec.includes('http://')) offenders.push(`${file}: ${name}@${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
