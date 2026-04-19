/**
 * Helpers to dispatch a Worker-level HTTP request to the room's Durable
 * Object. Keeps the route layer free of `env.ROOM.get(idFromName(…))`
 * boilerplate and makes it trivial to stub `ROOM` in route tests.
 */
import { encodeRoom } from './room-name.ts';
import type { Env } from '../env.ts';

/** Return the DO stub for `room`, keyed by its legacy-encoded form. */
export function roomStub(env: Env, room: string): DurableObjectStub {
  const id = env.ROOM.idFromName(encodeRoom(room));
  return env.ROOM.get(id);
}

/**
 * Fetch against the DO using the `/_do/*` protocol. Callers pass the path
 * (starting with `/_do/…`) and optional method/body; a fake host
 * (`https://do.local`) is supplied so the DO's URL constructor works.
 *
 * The caller's `room` is always appended as `?name=<encoded>` so the DO
 * can self-identify for the D1 rooms-index mirror (Phase 5.1). DOs are
 * addressed by an opaque id hashed from `encodeRoom(room)`; the DO has
 * no other way to learn its own room name. We append rather than
 * replace any existing query because `path` may already carry one
 * (e.g. `/_do/ping?name=foo` used by unit tests).
 */
export async function doFetch(
  env: Env,
  room: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const stub = roomStub(env, room);
  const sep = path.includes('?') ? '&' : '?';
  const url = `https://do.local${path}${sep}name=${encodeURIComponent(room)}`;
  return stub.fetch(url, init);
}
