/**
 * Helpers to dispatch a Worker-level HTTP request to the room's Durable
 * Object. Keeps the route layer free of `env.ROOM.get(idFromName(…))`
 * boilerplate and makes it trivial to stub `ROOM` in route tests.
 */
import { encodeRoom, isValidRoomName } from './room-name.ts';
import type { SessionPrincipal } from './session.ts';
import type { Env } from '../env.ts';

function roomStubForValidName(env: Env, room: string): DurableObjectStub {
  const id = env.ROOM.idFromName(encodeRoom(room));
  return env.ROOM.get(id);
}

/** Return the DO stub for `room`, keyed by its legacy-encoded form. */
export function roomStub(env: Env, room: string): DurableObjectStub {
  if (!isValidRoomName(room)) throw new RangeError('Invalid room name');
  return roomStubForValidName(env, room);
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
 *
 * Identity hardening (Phase A): the trusted `X-EC-Uid` header reaches
 * the DO ONLY from the verified session `principal` — any value already
 * present on `init.headers` (a forged ingress header accidentally
 * threaded through) is stripped before dispatch.
 */
export async function doFetch(
  env: Env,
  room: string,
  path: string,
  init: RequestInit = {},
  principal: SessionPrincipal | null = null,
): Promise<Response> {
  if (!isValidRoomName(room)) {
    return new Response('Invalid room name', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const stub = roomStubForValidName(env, room);
  const sep = path.includes('?') ? '&' : '?';
  const url = `https://do.local${path}${sep}name=${encodeURIComponent(room)}`;
  const headers = new Headers(init.headers);
  headers.delete('X-EC-Uid');
  if (principal) headers.set('X-EC-Uid', principal.uid);
  return stub.fetch(url, { ...init, headers });
}
