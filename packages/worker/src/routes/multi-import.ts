/**
 * Multi-sheet workbook IMPORT routes — the inverse of the multi-sheet
 * exports in `routes/exports.ts`.
 *
 *   - `PUT /=:room.{xlsx,ods,fods}` / `PUT /_/=:room/{xlsx,ods,fods}`:
 *     Full room REPLACE operation (`API.md:24`). Parses the uploaded workbook
 *     into a TOC sheet + one sub-room per worksheet starting at `.1` and overwrites
 *     the TOC. Sub-rooms first, TOC last, so the TOC never points at a missing sub-room.
 *
 *   - `POST /=:room.{xlsx,ods,fods,csv,tsv,txt,socialcalc}` /
 *     `POST /_/=:room/{xlsx,ods,fods,csv,tsv,txt,socialcalc}`:
 *     Multi-sheet APPEND operation. Parses the upload, then asks the parent
 *     RoomDO (`POST /_do/import-append-toc`) to atomically allocate unique child
 *     ids and append TOC rows under `blockConcurrencyWhile`. Child snapshots are
 *     PUT only after allocation succeeds. Concurrent appends therefore never
 *     share `base.N` or overwrite each other's TOC rows. Text formats
 *     (csv/tsv/txt/socialcalc) are single-sheet appends through this same door.
 *
 * Returns `201 OK`. Access is gated by parent room write permissions when operating
 * on existing rooms.
 *
 * Children are initialized atomically with immutable `meta:parent` before
 * their TOC rows are committed. Existing occupied unmarked private children
 * require explicit operator backfill rather than an unsafe implicit claim.
 */
import type { Hono } from "hono";

import type { Env, EtherCalcHonoEnv } from "../env.ts";
import { doFetch } from "../lib/do-dispatch.ts";
import { getSessionPrincipal } from "../lib/session-middleware.ts";
import type { SessionPrincipal } from "../lib/session.ts";
import {
  APPEND_IMPORT_FORMATS,
  WORKBOOK_IMPORT_FORMATS,
  buildMultiSheetImport,
  prepareAppendImportPlan,
  ImportTooManySheetsError,
  ImportUnsupportedFormatError,
} from "../lib/multi-sheet-import.ts";
import {
  ImportArchiveTooLargeError,
  ImportColumnOutOfRangeError,
  ImportDimensionsTooLargeError,
  ImportRowOutOfRangeError,
  ImportTooLargeError,
} from "../lib/xlsx-import.ts";

const TEXT_CT = "text/plain; charset=utf-8";
/** Returned while a new child/parent RoomDO protocol is not yet available. */
export const PARENTED_CHILD_DO_SKEW_MESSAGE =
  "Sheet creation is briefly unavailable while the server finishes updating. Please retry in a moment.";
function parentedChildSkewResponse(): Response {
  return new Response(PARENTED_CHILD_DO_SKEW_MESSAGE, {
    status: 503,
    headers: {
      "Content-Type": TEXT_CT,
      "Retry-After": "5",
    },
  });
}
async function parentedProtocolFetch(
  env: Env,
  room: string,
  path: string,
  init: RequestInit,
  principal: SessionPrincipal | null,
): Promise<Response | null> {
  try {
    return await doFetch(env, room, path, init, principal);
  } catch {
    return null;
  }
}

/**
 * Mirror a DO 401/403 auth verdict to the client verbatim (status +
 * text/plain body). Returns null for any other status so callers fall
 * through to their normal handling.
 */
async function authVerdict(res: Response): Promise<Response | null> {
  if (res.status !== 401 && res.status !== 403) return null;
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": TEXT_CT },
  });
}

async function getParentAccessInfo(
  env: Env,
  base: string,
  principal: SessionPrincipal | null,
): Promise<{ isPrivate?: boolean; errorResponse?: Response }> {
  let accessRes: Response;
  try {
    accessRes = await doFetch(env, base, "/_do/access", {}, principal);
  } catch {
    return {
      errorResponse: new Response("import failed", {
        status: 500,
        headers: { "Content-Type": TEXT_CT },
      }),
    };
  }
  const denied = await authVerdict(accessRes);
  if (denied) return { errorResponse: denied };
  if (accessRes.status !== 200) {
    return {
      errorResponse: new Response("import failed", {
        status: 500,
        headers: { "Content-Type": TEXT_CT },
      }),
    };
  }
  const text = await accessRes.text().catch(() => "");
  try {
    const json: unknown = JSON.parse(text);
    if (
      json !== null &&
      typeof json === "object" &&
      "canRead" in json &&
      typeof json.canRead === "boolean" &&
      "canWrite" in json &&
      typeof json.canWrite === "boolean" &&
      "isPrivate" in json &&
      typeof json.isPrivate === "boolean"
    ) {
      if (!json.canWrite) {
        return {
          errorResponse: new Response("Forbidden", {
            status: 403,
            headers: { "Content-Type": TEXT_CT },
          }),
        };
      }
      return { isPrivate: json.isPrivate };
    }
  } catch {
    // ignore
  }
  return {
    errorResponse: new Response("import failed", {
      status: 500,
      headers: { "Content-Type": TEXT_CT },
    }),
  };
}

function mapImportBuildError(err: unknown): Response | null {
  if (
    err instanceof ImportTooLargeError ||
    err instanceof ImportArchiveTooLargeError ||
    err instanceof ImportDimensionsTooLargeError ||
    err instanceof ImportTooManySheetsError
  ) {
    return new Response(err.message, {
      status: 413,
      headers: { "Content-Type": TEXT_CT },
    });
  }
  if (
    err instanceof ImportColumnOutOfRangeError ||
    err instanceof ImportRowOutOfRangeError ||
    err instanceof ImportUnsupportedFormatError
  ) {
    return new Response(err.message, {
      status: 400,
      headers: { "Content-Type": TEXT_CT },
    });
  }
  return null;
}
type AllocatedSheet = { subroom: string; link: string; title: string };
type CommittedSheet = AllocatedSheet & { row: number };

async function reserveInitializeCommit(
  env: Env,
  base: string,
  principal: SessionPrincipal | null,
  requestId: string,
  titles: readonly string[],
  materializeSaves: (firstIndex: number) => readonly string[],
): Promise<{ ok: true; sheets: CommittedSheet[] } | { ok: false; response: Response }> {
  const reserve = await parentedProtocolFetch(
    env,
    base,
    "/_do/import-append-toc",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        phase: "reserve",
        requestId,
        // `sheets` is intentionally incompatible with the old one-phase
        // `{titles}` contract, which would publish TOC rows too early.
        sheets: titles.map((title) => ({ title })),
      }),
    },
    principal,
  );
  if (reserve === null) {
    return { ok: false, response: parentedChildSkewResponse() };
  }
  const denied = await authVerdict(reserve);
  if (denied) return { ok: false, response: denied };
  if (reserve.status === 501 || reserve.status === 400) {
    return { ok: false, response: parentedChildSkewResponse() };
  }
  if (reserve.status !== 201) {
    return {
      ok: false,
      response: new Response(await reserve.text().catch(() => "import failed"), {
        status: reserve.status >= 400 ? reserve.status : 500,
        headers: { "Content-Type": TEXT_CT },
      }),
    };
  }
  const allocation: unknown = await reserve.json().catch(() => null);
  if (
    allocation === null ||
    typeof allocation !== "object" ||
    !("requestId" in allocation) ||
    allocation.requestId !== requestId ||
    !("firstIndex" in allocation) ||
    typeof allocation.firstIndex !== "number" ||
    !("sheets" in allocation) ||
    !Array.isArray(allocation.sheets) ||
    allocation.sheets.length !== titles.length
  ) {
    return {
      ok: false,
      response: new Response("import failed", {
        status: 500,
        headers: { "Content-Type": TEXT_CT },
      }),
    };
  }
  const sheets: AllocatedSheet[] = [];
  for (const row of allocation.sheets) {
    if (
      row === null ||
      typeof row !== "object" ||
      !("subroom" in row) ||
      typeof row.subroom !== "string" ||
      !("link" in row) ||
      typeof row.link !== "string" ||
      !("title" in row) ||
      typeof row.title !== "string"
    ) {
      return {
        ok: false,
        response: new Response("import failed", {
          status: 500,
          headers: { "Content-Type": TEXT_CT },
        }),
      };
    }
    sheets.push({
      subroom: row.subroom,
      link: row.link,
      title: row.title,
    });
  }

  const saves = materializeSaves(allocation.firstIndex);
  for (let index = 0; index < sheets.length; index++) {
    const sheet = sheets[index]!;
    const child = await parentedProtocolFetch(
      env,
      sheet.subroom,
      "/_do/child-snapshot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent: base,
          snapshot: saves[index] ?? "",
          mode: "create",
        }),
      },
      principal,
    );
    if (child === null) {
      return { ok: false, response: parentedChildSkewResponse() };
    }
    if (child.status === 501) {
      return { ok: false, response: parentedChildSkewResponse() };
    }
    const childDenied = await authVerdict(child);
    if (childDenied) return { ok: false, response: childDenied };
    if (child.status !== 201) {
      return {
        ok: false,
        response: new Response(await child.text().catch(() => "import failed"), {
          status: child.status >= 400 ? child.status : 500,
          headers: { "Content-Type": TEXT_CT },
        }),
      };
    }
  }

  const commit = await parentedProtocolFetch(
    env,
    base,
    "/_do/import-append-toc",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "commit", requestId }),
    },
    principal,
  );
  if (commit === null) {
    return { ok: false, response: parentedChildSkewResponse() };
  }
  if (commit.status === 501 || commit.status === 400) {
    return { ok: false, response: parentedChildSkewResponse() };
  }
  const commitDenied = await authVerdict(commit);
  if (commitDenied) return { ok: false, response: commitDenied };
  if (commit.status !== 201) {
    return {
      ok: false,
      response: new Response(await commit.text().catch(() => "import failed"), {
        status: commit.status >= 400 ? commit.status : 500,
        headers: { "Content-Type": TEXT_CT },
      }),
    };
  }
  const committedPayload: unknown = await commit.json().catch(() => null);
  if (
    committedPayload === null ||
    typeof committedPayload !== "object" ||
    !("requestId" in committedPayload) ||
    committedPayload.requestId !== requestId ||
    !("sheets" in committedPayload) ||
    !Array.isArray(committedPayload.sheets) ||
    committedPayload.sheets.length !== sheets.length
  ) {
    return {
      ok: false,
      response: new Response("import failed", {
        status: 500,
        headers: { "Content-Type": TEXT_CT },
      }),
    };
  }
  const committedSheets: CommittedSheet[] = [];
  for (let index = 0; index < sheets.length; index++) {
    const expected = sheets[index]!;
    const row = committedPayload.sheets[index];
    if (
      row === null ||
      typeof row !== "object" ||
      !("subroom" in row) ||
      row.subroom !== expected.subroom ||
      !("link" in row) ||
      row.link !== expected.link ||
      !("title" in row) ||
      row.title !== expected.title ||
      !("row" in row) ||
      typeof row.row !== "number" ||
      !Number.isSafeInteger(row.row) ||
      row.row < 2
    ) {
      return {
        ok: false,
        response: new Response("import failed", {
          status: 500,
          headers: { "Content-Type": TEXT_CT },
        }),
      };
    }
    committedSheets.push({ ...expected, row: row.row });
  }
  return { ok: true, sheets: committedSheets };
}

async function importWorkbook(
  env: Env,
  base: string,
  bytes: Uint8Array,
  principal: SessionPrincipal | null,
): Promise<Response> {
  const { isPrivate, errorResponse } = await getParentAccessInfo(env, base, principal);
  if (errorResponse) return errorResponse;

  let tocSave: string;
  let subSheets: ReadonlyArray<{ readonly subroom: string; readonly save: string }>;
  try {
    const res = buildMultiSheetImport(bytes, base);
    tocSave = res.tocSave;
    subSheets = res.subSheets;
  } catch (err) {
    const mapped = mapImportBuildError(err);
    if (mapped) return mapped;
    throw err;
  }

  for (const { subroom, save } of subSheets) {
    let res = await parentedProtocolFetch(
      env,
      subroom,
      "/_do/child-snapshot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent: base, snapshot: save, mode: "replace" }),
      },
      principal,
    );
    if (res === null) return parentedChildSkewResponse();
    if (res.status === 501) return parentedChildSkewResponse();
    // Existing public workbooks predate parent markers. They remain public;
    // private parents require the explicit, audited backfill.
    if (res.status === 409 && !isPrivate) {
      res = await doFetch(env, subroom, "/_do/snapshot", { method: "PUT", body: save }, principal);
    }
    const denied = await authVerdict(res);
    if (denied) return denied;
    if (res.status !== 201) {
      const body = await res.text().catch(() => "import failed");
      return new Response(body || "import failed", {
        status: res.status >= 400 ? res.status : 500,
        headers: { "Content-Type": TEXT_CT },
      });
    }
  }
  const toc = await doFetch(
    env,
    base,
    "/_do/snapshot",
    { method: "PUT", body: tocSave },
    principal,
  );
  const tocDenied = await authVerdict(toc);
  if (tocDenied) return tocDenied;
  if (toc.status !== 201) {
    return new Response("import failed", {
      status: toc.status >= 400 ? toc.status : 500,
      headers: { "Content-Type": TEXT_CT },
    });
  }
  return new Response("OK", {
    status: 201,
    headers: { "Content-Type": TEXT_CT, "Content-Length": "2" },
  });
}

async function appendWorkbook(
  env: Env,
  base: string,
  bytes: Uint8Array,
  principal: SessionPrincipal | null,
  format: string,
  titleHint?: string,
): Promise<Response> {
  const { errorResponse } = await getParentAccessInfo(env, base, principal);
  if (errorResponse) return errorResponse;

  let plan;
  try {
    plan = prepareAppendImportPlan(bytes, format, titleHint);
  } catch (err) {
    const mapped = mapImportBuildError(err);
    if (mapped) return mapped;
    throw err;
  }
  if (plan.count === 0) {
    return new Response("OK", {
      status: 201,
      headers: { "Content-Type": TEXT_CT, "Content-Length": "2" },
    });
  }
  const result = await reserveInitializeCommit(
    env,
    base,
    principal,
    crypto.randomUUID(),
    plan.preferredTitles,
    (firstIndex) => plan.materializeSaves(base, firstIndex),
  );
  if (!result.ok) return result.response;
  return new Response("OK", {
    status: 201,
    headers: { "Content-Type": TEXT_CT, "Content-Length": "2" },
  });
}

function titleHintFromRequest(request: Request): string | undefined {
  const url = new URL(request.url);
  const q = url.searchParams.get("title");
  if (q && q.trim()) return q.trim().slice(0, 256);
  return undefined;
}

export function registerMultiSheetImport(app: Hono<EtherCalcHonoEnv>): void {
  // 1. `/_/=:room/<fmt>` form — explicit segment form (workbook replace only).
  // Guarded Add Sheet / auto-seed path. The server assigns the child id and
  // initializes its immutable parent marker before the TOC row is committed.
  app.post("/_/:room/sheet", async (c, next) => {
    const room = c.req.param("room") ?? "";
    if (!room.startsWith("=")) return next();
    const base = room.slice(1);
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return new Response("sheet body must be valid JSON", {
        status: 400,
        headers: { "Content-Type": TEXT_CT },
      });
    }
    if (
      raw === null ||
      typeof raw !== "object" ||
      !("title" in raw) ||
      typeof raw.title !== "string" ||
      !("requestId" in raw) ||
      typeof raw.requestId !== "string" ||
      raw.requestId.length === 0 ||
      raw.requestId.length > 128 ||
      !/^[A-Za-z0-9_-]+$/.test(raw.requestId)
    ) {
      return new Response("sheet body must be {title,requestId}", {
        status: 400,
        headers: { "Content-Type": TEXT_CT },
      });
    }
    const principal = await getSessionPrincipal(c);
    const { errorResponse } = await getParentAccessInfo(c.env, base, principal);
    if (errorResponse) return errorResponse;
    const result = await reserveInitializeCommit(
      c.env,
      base,
      principal,
      raw.requestId,
      [raw.title],
      () => [""],
    );
    if (!result.ok) return result.response;
    const sheet = result.sheets[0];
    if (!sheet) {
      return new Response("sheet creation failed", {
        status: 500,
        headers: { "Content-Type": TEXT_CT },
      });
    }
    return Response.json({ sheet }, { status: 201 });
  });
  app.put("/_/:room/:fmt", async (c, next) => {
    const room = c.req.param("room") ?? "";
    const fmt = (c.req.param("fmt") ?? "").toLowerCase();
    if (!room.startsWith("=") || !(WORKBOOK_IMPORT_FORMATS as readonly string[]).includes(fmt)) {
      return next();
    }
    const base = room.slice(1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return importWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });

  // 2. `/=:room.<fmt>` form — suffix form (workbook replace only).
  app.put("/:room", async (c, next) => {
    const room = c.req.param("room") ?? "";
    if (!room.startsWith("=")) {
      return next();
    }
    const fmt = WORKBOOK_IMPORT_FORMATS.find((f) => room.toLowerCase().endsWith(`.${f}`));
    if (!fmt) {
      return next();
    }
    const base = room.slice(1, room.length - fmt.length - 1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return importWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });

  // 3. `POST /_/:room/:fmt` append form — workbook + text formats.
  app.post("/_/:room/:fmt", async (c, next) => {
    const room = c.req.param("room") ?? "";
    const fmt = (c.req.param("fmt") ?? "").toLowerCase();
    if (!room.startsWith("=") || !(APPEND_IMPORT_FORMATS as readonly string[]).includes(fmt)) {
      return next();
    }
    const base = room.slice(1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return appendWorkbook(
      c.env,
      base,
      bytes,
      await getSessionPrincipal(c),
      fmt,
      titleHintFromRequest(c.req.raw),
    );
  });

  // 4. `POST /=:room.<fmt>` append form — workbook + text formats.
  app.post("/:room", async (c, next) => {
    const room = c.req.param("room") ?? "";
    if (!room.startsWith("=")) {
      return next();
    }
    const fmt = APPEND_IMPORT_FORMATS.find((f) => room.toLowerCase().endsWith(`.${f}`));
    if (!fmt) {
      return next();
    }
    const base = room.slice(1, room.length - fmt.length - 1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return appendWorkbook(
      c.env,
      base,
      bytes,
      await getSessionPrincipal(c),
      fmt,
      titleHintFromRequest(c.req.raw),
    );
  });
}
