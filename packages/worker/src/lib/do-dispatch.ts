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
 */
export async function doFetch(
  env: Env,
  room: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const stub = roomStub(env, room);
  return stub.fetch(`https://do.local${path}`, init);
}
