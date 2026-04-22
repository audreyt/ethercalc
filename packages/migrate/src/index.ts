/**
 * Barrel re-export for `@ethercalc/migrate`. All runtime logic lives in
 * sibling modules; this file is pure re-export surface and exercised by
 * test/index.test.ts.
 */
export { applyRoomStream } from './apply.ts';
export type {
  MigrationTarget,
  ApplyStats,
  ApplyRoomStreamOptions,
  SendProgressHook,
  Room,
} from './apply.ts';
export { InMemoryTarget } from './targets/in-memory.ts';
export type {
  InMemoryRoomIndexRow,
  InMemoryTargetOptions,
} from './targets/in-memory.ts';
export { HttpTarget, waitForHealth } from './targets/http.ts';
export type {
  HttpTargetConfig,
  FetchLike,
  WaitForHealthDeps,
} from './targets/http.ts';
export { RespClient, RespError } from './resp-client.ts';
export type { RespValue, RespSocket } from './resp-client.ts';
export { roomsFromRedis } from './sources/redis-source.ts';
export type { RespLike, RoomsFromRedisOptions } from './sources/redis-source.ts';
export { roomsFromFilesystem } from './sources/filesystem-source.ts';
export type {
  FsLike,
  FsStatLike,
  RoomsFromFilesystemOptions,
} from './sources/filesystem-source.ts';
export { parseArgs, CliArgError } from './cli-args.ts';
export type { CliArgs } from './cli-args.ts';
export {
  runMigrate,
  buildTarget,
  DryRunTarget,
  main,
  USAGE,
} from './cli.ts';
export type { RunDeps } from './cli.ts';
