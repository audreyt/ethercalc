import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import { ORACLE_PHASE3_TEMPLATE_ROOM } from './fixtures.ts';

/**
 * `GET /:template/form` clones the template room and 302s to
 * `/<template>_<uuid>/app`. The uuid suffix is non-deterministic;
 * see `normalize.ts` for the Location regex hook.
 *
 * Requires `room-crud/put-template-room` to have run first.
 */

export const GET_TEMPLATE_FORM_REDIRECT: HttpScenario = {
  name: 'form/get-template-form-redirect',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/${ORACLE_PHASE3_TEMPLATE_ROOM}/form`,
  },
};

export const FORM_SCENARIOS: readonly HttpScenario[] = [GET_TEMPLATE_FORM_REDIRECT];