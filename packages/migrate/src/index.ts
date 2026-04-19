/**
 * Barrel re-export for `@ethercalc/migrate`. All runtime logic lives in
 * sibling modules; this file is pure re-export surface and exercised by
 * test/index.test.ts.
 */
export { parseRdb, encodeRdb, RdbParseError } from './parse-rdb.ts';
export type { RedisDump } from './parse-rdb.ts';
export { extractRooms } from './extract-rooms.ts';
export type { Room } from './extract-rooms.ts';
export { applyRooms } from './apply.ts';
export type { MigrationTarget, ApplyStats } from './apply.ts';
export { InMemoryTarget } from './targets/in-memory.ts';
export type {
  InMemoryRoomIndexRow,
  InMemoryTargetOptions,
} from './targets/in-memory.ts';
export { WranglerTarget } from './targets/wrangler.ts';
export type { WranglerTargetConfig, Exec } from './targets/wrangler.ts';
export {
  parseArgs,
  runMigrate,
  buildTarget,
  DryRunTarget,
  main,
  CliArgError,
  USAGE,
} from './cli.ts';
export type { CliArgs, RunDeps } from './cli.ts';
