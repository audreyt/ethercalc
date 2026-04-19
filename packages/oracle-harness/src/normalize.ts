import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

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

export const NORMALIZERS: Readonly<Record<string, NormalizeHook>> = {
  // `/_new` 302s to `/<12-char-base36-uuid>` (see `new-room` in main.ls).
  // The Location and body both embed the random id; relax both.
  'misc/get-new-redirect': (scenario) => {
    const withLocation = overrideHeader(scenario, 'location', 're:^/[a-z0-9]{12}$');
    return relaxContentLength(withLocation);
  },
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
