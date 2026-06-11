/**
 * Decide whether cross-room index endpoints should be hidden.
 *
 * `ETHERCALC_CORS` historically did double duty: it enabled CORS in the
 * legacy server and disabled `/_rooms*`. The Worker now emits permissive CORS
 * headers unconditionally for embed compatibility, but the hosted deploy still
 * has `ETHERCALC_CORS=1` in wrangler.toml. Keep honouring that legacy switch
 * while giving self-hosts a clearly-named knob.
 */

export interface RoomIndexAccessEnv {
  readonly ETHERCALC_DISABLE_ROOM_INDEX?: string | null;
  readonly ETHERCALC_CORS?: string | null;
}

/**
 * Workerd delivers an unset `fromEnvironment` binding as `null`, not the
 * empty string (verified against workerd 1.20260420.1) — so both `null`
 * and `undefined` must read as "flag absent".
 */
export function flagEnabled(raw: string | null | undefined): boolean {
  if (raw == null) return false;
  switch (raw.trim().toLowerCase()) {
    case '':
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      return true;
  }
}

/**
 * Explicit `ETHERCALC_DISABLE_ROOM_INDEX` wins when present. Otherwise fall
 * back to the legacy `ETHERCALC_CORS` gate so Cloudflare hosted behaviour
 * remains unchanged.
 */
export function shouldDisableRoomIndex(env: RoomIndexAccessEnv): boolean {
  const explicit = env.ETHERCALC_DISABLE_ROOM_INDEX;
  if (explicit != null && explicit.trim() !== '') {
    return flagEnabled(explicit);
  }
  return flagEnabled(env.ETHERCALC_CORS);
}
