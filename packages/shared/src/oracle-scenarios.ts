/**
 * Oracle scenario schema — see CLAUDE.md §4.
 *
 * A scenario is a deterministic recipe that can be replayed against the
 * oracle (current `main` branch of EtherCalc) and against the new worker.
 * The oracle recorder fills in `expect` fields during recording; the
 * replay step asserts those expectations against the target.
 *
 * Request/response bodies are base64-encoded so binary formats (xlsx, ods)
 * round-trip cleanly through JSON.
 */

export interface HttpRequestDef {
  readonly method: string;
  readonly path: string;
  readonly headers?: Readonly<Record<string, string>>;
  /** Base64-encoded body. Omit for GET/HEAD/DELETE. */
  readonly bodyBase64?: string;
}

export type BodyMatcher =
  | 'exact' // byte-identical
  | 'html' // structurally equal after linkedom normalization
  | 'xlsx' // structurally equal after unzip + XML canonical form
  | 'ods' // structurally equal after unzip + XML canonical form
  | 'scsave' // SocialCalc save: ignore version line + metadata ordering
  | 'json' // parse both and deepEqual
  | 'ignore'; // body not compared

export interface HttpResponseExpectation {
  readonly status: number;
  /**
   * Headers to assert. Case-insensitive lookup. Other headers are ignored.
   * Typically: `Content-Type`, `Location`, `Content-Disposition`.
   */
  readonly headers: Readonly<Record<string, string>>;
  /** Base64-encoded body. `null` means "body ignored". */
  readonly bodyBase64: string | null;
  /** How to compare bodies. Defaults to `exact`. */
  readonly bodyMatcher?: BodyMatcher;
}

export interface HttpScenario {
  readonly name: string;
  readonly kind: 'http';
  readonly request: HttpRequestDef;
  /** Filled in by the recorder when replaying against the oracle. */
  readonly expect?: HttpResponseExpectation;
}

// ─── WebSocket scenarios ──────────────────────────────────────────────────

export interface WsConnectStep {
  readonly type: 'connect';
  readonly url: string;
  /** Optional client-id label — referenced by `send`/`expect` steps to route to a specific WS in multi-client scenarios. */
  readonly id?: string;
}

export interface WsSendStep {
  readonly type: 'send';
  readonly id?: string;
  readonly msg: unknown;
}

export interface WsExpectStep {
  readonly type: 'expect';
  readonly id?: string;
  /** Match rules: exact deep-equal, or a partial object (subset match). */
  readonly msg: unknown;
  readonly match?: 'exact' | 'partial';
  /** Max ms to wait for this frame before declaring a failure. */
  readonly timeoutMs?: number;
}

export interface WsHttpStep {
  readonly type: 'http';
  readonly request: HttpRequestDef;
  readonly expect?: HttpResponseExpectation;
}

export interface WsSleepStep {
  readonly type: 'sleep';
  readonly ms: number;
}

export interface WsCloseStep {
  readonly type: 'close';
  readonly id?: string;
}

export type WsStep =
  | WsConnectStep
  | WsSendStep
  | WsExpectStep
  | WsHttpStep
  | WsSleepStep
  | WsCloseStep;

export interface WsScenario {
  readonly name: string;
  readonly kind: 'ws';
  readonly steps: readonly WsStep[];
}

export type Scenario = HttpScenario | WsScenario;

/**
 * Human-readable normalization rules, documented here so test authors know
 * what to expect. Actual comparison logic lives in `packages/worker/src/lib/`
 * (HTML/XLSX normalizers) and in the oracle-harness package.
 */
export const NORMALIZATION_RULES: Readonly<Record<BodyMatcher, string>> = {
  exact: 'Byte-identical comparison.',
  html: 'Parsed via linkedom, re-serialized, whitespace-only text nodes dropped.',
  xlsx: 'Unzip; sort entries by name; compare each XML after canonical formatting.',
  ods: 'Unzip; sort entries by name; compare each XML after canonical formatting.',
  scsave: 'SocialCalc save: drop `version:...` line; compare sheet/cell lines exactly; metadata section ordering ignored.',
  json: 'Parse both sides; deep structural equality.',
  ignore: 'Body not checked.',
};
