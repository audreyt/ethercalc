/**
 * Barrel re-export for the @ethercalc/cli package. Runtime logic lives in
 * sibling modules; this file is deliberately branch-free and excluded
 * from the istanbul coverage gate (see vitest.config.ts).
 */
export { parseFlags, CliError } from './parse.ts';
export type { ParsedFlags } from './parse.ts';
export { buildLaunchPlan } from './map.ts';
export type { LaunchPlan } from './map.ts';
export { HELP_TEXT } from './help.ts';
export { main } from './run.ts';
export type { MainDeps } from './run.ts';
