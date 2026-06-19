import type { HttpScenario, Scenario, } from '@ethercalc/shared/oracle-scenarios';

import { CRON_SCENARIOS } from './cron.ts';
import { EXPORT_SCENARIOS } from './exports.ts';
import { FORM_SCENARIOS } from './form.ts';
import { MISC_SCENARIOS } from './misc.ts';
import {
  ROOM_CRUD_SETUP_SCENARIOS,
  ROOM_CRUD_TEARDOWN_SCENARIOS,
} from './room-crud.ts';
import { ROOMS_INDEX_SCENARIOS } from './rooms-index.ts';
import { STATIC_SCENARIOS } from './static.ts';
import { TEMPLATING_SCENARIOS } from './templating.ts';
import { WS_SCENARIOS } from './ws.ts';
import { MULTI_IMPORT_SCENARIOS } from './multi-import.ts';

export { STATIC_SCENARIOS } from './static.ts';
export { MISC_SCENARIOS } from './misc.ts';
export { CRON_SCENARIOS } from './cron.ts';
export { ROOMS_INDEX_SCENARIOS } from './rooms-index.ts';
export { ROOM_CRUD_SCENARIOS, ROOM_CRUD_SETUP_SCENARIOS, ROOM_CRUD_TEARDOWN_SCENARIOS } from './room-crud.ts';
export { EXPORT_SCENARIOS } from './exports.ts';
export { FORM_SCENARIOS } from './form.ts';
export { TEMPLATING_SCENARIOS } from './templating.ts';
export { WS_SCENARIOS } from './ws.ts';
export { MULTI_IMPORT_SCENARIOS } from './multi-import.ts';

/**
 * Full Phase 3 HTTP batch. Order matters:
 *   - the empty room-index probes (`ROOMS_INDEX`) must run before any room
 *     is created;
 *   - `CRON` (`/_timetrigger`) creates no rooms, so it slots in with the
 *     other stateless probes ahead of the index checks;
 *   - exports read the seeded export room before `post-command` mutates it;
 *   - templating (`/_from/:template`, `POST /_`) and the form redirect clone
 *     rooms AFTER the empty-index checks and before teardown DELETEs the
 *     template.
 */
export const ALL_HTTP_SCENARIOS: readonly HttpScenario[] = [
  ...STATIC_SCENARIOS,
  ...MISC_SCENARIOS,
  ...CRON_SCENARIOS,
  ...ROOMS_INDEX_SCENARIOS,
  ...ROOM_CRUD_SETUP_SCENARIOS,
  ...EXPORT_SCENARIOS,
  ...FORM_SCENARIOS,
  ...TEMPLATING_SCENARIOS,
  ...MULTI_IMPORT_SCENARIOS,
  ...ROOM_CRUD_TEARDOWN_SCENARIOS,
];

/** HTTP + WS scenarios in replay/record order. */
export const ALL_SCENARIOS: readonly Scenario[] = [
  ...STATIC_SCENARIOS,
  ...MISC_SCENARIOS,
  ...CRON_SCENARIOS,
  ...ROOMS_INDEX_SCENARIOS,
  ...ROOM_CRUD_SETUP_SCENARIOS,
  ...EXPORT_SCENARIOS,
  ...WS_SCENARIOS,
  ...FORM_SCENARIOS,
  ...TEMPLATING_SCENARIOS,
  ...MULTI_IMPORT_SCENARIOS,
  ...ROOM_CRUD_TEARDOWN_SCENARIOS,
];