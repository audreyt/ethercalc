import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import { STATIC_SCENARIOS } from './static.ts';
import { MISC_SCENARIOS } from './misc.ts';
import { ROOMS_INDEX_SCENARIOS } from './rooms-index.ts';

export { STATIC_SCENARIOS } from './static.ts';
export { MISC_SCENARIOS } from './misc.ts';
export { ROOMS_INDEX_SCENARIOS } from './rooms-index.ts';

/**
 * The full Phase 3 batch: stateless GETs only. Append new groups
 * here so `record.ts` / `replay.ts` pick them up automatically.
 */
export const ALL_HTTP_SCENARIOS: readonly HttpScenario[] = [
  ...STATIC_SCENARIOS,
  ...MISC_SCENARIOS,
  ...ROOMS_INDEX_SCENARIOS,
];
