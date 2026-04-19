/**
 * Barrel-reexport smoke test — guarantees every public entry point is
 * reachable from `@ethercalc/migrate` so downstream consumers of the
 * package resolve without hunting for sub-paths.
 */
import { describe, it, expect } from 'vitest';

import * as migrate from '../src/index.ts';

describe('@ethercalc/migrate barrel', () => {
  it('re-exports every public runtime symbol', () => {
    const names = [
      'parseRdb',
      'encodeRdb',
      'RdbParseError',
      'extractRooms',
      'applyRooms',
      'InMemoryTarget',
      'WranglerTarget',
      'parseArgs',
      'runMigrate',
      'buildTarget',
      'DryRunTarget',
      'main',
      'CliArgError',
      'USAGE',
    ] as const;
    for (const n of names) {
      expect(migrate).toHaveProperty(n);
    }
  });
});
