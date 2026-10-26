/**
 * Helpers to dispatch a Worker-level HTTP request to the room's Durable
 * Object. Keeps the route layer free of `env.ROOM.get(idFromName(…))`
 * boilerplate and makes it trivial to stub `ROOM` in route tests.
 */
import { encodeRoom, isValidRoomName } from "./room-name.ts";
import type { SessionPrincipal } from "./session.ts";
import type { Env } from "../env.ts";

function roomStubForValidName(env: Env, room: string): DurableObjectStub {
  const id = env.ROOM.idFromName(encodeRoom(room));
  return env.ROOM.get(id);
}

/** Return the DO stub for `room`, keyed by its legacy-encoded form. */
export function roomStub(env: Env, room: string): DurableObjectStub {
  if (!isValidRoomName(room)) throw new RangeError("Invalid room name");
  return roomStubForValidName(env, room);
}

export const PARENT_READ_HEADER = "X-EC-Parent-Read";

/**
 * The RoomDO could not be reached (e.g. `Network connection lost.` while
 * the runtime moves or restarts the object during a version split). Still
 * an `Error`, so callers that already catch `doFetch` failures keep their
 * handling; an uncaught one becomes a 503 via `doUnavailableResponse`.
 */
export class DoUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Durable Object unavailable", { cause });
    this.name = "DoUnavailableError";
  }
}

/** Flags the Workers runtime sets on errors thrown by `stub.fetch`. */
interface DoErrorFlags {
  readonly remote?: unknown;
  readonly retryable?: unknown;
  readonly overloaded?: unknown;
}

function errorFlags(error: unknown): DoErrorFlags {
  return typeof error === "object" && error !== null ? (error as DoErrorFlags) : {};
}

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD"]);

/** 503 for an uncaught `DoUnavailableError`; null for any other error. */
export function doUnavailableResponse(error: unknown): Response | null {
  if (!(error instanceof DoUnavailableError)) return null;
  return new Response("Service temporarily unavailable", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "1" },
  });
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
 * Identity hardening (Phase A): trusted identity/capability headers reach
 * RoomDO only from verified Worker or RoomDO code. Any `X-EC-Uid` or
 * `X-EC-Parent-Read` value already present on `init.headers` is stripped
 * before dispatch.
 *
 * Failures: an exception raised by RoomDO code itself (`remote`) is
 * rethrown untouched. An infrastructure failure on a GET/HEAD that the
 * runtime marks `retryable` (and not `overloaded`) is retried once on a
 * fresh stub; writes are never retried because the DO may have applied
 * them. Any remaining infrastructure failure throws `DoUnavailableError`.
 */
export async function doFetch(
  env: Env,
  room: string,
  path: string,
  init: RequestInit = {},
  principal: SessionPrincipal | null = null,
): Promise<Response> {
  if (!isValidRoomName(room)) {
    return new Response("Invalid room name", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const sep = path.includes("?") ? "&" : "?";
  const url = `https://do.local${path}${sep}name=${encodeURIComponent(room)}`;
  const headers = new Headers(init.headers);
  headers.delete("X-EC-Uid");
  headers.delete(PARENT_READ_HEADER);
  if (principal) headers.set("X-EC-Uid", principal.uid);
  // A fresh stub per attempt: a stub can stay broken after some failures.
  const send = (): Promise<Response> =>
    roomStubForValidName(env, room).fetch(url, { ...init, headers });
  try {
    return await send();
  } catch (first) {
    const flags = errorFlags(first);
    if (flags.remote === true) throw first;
    const method = (init.method ?? "GET").toUpperCase();
    if (
      !IDEMPOTENT_METHODS.has(method) ||
      flags.retryable !== true ||
      flags.overloaded === true
    ) {
      throw new DoUnavailableError(first);
    }
    try {
      return await send();
    } catch (second) {
      if (errorFlags(second).remote === true) throw second;
      throw new DoUnavailableError(second);
    }
  }
}
