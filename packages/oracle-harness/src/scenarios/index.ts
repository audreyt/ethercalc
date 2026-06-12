import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import { EXPORT_SCENARIOS } from './exports.ts';
import { FORM_SCENARIOS } from './form.ts';
import { MISC_SCENARIOS } from './misc.ts';
import {
  ROOM_CRUD_SETUP_SCENARIOS,
  ROOM_CRUD_TEARDOWN_SCENARIOS,
} from './room-crud.ts';
import { ROOMS_INDEX_SCENARIOS } from './rooms-index.ts';
import { STATIC_SCENARIOS } from './static.ts';

export { STATIC_SCENARIOS } from './static.ts';
export { MISC_SCENARIOS } from './misc.ts';
export { ROOMS_INDEX_SCENARIOS } from './rooms-index.ts';
export { ROOM_CRUD_SCENARIOS, ROOM_CRUD_SETUP_SCENARIOS, ROOM_CRUD_TEARDOWN_SCENARIOS } from './room-crud.ts';
export { EXPORT_SCENARIOS } from './exports.ts';
export { FORM_SCENARIOS } from './form.ts';

/**
 * Full Phase 3 HTTP batch. Order matters: empty room-index probes run
 * before any PUT; exports read the seeded room before POST mutates it;
 * form redirect clones the template before teardown DELETEs.
 */
export const ALL_HTTP_SCENARIOS: readonly HttpScenario[] = [
  ...STATIC_SCENARIOS,
  ...MISC_SCENARIOS,
  ...ROOMS_INDEX_SCENARIOS,
  ...ROOM_CRUD_SETUP_SCENARIOS,
  ...EXPORT_SCENARIOS,
  ...FORM_SCENARIOS,
  ...ROOM_CRUD_TEARDOWN_SCENARIOS,
];