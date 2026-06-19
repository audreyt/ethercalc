import type { BodyMatcher, HttpScenario } from '@ethercalc/shared/oracle-scenarios';

/**
 * Per-scenario post-record normalization hooks. Applied after the
 * recorder writes the raw response into the scenario's `expect`
 * field, before the JSON artifact is persisted.
 *
 * We keep this map inside the oracle-harness (rather than widening
 * `HttpScenario` in `@ethercalc/shared`) because the hooks are oracle-
 * replay machinery that never needs to travel to the client or the
 * worker. Scenarios identify themselves by `scenario.name`.
 *
 * The typical reason to register a hook: an endpoint that embeds a
 * UUID/random value in a header or body — e.g. `/_new` returning a
 * different `Location: /<uuid>` every time. Rewrite the volatile
 * value to a `re:` pattern that matches any legitimate output.
 */
export type NormalizeHook = (scenario: HttpScenario) => HttpScenario;

/** Rewrite a header field in-place on a recorded scenario. */
export function overrideHeader(scenario: HttpScenario, name: string, value: string): HttpScenario {
  if (!scenario.expect) return scenario;
  return {
    ...scenario,
    expect: {
      ...scenario.expect,
      headers: { ...scenario.expect.headers, [name.toLowerCase()]: value },
    },
  };
}

/**
 * Normalize `Content-Length` to a regex (any positive integer) when the
 * body is matcher-ignored — we're not asserting on the body anyway,
 * and its exact length varies with the volatile payload.
 */
export function relaxContentLength(scenario: HttpScenario): HttpScenario {
  if (!scenario.expect) return scenario;
  if ('content-length' in scenario.expect.headers) {
    return overrideHeader(scenario, 'content-length', 're:^\\d+$');
  }
  return scenario;
}

/** Override the recorded body matcher (e.g. scsave for text/plain snapshots). */
export function setBodyMatcher(scenario: HttpScenario, matcher: BodyMatcher): HttpScenario {
  if (!scenario.expect) return scenario;
  return {
    ...scenario,
    expect: { ...scenario.expect, bodyMatcher: matcher },
  };
}

export const NORMALIZERS: Readonly<Record<string, NormalizeHook>> = {
  // Sensible fixes (§6.1): favicon CT, socialcalc.js MIME variant.
  'static/get-root-index': (scenario) => setBodyMatcher(scenario, 'ignore'),
  'static/get-start': (scenario) => setBodyMatcher(scenario, 'ignore'),
  'static/get-favicon': (scenario) =>
    setBodyMatcher(
      overrideHeader(
        scenario,
        'content-type',
        're:^(text/html|image/vnd\\.microsoft\\.icon)(; charset=utf-8)?$',
      ),
      'ignore',
    ),
  'static/get-socialcalc-js': (scenario) =>
    relaxContentLength(setBodyMatcher(
      overrideHeader(scenario, 'content-type', 're:.*javascript.*'),
      'ignore',
    )),
  // `/_new` 302s to `/<12-char-base36-uuid>` (see `new-room` in main.ls).
  // The Location and body both embed the random id; relax both.
  'misc/get-new-redirect': (scenario) => {
    const withLocation = overrideHeader(scenario, 'location', 're:^/[a-z0-9]{12}$');
    return relaxContentLength(withLocation);
  },
  // `GET /_timetrigger` — JSON hash of remaining fire-at minutes. The legacy
  // oracle returns an empty body, so we assert the status and ignore the body.
  'cron/get-timetrigger': (scenario) =>
    relaxContentLength(setBodyMatcher(scenario, 'ignore')),
  // `GET /_/:room` returns SocialCalc save as `text/plain`; compare structurally.
  'exports/get-snapshot': (scenario) =>
    relaxContentLength(setBodyMatcher(scenario, 'scsave')),
  // `GET /_/:room/html` — structural HTML equivalence (Phase 8a matcher).
  'exports/get-html': (scenario) => relaxContentLength(setBodyMatcher(scenario, 'html')),
  // `GET /_/:room/csv.json` — 1D cell JSON; json matcher.
  'exports/get-csv-json': (scenario) =>
    relaxContentLength(setBodyMatcher(scenario, 'json')),
  // `GET /_/:room/fods` — no structural fods matcher exists; assert the
  // envelope only (status + CT + Content-Disposition), ignore the body.
  'exports/get-fods': (scenario) =>
    relaxContentLength(setBodyMatcher(scenario, 'ignore')),
  // `GET /_/:room/md` — worker emits GFM (sensible-fix §13 Q1) that
  // diverges from legacy `j`; assert status + CT, ignore the body.
  'exports/get-md': (scenario) =>
    relaxContentLength(setBodyMatcher(scenario, 'ignore')),
  // `GET /_/:room/cells` — full cell map JSON; json matcher.
  'exports/get-cells': (scenario) =>
    relaxContentLength(setBodyMatcher(scenario, 'json')),
  // `GET /_/:room/cells/:cell` — single cell JSON; json matcher.
  'exports/get-cell-a1': (scenario) =>
    relaxContentLength(setBodyMatcher(scenario, 'json')),
  // `GET /:template/form` 302s to `/<template>_<uuid>/app` (main.ls:287-293).
  'form/get-template-form-redirect': (scenario) => {
    const withLocation = overrideHeader(
      scenario,
      'location',
      're:^/oracle-phase3-template_[a-z0-9]{12}/app$',
    );
    return relaxContentLength(withLocation);
  },
  // `GET /_/:room/xlsx` — structural zip/XML comparison (Phase 8a matcher).
  'exports/get-xlsx': (scenario) => relaxContentLength(setBodyMatcher(scenario, 'xlsx')),
  // `GET /_/:room/ods` — structural zip/XML comparison (Phase 8a matcher).
  'exports/get-ods': (scenario) => relaxContentLength(setBodyMatcher(scenario, 'ods')),
  // `GET /_from/:template` 302s to a freshly-cloned room `/<12-char-id>`
  // (no `/edit` — recording oracle runs without a KEY). Relax the random
  // Location + the redirect body length.
  'templating/get-from-template': (scenario) => {
    const withLocation = overrideHeader(scenario, 'location', 're:^/[a-z0-9]{12}$');
    return relaxContentLength(withLocation);
  },
  // `GET /=_new` 302s to a multi-sheet room `/=<12-char-id>`.
  'templating/get-multi-new': (scenario) => {
    const withLocation = overrideHeader(scenario, 'location', 're:^/=[a-z0-9]{12}$');
    return relaxContentLength(withLocation);
  },
  // `POST /_` autogenerates a room: `Location: /_/<id>` + a `/<id>` body.
  // Both embed the random id, so relax the Location header and ignore the
  // body.
  'templating/post-autogen-room': (scenario) => {
    const withLocation = overrideHeader(scenario, 'location', 're:^/_/[a-z0-9]{12}$');
    return relaxContentLength(setBodyMatcher(withLocation, 'ignore'));
  },
  // F-13: form redirect leaves a clone room in Redis; ignore it on replay.
  'rooms-index/get-rooms-empty': (scenario) => setBodyMatcher(scenario, 'rooms-empty'),
  'rooms-index/get-roomtimes-empty': (scenario) => setBodyMatcher(scenario, 'roomtimes-empty'),
  'rooms-index/get-roomlinks-empty': (scenario) => setBodyMatcher(scenario, 'roomlinks-empty'),
  'room-crud/post-command': (scenario) => relaxContentLength(setBodyMatcher(scenario, 'command-echo')),
};

/** Look up a normalizer by scenario name; return `null` if none registered. */
export function getNormalizer(name: string): NormalizeHook | null {
  return NORMALIZERS[name] ?? null;
}

/** Apply the registered normalizer if any; otherwise return scenario unchanged. */
export function applyNormalizer(scenario: HttpScenario): HttpScenario {
  const hook = getNormalizer(scenario.name);
  return hook ? hook(scenario) : scenario;
}
