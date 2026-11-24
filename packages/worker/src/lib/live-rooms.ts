/**
 * Bound on how many rooms are awake at once under standalone workerd.
 *
 * `workerd/config.capnp` stores every RoomDO in its own SQLite database
 * (`durableObjectStorage = (localDisk = …)`), so an awake room costs the
 * server process three open files (`.sqlite`, `-wal`, `-shm`) until it has
 * been idle for ten seconds. That holds for a room nobody ever created,
 * too: "no such room" is an answer only the woken object can give. The
 * process has a fixed number of descriptors and exits when `accept()` finds
 * none left, so the rooms woken within that window need a bound
 * (`ETHERCALC_LIVE_ROOM_LIMIT`).
 *
 * Under workerd the Worker and every RoomDO run in one isolate, so this
 * module-level table sees each wake: stubs are handed out through
 * `roomStubForId` (`lib/do-dispatch.ts`), and a RoomDO that the runtime
 * wakes by itself (socket frame, alarm) reports in through `noteRoomAwake`.
 * On Cloudflare the variable is not bound and nothing is counted.
 */

import {
  isSandstormEnforced,
  sandstormCanModify,
  type SandstormEnv,
} from './sandstorm-access.ts';
import type { SessionPrincipal } from './session.ts';

export interface LiveRoomEnv {
  readonly ETHERCALC_LIVE_ROOM_LIMIT?: string | null;
}

/**
 * True when an incoming request carries no edit capability under the
 * active deployment auth model (Sandstorm viewer without `modify`, or
 * unauthenticated user elsewhere), so waking new rooms stays capped at
 * {@link viewerRoomLimit}.
 */
export function isViewerRequest(
  env: SandstormEnv,
  headers: Headers,
  principal: SessionPrincipal | null,
): boolean {
  return isSandstormEnforced(env)
    ? !sandstormCanModify(headers)
    : principal === null;
}

/**
 * Budget when `config.capnp` binds the variable but the process environment
 * does not set it (`workerd serve config.capnp` by hand): 900 descriptors,
 * which fits the usual soft limit of 1024 and a full workbook
 * (`MAX_MULTI_SHEETS` sheets and their table of contents).
 */
export const DEFAULT_LIVE_ROOM_LIMIT = 300;

/**
 * How long a room counts as awake after it was last handed work: workerd's
 * ten idle seconds, plus room for the request that was running meanwhile.
 */
export const LIVE_ROOM_MS = 20_000;

/** Object id → time until which it counts as awake; oldest entry first. */
const awakeUntil = new Map<string, number>();

/**
 * The budget, or null where rooms are not counted. `undefined` means the
 * binding does not exist (Cloudflare, unit tests); under workerd an unset
 * variable arrives as `null` (see `env.ts`) and takes the default, as does
 * any value that is not a positive integer.
 */
export function liveRoomLimit(env: LiveRoomEnv): number | null {
  const raw = env.ETHERCALC_LIVE_ROOM_LIMIT;
  if (raw === undefined) return null;
  const limit = Number(raw);
  return Number.isSafeInteger(limit) && limit > 0
    ? limit
    : DEFAULT_LIVE_ROOM_LIMIT;
}

/**
 * Sub-budget available for anonymous read requests (`GET` / `HEAD`):
 * `floor(limit * 15 / 16)` (281 at `DEFAULT_LIVE_ROOM_LIMIT = 300`),
 * reserving headroom for editors, writes, and authenticated requests while
 * still fitting a full 256-sheet workbook, TOC, and 16 cross-sheet targets
 * (273 rooms) under the default limit of 300.
 */
export function viewerRoomLimit(limit: number): number {
  return Math.max(1, Math.floor((limit * 15) / 16));
}

function touch(key: string, now: number): void {
  // Re-inserted, so the map stays ordered by expiry.
  awakeUntil.delete(key);
  awakeUntil.set(key, now + LIVE_ROOM_MS);
}

/**
 * May the object `id` be handed work now? True when it already counts as
 * awake or the budget has room for one more; either way it then counts as
 * awake for another `LIVE_ROOM_MS`. When `viewer` is true, waking a room
 * stops at {@link viewerRoomLimit} so anonymous reads leave headroom for
 * editors.
 */
export function admitRoom(
  env: LiveRoomEnv,
  id: { toString(): string },
  now: number = Date.now(),
  viewer = false,
): boolean {
  const limit = liveRoomLimit(env);
  if (limit === null) return true;
  const cap = viewer ? viewerRoomLimit(limit) : limit;
  const key = id.toString();
  const existing = awakeUntil.get(key);
  if (existing === undefined || existing <= now) {
    for (const [oldest, until] of awakeUntil) {
      if (until > now) break;
      awakeUntil.delete(oldest);
    }
    if (awakeUntil.size >= cap) return false;
  }
  touch(key, now);
  return true;
}

/**
 * Count `id` as awake without asking: for a RoomDO that is already running
 * because the runtime woke it, which no budget can refuse any more.
 */
export function noteRoomAwake(
  env: LiveRoomEnv,
  id: { toString(): string },
  now: number = Date.now(),
): void {
  if (liveRoomLimit(env) === null) return;
  touch(id.toString(), now);
}

/** Rooms currently counted, expired ones included until the next admission. */
export function liveRoomCount(): number {
  return awakeUntil.size;
}

/** Forget every room. For tests: the table outlives a single test case. */
export function resetLiveRooms(): void {
  awakeUntil.clear();
}
