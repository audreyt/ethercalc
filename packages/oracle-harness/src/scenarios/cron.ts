import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

/**
 * Cron / time-trigger scenario — `GET /_timetrigger` (§6.1, Phase 9).
 *
 * Legacy external cron pinged this URL once a minute; it fires any due
 * `settimetrigger` rows and replies with a JSON hash of `<room>!<cell>`
 * → remaining fire-at minutes (the state AFTER due rows are pruned).
 *
 * None of the recorded rooms install a time trigger, so on a fresh
 * oracle this returns the empty object `{}` with
 * `application/json; charset=utf-8`. The probe creates no rooms and is
 * idempotent, so it is safe to run before the room-mutation batch
 * without contaminating the empty room-index checks. We compare the
 * body with the `json` matcher.
 */
export const GET_TIMETRIGGER: HttpScenario = {
  name: 'cron/get-timetrigger',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/_timetrigger',
  },
};

export const CRON_SCENARIOS: readonly HttpScenario[] = [GET_TIMETRIGGER];
