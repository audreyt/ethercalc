import { afterEach, beforeEach, describe, it, expect, vi } from "vite-plus/test";
import * as XLSX from "@e965/xlsx";

import { buildApp } from "../src/index.ts";
import type { Env } from "../src/env.ts";
import { computeAuth } from "../src/lib/auth.ts";
import { SESSION_REVERIFY_TTL_MS } from "../src/lib/session-middleware.ts";

/**
 * Phase A route-security tests for the DO dispatch surfaces outside
 * `routes/rooms.ts`: exports, multi-sheet import, the `/:template/form`
 * clone, and the `/_ws/:room` upgrade proxy.
 *
 * Contract under test (same as routes-rooms.node.test.ts):
 *   1. identity threading — the `X-EC-Uid` the DO sees comes ONLY from
 *      the verified session principal, never from inbound headers;
 *   2. verdict propagation — DO 401/403 pass through verbatim
 *      (status + text/plain body) instead of being swallowed;
 *   3. effect ordering — no side-effecting dispatch after a denial.
 */

interface Call {
  url: string;
  method: string;
  bodyText?: string;
  /** `X-EC-Uid` header the route layer attached to the DO fetch (null = none). */
  uid: string | null;
  /** Upgrade header on the forwarded request (WS proxy assertions). */
  upgrade: string | null;
  /** Verified session expiry attached only by the WS proxy (null = absent). */
  sessionExp: string | null;
  /** Opaque verified session token attached only by the WS proxy. */
  session: string | null;
}

interface FakeStub {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

function makeFakeRoomNamespace(responder: (call: Call) => Response): {
  env: Env;
  calls: Call[];
} {
  const calls: Call[] = [];
  const stub: FakeStub = {
    async fetch(input, init) {
      const url = typeof input === "string" ? input : input.url;
      let bodyText: string | undefined;
      if (init?.body !== undefined) {
        bodyText =
          typeof init.body === "string"
            ? init.body
            : await new Response(init.body as BodyInit).text();
      } else if (typeof input !== "string" && input.method !== "GET") {
        bodyText = await input.text();
      }
      const method = init?.method ?? (typeof input === "string" ? "GET" : input.method);
      const headers = new Headers(
        init?.headers ?? (typeof input === "string" ? undefined : input.headers),
      );
      const call: Call = {
        url,
        method,
        uid: headers.get("X-EC-Uid"),
        upgrade: headers.get("Upgrade"),
        sessionExp: headers.get("X-EC-Session-Exp"),
        session: headers.get("X-EC-Session"),
        ...(bodyText !== undefined ? { bodyText } : {}),
      };
      calls.push(call);
      return responder(call);
    },
  };
  const env: Env = {
    ROOM: {
      idFromName: (n: string) => ({ n }) as unknown as DurableObjectId,
      get: () => stub as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
  };
  return { env, calls };
}

const AUTH_UID = "uid-passkey-1";
const AUTH_EXP = Number.MAX_SAFE_INTEGER;
const AUTH_COOKIE = "__Host-ec_sess=tok-valid";

/**
 * Layer a fake AUTH namespace over `env` so `getSessionPrincipal` resolves
 * `AUTH_UID` plus its future expiration for any `__Host-ec_sess` cookie.
 */
function withAuth(env: Env, uid: string = AUTH_UID): Env {
  return {
    ...env,
    ETHERCALC_AUTH: "1",
    ETHERCALC_ORIGIN: "https://t.test",
    AUTH: {
      idFromName: () => ({}) as DurableObjectId,
      get: () =>
        ({
          fetch: async () => Response.json({ uid, exp: AUTH_EXP }),
        }) as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
  };
}

/**
 * Like `withAuth`, until `signOut()` is called: from then on AuthDO refuses
 * the token, as it does after a logout or once the session has expired.
 * `asked()` counts the verifications AuthDO has answered.
 */
function withRevocableAuth(env: Env): { env: Env; signOut: () => void; asked: () => number } {
  let live = true;
  let asked = 0;
  return {
    env: {
      ...withAuth(env),
      AUTH: {
        idFromName: () => ({}) as DurableObjectId,
        get: () =>
          ({
            fetch: async () => {
              asked++;
              return live
                ? Response.json({ uid: AUTH_UID, exp: AUTH_EXP })
                : new Response("Invalid session", { status: 401 });
            },
          }) as unknown as DurableObjectStub,
      } as unknown as DurableObjectNamespace,
    },
    signOut: () => {
      live = false;
    },
    asked: () => asked,
  };
}

function makeOneSheetXlsx(): Uint8Array {
  const ws: XLSX.WorkSheet = { "!ref": "A1:A1", A1: { t: "s", v: "hi" } };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, ws, "Alpha");
  return new Uint8Array(XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer);
}

describe("exports — verdict propagation + identity threading", () => {
  it("GET /_/:room/csv propagates a DO 403 as text/plain", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("Forbidden", { status: 403 }));
    const app = buildApp();
    const res = await app.fetch(new Request("https://t.test/_/locked/csv"), env as never);
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBeNull();
    expect(await res.text()).toBe("Forbidden");
  });

  it("GET /:room.html propagates a DO 403", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("Forbidden", { status: 403 }));
    const app = buildApp();
    const res = await app.fetch(new Request("https://t.test/locked.html"), env as never);
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe("Forbidden");
  });

  it("preserves upstream errors on both HTML export routes", async () => {
    for (const status of [413, 503]) {
      for (const path of ["/_/locked/html", "/locked.html"]) {
        const { env, calls } = makeFakeRoomNamespace(
          () => new Response("Export unavailable", {
            status,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }),
        );
        const res = await buildApp().fetch(new Request(`https://t.test${path}`), env as never);
        expect(res.status, path).toBe(status);
        expect(res.headers.get("content-type"), path).toBe("text/plain; charset=utf-8");
        expect(await res.text(), path).toBe("Export unavailable");
        expect(calls).toHaveLength(1);
      }
    }
  });

  it("GET /_/:room/xlsx propagates a DO 401", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("Unauthorized", { status: 401 }));
    const app = buildApp();
    const res = await app.fetch(new Request("https://t.test/_/locked/xlsx"), env as never);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });

  it("threads the verified principal to the export dispatch", async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response("a,b"));
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/_/r/csv", {
        headers: { Cookie: AUTH_COOKIE, "X-EC-Uid": "uid-forged" },
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(200);
    expect(calls[0]!.uid).toBe(AUTH_UID);
  });

  it("discards forged identities for HTML, CSV, XLSX, and TOC sheet-data reads", async () => {
    const simplePaths = [
      "https://t.test/locked.html",
      "https://t.test/_/locked/csv",
      "https://t.test/_/locked/xlsx",
    ];
    for (const url of simplePaths) {
      const { env, calls } = makeFakeRoomNamespace(
        () => new Response("Forbidden", { status: 403 }),
      );
      const res = await buildApp().fetch(
        new Request(url, {
          headers: { Cookie: AUTH_COOKIE, "X-EC-Uid": "uid-forged" },
        }),
        withAuth(env) as never,
      );
      expect(res.status, url).toBe(403);
      expect(calls).toHaveLength(1);
      expect(calls[0]!.uid, url).toBe(AUTH_UID);
    }

    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes("/_do/csv.json")) {
        return Response.json([
          ["#url", "#title"],
          ["/book.1", "Sheet"],
        ]);
      }
      return Response.json({ cells: {}, valueformats: {} });
    });
    const res = await buildApp().fetch(
      new Request("https://t.test/_/=book/xlsx", {
        headers: { Cookie: AUTH_COOKIE, "X-EC-Uid": "uid-forged" },
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(200);
    expect(calls.map((call) => call.uid)).toEqual([AUTH_UID, AUTH_UID]);
    expect(calls[1]!.url).toContain("/_do/sheet-data");
  });

  it("GET /_/=:room/xlsx propagates a 403 TOC read instead of hiding it as 404", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("Forbidden", { status: 403 }));
    const app = buildApp();
    const res = await app.fetch(new Request("https://t.test/_/=locked/xlsx"), env as never);
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Forbidden");
  });

  it("GET /_/=:room/xlsx propagates a 403 sub-sheet read", async () => {
    const { env } = makeFakeRoomNamespace((call) => {
      if (call.url.includes("/_do/csv.json")) {
        return Response.json([
          ["#url", "#title"],
          ["/r.1", "Alpha"],
        ]);
      }
      return new Response("Forbidden", { status: 403 });
    });
    const app = buildApp();
    const res = await app.fetch(new Request("https://t.test/_/=r/xlsx"), env as never);
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Forbidden");
  });

  it("rejects a TOC above the shared 256-sheet fan-out limit", async () => {
    const rows = [
      ["#url", "#title"],
      ...Array.from({ length: 257 }, (_, i) => [`/book.${i + 1}`, `Sheet ${i + 1}`]),
    ];
    const { env, calls } = makeFakeRoomNamespace(() => Response.json(rows));
    const res = await buildApp().fetch(new Request("https://t.test/_/=book/xlsx"), env as never);

    expect(res.status).toBe(413);
    expect(calls).toHaveLength(1);
    expect(await res.text()).toBe("multi-sheet export exceeds resource limits");
  });

  it("budgets text by what the writer makes of it, not by what the children store", async () => {
    const child = { cells: { A1: { datavalue: "\t".repeat(1_000_000), valuetype: "t" } } };
    const exportWorkbook = async (sheets: number, format: string) => {
      const { env } = makeFakeRoomNamespace((call) => {
        if (call.url.includes("/_do/csv.json")) {
          return Response.json([
            ["#url", "#title"],
            ...Array.from({ length: sheets }, (_, i) => ["/book.1", `S${i}`]),
          ]);
        }
        return Response.json(child);
      });
      return buildApp().fetch(new Request(`https://t.test/_/=book/${format}`), env as never);
    };

    expect((await exportWorkbook(3, "fods")).status).toBe(200);
    const over = await exportWorkbook(4, "fods");
    expect(over.status).toBe(413);
    expect(await over.text()).toBe("multi-sheet export exceeds resource limits");

    const failed = await exportWorkbook(1, "xlsx");
    expect(failed.status).toBe(500);
  });

  it("yields to the event loop before each child room of an export", async () => {
    let timerTurns = 0;
    let stop = false;
    const tick = (): void => {
      if (stop) return;
      timerTurns += 1;
      setTimeout(tick, 0);
    };
    setTimeout(tick, 0);
    const turnsAtChild: number[] = [];
    const { env } = makeFakeRoomNamespace((call) => {
      if (call.url.includes("/_do/csv.json")) {
        return Response.json([
          ["#url", "#title"],
          ["/book.1", "A"],
          ["/book.2", "B"],
          ["/book.3", "C"],
        ]);
      }
      turnsAtChild.push(timerTurns);
      return Response.json({ cells: {} });
    });
    try {
      const res = await buildApp().fetch(new Request("https://t.test/_/=book/xlsx"), env as never);
      expect(res.status).toBe(200);
    } finally {
      stop = true;
    }
    expect(turnsAtChild).toHaveLength(3);
    expect(turnsAtChild[1]!).toBeGreaterThan(turnsAtChild[0]!);
    expect(turnsAtChild[2]!).toBeGreaterThan(turnsAtChild[1]!);
  });

  it("budgets sparse sheets by the grid the writers walk, not by stored cells", async () => {
    const sparse = {
      cells: {
        A1: { datavalue: "x", valuetype: "t" },
        A200000: { datavalue: "y", valuetype: "t" },
      },
    };
    const exportWorkbook = async (sheets: number) => {
      const { env, calls } = makeFakeRoomNamespace((call) => {
        if (call.url.includes("/_do/csv.json")) {
          return Response.json([
            ["#url", "#title"],
            ...Array.from({ length: sheets }, (_, i) => ["/book.1", `S${i}`]),
          ]);
        }
        return Response.json(sparse);
      });
      const res = await buildApp().fetch(new Request("https://t.test/_/=book/ods"), env as never);
      return { res, calls };
    };

    const within = await exportWorkbook(2);
    expect(within.res.status).toBe(200);

    const over = await exportWorkbook(256);
    expect(over.res.status).toBe(413);
    expect(await over.res.text()).toBe("multi-sheet export exceeds resource limits");
    expect(over.calls).toHaveLength(4);
  });

  it("does not dispatch unsafe persisted TOC links", async () => {
    const { env, calls } = makeFakeRoomNamespace(() =>
      Response.json([
        ["#url", "#title"],
        ["//attacker.test/sheet", "Unsafe"],
      ]),
    );
    const res = await buildApp().fetch(new Request("https://t.test/_/=book/xlsx"), env as never);

    expect(res.status).toBe(404);
    expect(calls).toHaveLength(1);
  });

  it("rejects an oversized sub-sheet response before buffering it", async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes("/_do/csv.json")) {
        return Response.json([
          ["#url", "#title"],
          ["/book.1", "Alpha"],
        ]);
      }
      return new Response("", {
        headers: { "Content-Length": String(8 * 1024 * 1024 + 1) },
      });
    });
    const res = await buildApp().fetch(new Request("https://t.test/_/=book/xlsx"), env as never);

    expect(res.status).toBe(413);
    expect(calls).toHaveLength(2);
  });
});

describe("multi-sheet import — write verdict gating", () => {
  it("PUT /=:room.xlsx fails closed on parent access denial before any snapshot write", async () => {
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return new Response("Forbidden", { status: 403 });
      }
      return new Response("OK", { status: 201 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/=book.xlsx", {
        method: "PUT",
        body: makeOneSheetXlsx() as unknown as BodyInit,
      }),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe("Forbidden");
    // Fail on FIRST denial: parent access check only — no sub-sheet/TOC writes.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://do.local/_do/access?name=book");
  });

  it("threads the verified principal to every import write", async () => {
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: false, canRead: true, canWrite: true });
      }
      return new Response("OK", { status: 201 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/=book.xlsx", {
        method: "PUT",
        headers: { Cookie: AUTH_COOKIE },
        body: makeOneSheetXlsx() as unknown as BodyInit,
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("OK");
    // Parent access check + sub-sheet write + TOC write, all stamped.
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(call.uid).toBe(AUTH_UID);
    }
  });

  it("POST text append threads the verified owner through private parent reserve, child init, and commit", async () => {
    let allocation:
      | {
          requestId: string;
          firstIndex: number;
          sheets: Array<{ subroom: string; link: string; title: string }>;
        }
      | undefined;
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: true, canRead: true, canWrite: true });
      }
      if (req.url.includes("/_do/import-append-toc")) {
        const body: unknown = JSON.parse(req.bodyText ?? "null");
        if (!body || typeof body !== "object") {
          return new Response("bad request", { status: 400 });
        }
        const phase = Reflect.get(body, "phase");
        const requestId = Reflect.get(body, "requestId");
        if (phase === "reserve" && typeof requestId === "string") {
          allocation = {
            requestId,
            firstIndex: 1,
            sheets: [{ subroom: "book.1", link: "/book.1", title: "Alpha" }],
          };
        }
        if (allocation && phase === "commit") {
          return Response.json(
            {
              ...allocation,
              sheets: allocation.sheets.map((sheet, index) => ({
                ...sheet,
                row: index + 2,
              })),
            },
            { status: 201 },
          );
        }
        if (allocation) return Response.json(allocation, { status: 201 });
      }
      if (req.url.includes("/_do/child-snapshot")) {
        return new Response("Created", { status: 201 });
      }
      return new Response("unexpected DO call", { status: 500 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/=book.csv?title=Alpha", {
        method: "POST",
        headers: { Cookie: AUTH_COOKIE },
        body: "a,b\n1,2",
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe("OK");
    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/_do/access",
      "/_do/import-append-toc",
      "/_do/child-snapshot",
      "/_do/import-append-toc",
    ]);
    expect(calls.map((call) => call.uid)).toEqual([AUTH_UID, AUTH_UID, AUTH_UID, AUTH_UID]);
    expect(JSON.parse(calls[1]!.bodyText ?? "null")).toEqual({
      phase: "reserve",
      requestId: expect.any(String),
      sheets: [{ title: "Alpha" }],
    });
    expect(JSON.parse(calls[2]!.bodyText ?? "null")).toEqual({
      parent: "book",
      snapshot: expect.any(String),
      mode: "create",
    });
    const reserve = JSON.parse(calls[1]!.bodyText ?? "null");
    expect(JSON.parse(calls[3]!.bodyText ?? "null")).toEqual({
      phase: "commit",
      requestId: reserve.requestId,
    });
  });

  it("POST /_/=:room/socialcalc answers 413 when rewritten references outgrow the import limit", async () => {
    const room = "r".repeat(2000);
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: false, canRead: true, canWrite: true });
      }
      if (req.url.includes("/_do/import-append-toc")) {
        const body: unknown = JSON.parse(req.bodyText ?? "null");
        const requestId: unknown = body && typeof body === "object" ? Reflect.get(body, "requestId") : null;
        const sheet = { subroom: `${room}.1`, link: `/${room}.1`, title: "Imported" };
        return Response.json(
          { requestId, firstIndex: 1, sheets: [{ ...sheet, row: 2 }] },
          { status: 201 },
        );
      }
      if (req.url.includes("/_do/child-snapshot")) {
        return new Response("Created", { status: 201 });
      }
      return new Response("unexpected DO call", { status: 500 });
    });
    // 40 KB uploaded; each `a!` would become the 2,005-character `'rrr….1'!`.
    const upload = `version:1.5\ncell:A1:t:${"a!".repeat(20_000)}\nsheet:c:1:r:1\n`;
    const post = (title: string): Promise<Response> =>
      Promise.resolve(
        buildApp().fetch(
          new Request(`https://t.test/_/=${room}/socialcalc?title=${title}`, {
            method: "POST",
            body: upload,
          }),
          env as never,
        ),
      );

    const refused = await post("a");
    expect(refused.status).toBe(413);
    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/_do/access",
      "/_do/import-append-toc",
    ]);

    // Control: the same bytes under a title they do not mention go through unchanged.
    calls.length = 0;
    const accepted = await post("b");
    expect(accepted.status).toBe(201);
    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/_do/access",
      "/_do/import-append-toc",
      "/_do/child-snapshot",
      "/_do/import-append-toc",
    ]);
    expect(JSON.parse(calls[2]!.bodyText ?? "null")).toEqual({
      parent: room,
      snapshot: upload,
      mode: "create",
    });
  });
});

describe("workbook fan-out — a session that ends while the route waits", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 1_700_000_000_000, toFake: ["Date"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A busy room: it answers only after the principal memo has gone stale. */
  function keptWaiting(): void {
    vi.setSystemTime(Date.now() + SESSION_REVERIFY_TTL_MS);
  }

  function makeWorkbookXlsx(names: readonly string[]): Uint8Array {
    const book = XLSX.utils.book_new();
    for (const name of names) {
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([[name]]), name);
    }
    return new Uint8Array(XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer);
  }

  it("GET /_/=:room/xlsx stops reading as the owner", async () => {
    // The first sheet keeps the export waiting while the owner signs out.
    let signOut = (): void => {};
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes("/_do/csv.json")) {
        return Response.json([
          ["#url", "#title"],
          ["/book.1", "First"],
          ["/book.2", "Second"],
        ]);
      }
      if (call.uid === null) return new Response("Forbidden", { status: 403 });
      signOut();
      keptWaiting();
      return Response.json({ cells: {}, valueformats: {} });
    });
    const auth = withRevocableAuth(env);
    signOut = auth.signOut;
    const res = await buildApp().fetch(
      new Request("https://t.test/_/=book/xlsx", { headers: { Cookie: AUTH_COOKIE } }),
      auth.env as never,
    );
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Forbidden");
    expect(calls.map((call) => [new URL(call.url).searchParams.get("name"), call.uid])).toEqual([
      ["book", AUTH_UID],
      ["book.1", AUTH_UID],
      ["book.2", null],
    ]);
  });

  it("PUT /_/=:room/xlsx stops writing as the owner", async () => {
    // The first sheet keeps the import waiting while the owner signs out.
    let signOut = (): void => {};
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: true, canRead: true, canWrite: true });
      }
      if (req.url.includes("/_do/csv.json")) return new Response("", { status: 404 });
      if (req.uid === null) return new Response("Forbidden", { status: 403 });
      if (req.bodyText?.includes('"mode":"probe"')) return new Response("OK");
      signOut();
      keptWaiting();
      return new Response("OK", { status: 201 });
    });
    const auth = withRevocableAuth(env);
    signOut = auth.signOut;
    const res = await buildApp().fetch(
      new Request("https://t.test/_/=book/xlsx", {
        method: "PUT",
        headers: { Cookie: AUTH_COOKIE, Origin: "https://t.test" },
        body: makeWorkbookXlsx(["First", "Second", "Third"]) as unknown as BodyInit,
      }),
      auth.env as never,
    );
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Forbidden");
    const writes = calls.filter((call) => call.method !== "GET" && !call.bodyText?.includes('"mode":"probe"'));
    // The sheet already sent, then one refused attempt: no third sheet, no TOC.
    expect(writes.map((call) => [new URL(call.url).searchParams.get("name"), call.uid])).toEqual([
      ["book.1", AUTH_UID],
      ["book.2", null],
    ]);
  });

  it("PUT /_/=:room/xlsx stops writing as the owner when the probes were kept waiting", async () => {
    let signOut = (): void => {};
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: true, canRead: true, canWrite: true });
      }
      if (req.url.includes("/_do/csv.json")) return new Response("", { status: 404 });
      if (req.uid === null) return new Response("Forbidden", { status: 403 });
      signOut();
      keptWaiting();
      return new Response("OK");
    });
    const auth = withRevocableAuth(env);
    signOut = auth.signOut;
    const res = await buildApp().fetch(
      new Request("https://t.test/_/=book/xlsx", {
        method: "PUT",
        headers: { Cookie: AUTH_COOKIE, Origin: "https://t.test" },
        body: makeWorkbookXlsx(["First", "Second"]) as unknown as BodyInit,
      }),
      auth.env as never,
    );
    expect(res.status).toBe(403);
    // Nothing but probes went out as the owner: no sheet was replaced.
    expect(calls.filter((call) => call.uid !== null && call.bodyText?.includes('"mode":"replace"'))).toEqual([]);
    expect(calls.at(-1)!.uid).toBeNull();
  });

  it("PUT /_/=:room/xlsx drops the uid from the legacy fallback and the TOC of a public workbook", async () => {
    let signOut = (): void => {};
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: false, canRead: true, canWrite: true });
      }
      if (req.url.includes("/_do/child-snapshot")) {
        signOut();
        keptWaiting();
        return new Response("Conflict", { status: 409 });
      }
      return new Response("OK", { status: 201 });
    });
    const auth = withRevocableAuth(env);
    signOut = auth.signOut;
    const res = await buildApp().fetch(
      new Request("https://t.test/_/=book/xlsx", {
        method: "PUT",
        headers: { Cookie: AUTH_COOKIE, Origin: "https://t.test" },
        body: makeOneSheetXlsx() as unknown as BodyInit,
      }),
      auth.env as never,
    );
    // A public workbook takes anonymous writes; only the uid is dropped.
    expect(res.status).toBe(201);
    expect(calls.map((call) => [new URL(call.url).pathname, call.uid])).toEqual([
      ["/_do/access", AUTH_UID],
      ["/_do/child-snapshot", AUTH_UID],
      ["/_do/snapshot", null],
      ["/_do/snapshot", null],
    ]);
  });

  it("POST text append stops acting as the owner", async () => {
    const sheets = [{ subroom: "book.1", link: "/book.1", title: "Alpha" }];
    const owner = (path: string): [string, string | null] => [path, AUTH_UID];
    const sent: Record<string, Array<[string, string | null]>> = {
      "/_do/access": [owner("/_do/access"), ["/_do/import-append-toc", null]],
      "/_do/import-append-toc": [
        owner("/_do/access"),
        owner("/_do/import-append-toc"),
        ["/_do/child-snapshot", null],
      ],
      "/_do/child-snapshot": [
        owner("/_do/access"),
        owner("/_do/import-append-toc"),
        owner("/_do/child-snapshot"),
        ["/_do/import-append-toc", null],
      ],
    };
    for (const [endsAt, expected] of Object.entries(sent)) {
      let signOut = (): void => {};
      const { env, calls } = makeFakeRoomNamespace((req) => {
        if (req.uid === null) return new Response("Forbidden", { status: 403 });
        if (req.url.includes(endsAt)) {
          signOut();
          keptWaiting();
        }
        if (req.url.includes("/_do/access")) {
          return Response.json({ isPrivate: true, canRead: true, canWrite: true });
        }
        if (req.url.includes("/_do/child-snapshot")) return new Response("Created", { status: 201 });
        const requestId: unknown = JSON.parse(req.bodyText ?? "{}").requestId;
        return Response.json({ requestId, firstIndex: 1, sheets }, { status: 201 });
      });
      const auth = withRevocableAuth(env);
      signOut = auth.signOut;
      const res = await buildApp().fetch(
        new Request("https://t.test/=book.csv?title=Alpha", {
          method: "POST",
          headers: { Cookie: AUTH_COOKIE, Origin: "https://t.test" },
          body: "a,b\n1,2",
        }),
        auth.env as never,
      );
      expect(res.status, endsAt).toBe(403);
      expect(await res.text(), endsAt).toBe("Forbidden");
      // Whatever is sent after the sign-out does not carry the owner's uid.
      expect(calls.map((call) => [new URL(call.url).pathname, call.uid]), endsAt).toEqual(expected);
    }
  });

  it("asks AuthDO once for an import that no room keeps waiting", async () => {
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: false, canRead: true, canWrite: true });
      }
      return new Response("OK", { status: 201 });
    });
    const auth = withRevocableAuth(env);
    const res = await buildApp().fetch(
      new Request("https://t.test/_/=book/xlsx", {
        method: "PUT",
        headers: { Cookie: AUTH_COOKIE, Origin: "https://t.test" },
        body: makeWorkbookXlsx(["First", "Second", "Third"]) as unknown as BodyInit,
      }),
      auth.env as never,
    );
    expect(res.status).toBe(201);
    // Access check, three sheets and the TOC on one verification.
    expect(calls.map((call) => call.uid)).toEqual(Array(5).fill(AUTH_UID));
    expect(auth.asked()).toBe(1);
  });

  it("PUT /_/:room drops the signed-out uid after waiting for access/body", async () => {
    let signOut = (): void => {};
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        signOut();
        keptWaiting();
        return Response.json({ isPrivate: true, canRead: true, canWrite: true });
      }
      if (req.uid === null) return new Response("Forbidden", { status: 403 });
      return new Response("OK", { status: 201 });
    });
    const auth = withRevocableAuth(env);
    signOut = auth.signOut;
    const res = await buildApp().fetch(
      new Request("https://t.test/_/priv-room", {
        method: "PUT",
        headers: {
          Cookie: AUTH_COOKIE,
          Origin: "https://t.test",
          "content-type": "text/x-socialcalc",
        },
        body: "version:1.5\n",
      }),
      { ...auth.env, ETHERCALC_KEY: "operator-key" } as never,
    );
    expect(res.status).toBe(403);
    expect(calls.map((call) => [new URL(call.url).pathname, call.uid])).toEqual([
      ["/_do/access", AUTH_UID],
      ["/_do/snapshot", null],
    ]);
  });

  it("POST /_/:room drops the signed-out uid after waiting on loadclipboard snapshot", async () => {
    let signOut = (): void => {};
    const { env, calls } = makeFakeRoomNamespace((req) => {
      if (req.url.includes("/_do/access")) {
        return Response.json({ isPrivate: true, canRead: true, canWrite: true });
      }
      if (req.url.includes("/_do/snapshot")) {
        signOut();
        keptWaiting();
        return new Response("version:1.5\n");
      }
      if (req.uid === null) return new Response("Forbidden", { status: 403 });
      return new Response(null, { status: 202 });
    });
    const auth = withRevocableAuth(env);
    signOut = auth.signOut;
    const res = await buildApp().fetch(
      new Request("https://t.test/_/priv-room", {
        method: "POST",
        headers: {
          Cookie: AUTH_COOKIE,
          Origin: "https://t.test",
          "content-type": "text/x-socialcalc",
        },
        body: "loadclipboard version\\c1.5\\ncell\\cA1\\ct\\chi",
      }),
      { ...auth.env, ETHERCALC_KEY: "operator-key" } as never,
    );
    expect(res.status).toBe(403);
    expect(calls.map((call) => [new URL(call.url).pathname, call.uid])).toEqual([
      ["/_do/access", AUTH_UID],
      ["/_do/snapshot", AUTH_UID],
      ["/_do/commands", null],
    ]);
  });
});

describe("/:template/form clone — verdict propagation", () => {
  it.each(["cross-site", "same-site", "unexpected"])(
    "rejects %s navigation without cloning",
    async (site) => {
      const { env, calls } = makeFakeRoomNamespace(() => new Response("OK", { status: 201 }));
      const headers = new Headers({ "Sec-Fetch-Site": site });
      const res = await buildApp().fetch(
        new Request("https://t.test/tpl/form", { headers, redirect: "manual" }),
        env as never,
      );
      expect(res.status).toBe(403);
      expect(calls).toHaveLength(0);
    },
  );

  // A cell `<img>` (or a script fetch) on one of our own sheets.
  it.each([
    ["no-cors", "image"],
    ["cors", "empty"],
  ])(
    "rejects a same-origin %s load as %s without cloning",
    async (mode, dest) => {
      const { env, calls } = makeFakeRoomNamespace(() => new Response("OK", { status: 201 }));
      const headers = new Headers({
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": mode,
        "Sec-Fetch-Dest": dest,
      });
      const res = await buildApp().fetch(
        new Request("https://t.test/tpl/form", { headers, redirect: "manual" }),
        env as never,
      );
      expect(res.status).toBe(403);
      expect(calls).toHaveLength(0);
    },
  );

  it("clones on a same-origin navigation", async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response("OK", { status: 201 }));
    const res = await buildApp().fetch(
      new Request("https://t.test/tpl/form", {
        headers: {
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Dest": "document",
        },
        redirect: "manual",
      }),
      env as never,
    );
    expect(res.status).toBe(302);
    expect(calls).toHaveLength(1);
  });

  it("clones when the client sends no Fetch Metadata", async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response("OK", { status: 201 }));
    const res = await buildApp().fetch(
      new Request("https://t.test/tpl/form", { redirect: "manual" }),
      env as never,
    );
    expect(res.status).toBe(302);
    expect(calls.some((call) => call.url.includes("/_do/clone"))).toBe(true);
  });

  it("propagates a DO 403 clone verdict instead of redirecting", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("Forbidden", { status: 403 }));
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/tpl/form", {
        headers: { "Sec-Fetch-Site": "same-origin" }, redirect: "manual",
      }),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe("Forbidden");
    expect(res.headers.get("location")).toBeNull();
  });

  it("still redirects (302) when the clone succeeds, threading the principal", async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response("OK", { status: 201 }));
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/tpl/form", {
        headers: { Cookie: AUTH_COOKIE, "Sec-Fetch-Site": "same-origin" },
        redirect: "manual",
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/^\/tpl_[a-z0-9]{12}\/app$/);
    const clone = calls.find((c) => c.url.includes("/_do/clone"));
    expect(clone).toBeDefined();
    expect(clone!.uid).toBe(AUTH_UID);
  });

  it("carries a capability only for a newly cloned room under a key", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("OK", { status: 201 }));
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/tpl/form", {
        headers: { "Sec-Fetch-Site": "same-origin" }, redirect: "manual",
      }),
      { ...env, ETHERCALC_KEY: "test-key" } as never,
    );
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    const match = /^\/(tpl_[a-z0-9]{12})\/app\?auth=([a-f0-9]{64})$/.exec(location);
    expect(match).not.toBeNull();
    expect(match![2]).toBe(await computeAuth("test-key", match![1]!));
    const appRes = await app.fetch(
      new Request(`https://t.test/${match![1]}/app?auth=${match![2]}`, { redirect: "manual" }),
      { ...env, ETHERCALC_KEY: "test-key" } as never,
    );
    expect(appRes.headers.get("location")).toBe(`/${match![1]}?auth=${match![2]}&app=1`);
  });

  it("returns a failed clone verdict without issuing a room link", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("Clone unavailable", { status: 502 }));
    const res = await buildApp().fetch(
      new Request("https://t.test/tpl/form", {
        headers: { "Sec-Fetch-Site": "same-origin" }, redirect: "manual",
      }), env as never,
    );
    expect(res.status).toBe(502);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("HEAD on the room-minting GET routes", () => {
  // Hono serves HEAD from the GET handler, so the policy gates in front of
  // these routes must classify HEAD the way they classify GET.
  const templateResponder = (call: Call): Response => {
    if (call.url.includes("/_do/access")) {
      return Response.json({ isPrivate: false, parented: false, canRead: true });
    }
    if (call.url.includes("/_do/snapshot") && call.method === "GET") {
      return new Response("TPL-SNAP");
    }
    return new Response("OK", { status: 201 });
  };

  it.each([
    ["GET", "/_from/tpl"],
    ["HEAD", "/_from/tpl"],
    ["GET", "/tpl/form"],
    ["HEAD", "/tpl/form"],
  ])("refuses a Sandstorm viewer's %s %s before any room dispatch", async (method, path) => {
    const { env, calls } = makeFakeRoomNamespace(templateResponder);
    const res = await buildApp().fetch(
      new Request(`https://t.test${path}`, {
        method,
        headers: { "X-Sandstorm-Permissions": "" },
        redirect: "manual",
      }),
      { ...env, ETHERCALC_SANDSTORM: "1" } as never,
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it.each(["/_from/tpl", "/tpl/form"])(
    "still lets a Sandstorm editor's HEAD %s run the copy",
    async (path) => {
      const { env, calls } = makeFakeRoomNamespace(templateResponder);
      const res = await buildApp().fetch(
        new Request(`https://t.test${path}`, {
          method: "HEAD",
          headers: { "X-Sandstorm-Permissions": "modify" },
          redirect: "manual",
        }),
        { ...env, ETHERCALC_SANDSTORM: "1" } as never,
      );
      expect(res.status).toBe(302);
      expect(calls.some((call) => call.method === "PUT" || call.method === "POST")).toBe(true);
    },
  );

  it("counts HEAD against the room-creation limit", async () => {
    const { env, calls } = makeFakeRoomNamespace(templateResponder);
    const app = buildApp();
    const head = async (): Promise<Response> =>
      app.fetch(
        new Request("https://t.test/tpl/form", {
          method: "HEAD",
          headers: { "CF-Connecting-IP": "203.0.113.77" },
          redirect: "manual",
        }),
        { ...env, ETHERCALC_ROOM_CREATE_LIMIT: "3600:1" } as never,
      );
    expect((await head()).status).toBe(302);
    const limited = await head();
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).not.toBeNull();
    expect(calls.filter((call) => call.url.includes("/_do/clone"))).toHaveLength(1);
  });
});

describe("private owner entry with ETHERCALC_KEY", () => {
  it("routes a verified owner without a usable legacy auth token through /edit", async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes("/_do/access")) {
        return Response.json({ isPrivate: true, canRead: true, canWrite: true });
      }
      return new Response("unexpected", { status: 500 });
    });
    const app = buildApp();

    const res = await app.fetch(
      new Request("https://t.test/private-owner", {
        headers: { Cookie: AUTH_COOKIE },
        redirect: "manual",
      }),
      {
        ...withAuth(env),
        ETHERCALC_KEY: "test-key",
      } as never,
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/private-owner/edit");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://do.local/_do/access?name=private-owner");
    expect(calls[0]!.uid).toBe(AUTH_UID);

    const edit = await app.fetch(
      new Request("https://t.test/private-owner/edit", {
        headers: { Cookie: AUTH_COOKIE },
        redirect: "manual",
      }),
      {
        ...withAuth(env),
        ETHERCALC_KEY: "test-key",
      } as never,
    );
    expect(edit.status).toBe(302);
    expect(edit.headers.get("location")).toMatch(/^\/private-owner\?auth=(?!0$).+/);
    expect(calls).toHaveLength(2);
    expect(calls[1]!.url).toBe("https://do.local/_do/access?name=private-owner");
    expect(calls[1]!.uid).toBe(AUTH_UID);

    const appMode = await app.fetch(
      new Request("https://t.test/private-owner?auth=nonzero&app=1", {
        headers: { Cookie: AUTH_COOKIE },
        redirect: "manual",
      }),
      {
        ...withAuth(env),
        ETHERCALC_KEY: "test-key",
      } as never,
    );
    expect(appMode.status).toBe(302);
    expect(appMode.headers.get("location")).toBe("/private-owner/view");
  });
});

describe("/_ws/:room upgrade — verified identity only", () => {
  it("never copies inbound X-EC identity headers onto the DO upgrade", async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response("ws-ok"));
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/_ws/r?user=u1&auth=0", {
        headers: {
          Upgrade: "websocket",
          "X-EC-Uid": "uid-forged",
          "X-EC-Session": "session-forged",
        },
      }),
      env as never,
    );
    expect(await res.text()).toBe("ws-ok");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.upgrade).toBe("websocket");
    expect(calls[0]!.uid).toBeNull();
    expect(calls[0]!.session).toBeNull();
    // Query params still flow through untouched.
    expect(calls[0]!.url).toBe("https://do.local/_do/ws?user=u1&auth=0&room=r");
  });

  it("stamps the verified principal uid on the upgrade headers", async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response("ws-ok"));
    const app = buildApp();
    const res = await app.fetch(
      new Request("https://t.test/_ws/r?user=u1", {
        headers: {
          Upgrade: "websocket",
          Origin: "https://t.test",
          Cookie: AUTH_COOKIE,
          "X-EC-Uid": "uid-forged",
        },
      }),
      withAuth(env) as never,
    );
    expect(await res.text()).toBe("ws-ok");
    expect(calls[0]!.upgrade).toBe("websocket");
    // Exactly the verified uid — never the forged inbound value.
    expect(calls[0]!.uid).toBe(AUTH_UID);
    expect(calls[0]!.sessionExp).toBe(String(AUTH_EXP));
    expect(calls[0]!.session).toBe("tok-valid");
  });

  it.each([undefined, "https://evil.test"])(
    "rejects a session-bearing upgrade from an untrusted Origin: %s",
    async (origin) => {
      const { env, calls } = makeFakeRoomNamespace(() => new Response("ws-ok"));
      const headers: Record<string, string> = {
        Upgrade: "websocket",
        Cookie: AUTH_COOKIE,
      };
      if (origin !== undefined) headers["Origin"] = origin;
      const res = await buildApp().fetch(
        new Request("https://t.test/_ws/r?user=u1", { headers }),
        withAuth(env) as never,
      );
      expect(res.status).toBe(403);
      expect(calls).toHaveLength(0);
    },
  );

  it.each(["user=a&user=b", `user=${"u".repeat(257)}`, `auth=${"a".repeat(513)}`])(
    "rejects ambiguous or oversized upgrade parameters: %s",
    async (query) => {
      const { env, calls } = makeFakeRoomNamespace(() => new Response("ws-ok"));
      const res = await buildApp().fetch(
        new Request(`https://t.test/_ws/r?${query}`, {
          headers: { Upgrade: "websocket" },
        }),
        env as never,
      );
      expect(res.status).toBe(400);
      expect(calls).toHaveLength(0);
    },
  );
});

describe("session mutation CSRF boundary", () => {
  it.each([
    ["https://evil.test", undefined],
    [undefined, "cross-site"],
  ])("rejects a session mutation with Origin=%s Sec-Fetch-Site=%s", async (origin, fetchSite) => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response(null, { status: 201 }));
    const headers = new Headers({
      Cookie: AUTH_COOKIE,
      "Content-Type": "text/x-socialcalc",
    });
    if (origin !== undefined) headers.set("Origin", origin);
    if (fetchSite !== undefined) headers.set("Sec-Fetch-Site", fetchSite);
    const response = await buildApp().fetch(
      new Request("https://t.test/_/csrf-room", {
        method: "PUT",
        headers,
        body: "version:1.5",
      }),
      withAuth(env) as never,
    );
    expect(response.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("allows the configured origin to mutate with a session", async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response(null, { status: 201 }));
    const response = await buildApp().fetch(
      new Request("https://t.test/_/csrf-room", {
        method: "PUT",
        headers: {
          Cookie: AUTH_COOKIE,
          Origin: "https://t.test",
          "Content-Type": "text/x-socialcalc",
        },
        body: "version:1.5",
      }),
      withAuth(env) as never,
    );
    expect(response.status).toBe(201);
    expect(calls.length).toBeGreaterThan(0);
  });
});

describe("global response hardening", () => {
  it("adds browser baseline headers without blocking documented framing", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(new Request("https://t.test/_health"), env as never);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self' wss://t.test");
    const connectSources = csp
      ?.split(";")
      .find((directive) => directive.trimStart().startsWith("connect-src"))
      ?.trim()
      .split(/\s+/);
    expect(connectSources).not.toContain("ws:");
    expect(connectSources).not.toContain("wss:");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).not.toContain("img-src https:");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("frame-ancestors");
    expect(response.headers.get("Permissions-Policy")).toBe(
      "camera=(), geolocation=(), microphone=()",
    );
    expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    expect(response.headers.get("X-Frame-Options")).toBeNull();
  });

  it("marks non-landing responses noindex and leaves the homepage indexable", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response("ok"));
    const app = buildApp();
    const room = await app.fetch(new Request("https://t.test/abcdef012345"), env as never);
    const exportCsv = await app.fetch(new Request("https://t.test/abcdef012345.csv"), env as never);
    const health = await app.fetch(new Request("https://t.test/_health"), env as never);
    const robots = await app.fetch(new Request("https://t.test/robots.txt"), env as never);
    // Landing pages are served from ASSETS; when the binding is absent
    // the route still runs through the same header middleware, so we
    // assert the *absence* of the noindex tag on `/` via a path that
    // is on the allowlist even without ASSETS (`isIndexablePath`).
    // `/_health` is deliberately NOT allowlisted — operators probe it,
    // crawlers must not index it.
    expect(room.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    expect(exportCsv.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    expect(health.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    expect(robots.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    const robotsBody = await robots.text();
    expect(robotsBody).toMatch(/^User-agent: \*/);
    expect(robotsBody).not.toMatch(/^\s*Disallow\s*:/im);
  });

  it("does not noindex the public landing path", async () => {
    // `/` goes through ASSETS; without the binding it 500s/404s, but the
    // global middleware still stamps headers on whatever status comes
    // back. We only care that the allowlist skipped X-Robots-Tag.
    const { env } = makeFakeRoomNamespace(() => new Response());
    // Provide a minimal ASSETS fetcher so `/` returns 200 rather than
    // falling through a missing-binding path.
    const envWithAssets = {
      ...env,
      ASSETS: {
        fetch: async () =>
          new Response("<html></html>", {
            headers: { "Content-Type": "text/html" },
          }),
      },
    };
    const app = buildApp();
    const root = await app.fetch(new Request("https://t.test/"), envWithAssets as never);
    const start = await app.fetch(new Request("https://t.test/_start"), envWithAssets as never);
    expect(root.headers.get("X-Robots-Tag")).toBeNull();
    // Secondary start page is user navigation chrome, not marketing.
    expect(start.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
  });

  it("allows only the request host for local plaintext WebSockets", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request("http://127.0.0.1:8787/_health"),
      env as never,
    );
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "connect-src 'self' ws://127.0.0.1:8787",
    );
  });

  it("makes every session-bearing response private and non-cacheable", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request("https://t.test/_health", {
        headers: { Cookie: AUTH_COOKIE },
      }),
      env as never,
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toContain("Cookie");
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'self'");
  });

  it("makes bearer and operator-route responses non-cacheable", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request("https://t.test/_health", {
        headers: { Authorization: "Bearer test" },
      }),
      env as never,
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toContain("Authorization");
  });

  it("does not upgrade resources on a direct HTTP self-host response", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(new Request("http://t.test/_health"), env as never);
    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
    expect(response.headers.get("Content-Security-Policy")).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("honors the official proxy HTTPS scheme header", async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request("http://t.test/_health", {
        headers: { "X-Forwarded-Proto": "https" },
      }),
      env as never,
    );
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    expect(response.headers.get("Content-Security-Policy")).toContain("upgrade-insecure-requests");
  });
});
