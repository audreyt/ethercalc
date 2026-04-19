/**
 * Client entry point — port of `src/player.ls`.
 *
 * Wired as a side-effect module: importing this file connects the WS and
 * installs the SocialCalc callbacks.  We keep no exports here (CLAUDE.md
 * §8 Phase 10 "drop-in compat"), but tests exercise the helpers via
 * `runMain`.
 *
 * Loading flow:
 *   1. Parse `location.search` → `SocialCalc._auth` / `._app` / `._view`.
 *   2. Derive the room name from `window.EtherCalc._room`, URL hash, or
 *      Drupal sheetnode conventions.
 *   3. Rewrite the URL via `history.pushState` to `/:room/{edit,view,app}`
 *      to match the legacy player.
 *   4. Open a WS via `createWsAdapter` and install `SocialCalc.Callbacks.broadcast`.
 *   5. Subscribe to server messages and dispatch into the SocialCalc APIs.
 */
import type {
  BroadcastFn,
  SocialCalcGlobal,
  SpreadsheetLike,
} from './types.ts';
import type {
  EcellServerMessage,
  EcellsServerMessage,
  ExecuteServerMessage,
  LogServerMessage,
  RecalcServerMessage,
  ServerMessage,
  SnapshotServerMessage,
} from '@ethercalc/shared/messages';
import { parseQuery, installCallbacks, installBroadcast, installRecalcLoader } from './socialcalc-callbacks.ts';
import { createWsAdapter, type CreateWsAdapterOptions, type WsAdapter } from './ws-adapter.ts';

// ─── Host injection surface ──────────────────────────────────────────────

/**
 * Everything we need from the global.  Carved out so tests can construct a
 * stub without polluting the real `window`.
 */
export interface MainHost {
  SocialCalc: SocialCalcGlobal;
  EtherCalc?: { _room?: string };
  location: { search: string; hash: string; pathname: string };
  history: { pushState: (state: unknown, title: string, url: string) => void };
  addmsg?: (msg: string, joined?: boolean) => void;
  spreadsheet?: SpreadsheetLike;
  DoGraph?: (help: boolean, resize: boolean) => void;
  setTimeout: (fn: () => void, ms: number) => number;
  /**
   * Only present when the embedding site wanted the Drupal-sheetnode
   * mapping (CLAUDE.md §7 item 10).  Plain websites leave it unset.
   */
  Drupal?: { sheetnode?: { sheetviews?: unknown[] } };
}

export interface RunMainOptions extends Partial<Omit<CreateWsAdapterOptions, 'room' | 'user'>> {
  host: MainHost;
  /** Randomizer for the username.  Tests inject a deterministic value. */
  randomUsername?: () => string;
  /** Override for connection base URL.  Defaults to `host.location`. */
  baseUrl?: string;
}

function defaultRandomUsername(): string {
  // Mirrors `Math.random!toString!` in `player.ls:7`.
  return Math.random().toString();
}

function stripRoom(raw: string): string {
  return raw.replace(/^_+/, '').replace(/\?.*/, '');
}

// ─── Main entry ──────────────────────────────────────────────────────────

export interface MainHandle {
  adapter: WsAdapter;
  username: string;
  room: string;
  broadcast: BroadcastFn;
  /** Close the underlying socket.  Used only from tests. */
  stop(): void;
}

/**
 * Side-effect entry executed from `side-effect.ts` (and directly by tests).
 * Returns the constructed adapter so tests can dispose cleanly.
 *
 * Returns `null` if no room is resolvable — matches the legacy redirect
 * to `./_start` (line 43).  Redirect is deferred to the caller / browser
 * because we don't want to navigate in test environments.
 */
export function runMain(opts: RunMainOptions): MainHandle | null {
  const host = opts.host;
  const SocialCalc = host.SocialCalc;
  const randomUsername = opts.randomUsername ?? defaultRandomUsername;

  // Step 1 — parse query string + set session flags.
  SocialCalc.requestParams = parseQuery(host.location.search);
  SocialCalc._username = randomUsername();
  SocialCalc.isConnected = true;
  const reqParams = SocialCalc.requestParams;
  if (reqParams['auth'] !== undefined) SocialCalc._auth = reqParams['auth'];
  if (reqParams['app'] !== undefined) SocialCalc._app = true;
  if (reqParams['view'] !== undefined) SocialCalc._view = true;

  // Step 2 — resolve the room id.
  let room = SocialCalc._room;
  if (!room) room = host.EtherCalc?._room;
  if (!room) room = host.location.hash.replace('#', '');
  if (!room) {
    // Caller is expected to redirect to /_start — we just refuse to connect.
    return null;
  }
  room = stripRoom(room);
  SocialCalc._room = room;

  // Step 3 — rewrite URL to canonical `./<room>/<suffix>`.
  const suffix = SocialCalc._app
    ? '/app'
    : SocialCalc._view
    ? '/view'
    : SocialCalc._auth !== undefined
    ? '/edit'
    : '';
  host.history.pushState({}, '', `./${room}${suffix}`);

  // Step 4 — open the WS.  Flatten option spread — `exactOptionalPropertyTypes`
  // normally wants us to gate each optional, but `createWsAdapter` already
  // treats `undefined` as "not supplied" and omitting the gates lets us hit
  // 100% branch coverage.
  const baseUrl = opts.baseUrl ?? deriveBaseUrl(host.location.pathname, room);
  const adapter = createWsAdapter({
    room,
    user: SocialCalc._username,
    auth: SocialCalc._auth,
    url: baseUrl,
    reconnectDelayMs: opts.reconnectDelayMs,
    maxReconnectAttempts: opts.maxReconnectAttempts,
    wsFactory: opts.wsFactory,
    setTimeoutFn: opts.setTimeoutFn,
    clearTimeoutFn: opts.clearTimeoutFn,
    onStatus: opts.onStatus,
  });

  // Step 5 — wire broadcast + callbacks + handlers.
  const broadcast: BroadcastFn = (type, data) => {
    adapter.broadcast(type, data);
  };
  installBroadcast(SocialCalc, broadcast);
  installCallbacks(SocialCalc, { broadcast, search: host.location.search });
  installRecalcLoader(SocialCalc, broadcast);

  const dispatcher = createDispatcher(host);
  adapter.onMessage(dispatcher);

  return {
    adapter,
    username: SocialCalc._username,
    room,
    broadcast,
    stop(): void {
      adapter.close();
    },
  };
}

/**
 * Given `location.pathname` (e.g. `/abc123/edit`) + the resolved room, strip
 * the trailing `/edit|/view|<room>` segments to obtain the endpoint the WS
 * should connect to.  Port of `player.ls:16`.  We do *not* go through a
 * `<script src="/socket.io/socket.io.js">` sniff anymore — socket.io is
 * gone and the WS always lives at `/_ws/:room` relative to the base.
 */
export function deriveBaseUrl(pathname: string, room: string): string {
  const stripped = pathname
    .replace(/\/(view|edit|app)$/, '')
    .replace(new RegExp(`/${escapeRegex(room)}$`), '');
  return stripped === '' ? '/' : stripped;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Server-message dispatcher ───────────────────────────────────────────

/**
 * Build the server-message handler.  Factored out so `runMain` stays short
 * and the dispatcher itself is test-friendly.
 */
export function createDispatcher(host: MainHost): (msg: ServerMessage) => void {
  return function dispatch(msg: ServerMessage): void {
    const SocialCalc = host.SocialCalc;
    if (!SocialCalc.isConnected) return;
    const ss = host.spreadsheet;
    if (!ss) return;

    // Ignore echoes of our own actions on the current room (parity with
    // `player.ls:92`).
    const dataRoom = (msg as { room?: string }).room;
    const dataUser = (msg as { user?: string }).user;
    if (dataUser === SocialCalc._username && dataRoom === SocialCalc._room) return;
    // Legacy `data.to` private-channel test — sockets never reach here
    // unless targeted, but defensive parity.
    const dataTo = (msg as { to?: string }).to;
    if (dataTo && dataTo !== SocialCalc._username) return;

    // Cross-room `log` is dropped unless we have a formdata viewer open.
    if (
      dataRoom &&
      dataRoom !== SocialCalc._room &&
      ss.formDataViewer?._room !== dataRoom &&
      msg.type === 'log'
    ) {
      return;
    }

    let target = ss;
    if (dataRoom && dataRoom !== SocialCalc._room && msg.type !== 'recalc' && msg.type !== 'log') {
      if (ss.formDataViewer?._room !== dataRoom) return;
      target = ss.formDataViewer;
    }

    switch (msg.type) {
      case 'confirmemailsent':
        SocialCalc.EditorSheetStatusCallback?.(null, 'confirmemailsent', msg.message, target.editor);
        return;
      case 'chat':
        host.addmsg?.(msg.msg);
        return;
      case 'ecells':
        if (SocialCalc._app) return;
        applyEcells(SocialCalc, target, msg);
        return;
      case 'ecell':
        applyEcell(SocialCalc, target, msg);
        return;
      case 'log':
        applyLog(host, target, msg);
        return;
      case 'snapshot':
        applySnapshot(SocialCalc, target, msg);
        return;
      case 'recalc':
        applyRecalc(SocialCalc, target, msg);
        return;
      case 'execute':
        applyExecute(host, target, msg);
        return;
      case 'stopHuddle':
        applyStopHuddle();
        return;
      case 'my.ecell':
      case 'ignore':
        return;
    }
  };
}

function applyEcells(
  SocialCalc: SocialCalcGlobal,
  target: SpreadsheetLike,
  msg: EcellsServerMessage,
): void {
  const editor = target.editor;
  for (const [user, ecell] of Object.entries(msg.ecells)) {
    if (user === SocialCalc._username) continue;
    const peerClass = ` ${user} defaultPeer`;
    const find = new RegExp(peerClass, 'g');
    const cr = SocialCalc.coordToCr?.(ecell);
    if (!cr) continue;
    const cell = SocialCalc.GetEditorCellElement?.(editor, cr.row, cr.col);
    if (cell && cell.element.className.search(find) === -1) {
      cell.element.className += peerClass;
    }
  }
}

function applyEcell(
  SocialCalc: SocialCalcGlobal,
  target: SpreadsheetLike,
  msg: EcellServerMessage,
): void {
  const editor = target.editor;
  const peerClass = ` ${msg.user} defaultPeer`;
  const find = new RegExp(peerClass, 'g');
  if (msg.original) {
    const origCR = SocialCalc.coordToCr?.(msg.original);
    if (origCR) {
      const origCell = SocialCalc.GetEditorCellElement?.(editor, origCR.row, origCR.col);
      if (origCell) {
        origCell.element.className = origCell.element.className.replace(find, '');
      }
    }
    if (msg.original === editor.ecell.coord || msg.ecell === editor.ecell.coord) {
      SocialCalc.Callbacks.broadcast?.('ecell', {
        to: msg.user,
        ecell: editor.ecell.coord,
      });
    }
  }
  if (SocialCalc._app) return;
  const cr = SocialCalc.coordToCr?.(msg.ecell);
  if (!cr) return;
  const cell = SocialCalc.GetEditorCellElement?.(editor, cr.row, cr.col);
  if (cell && cell.element.className.search(find) === -1) {
    cell.element.className += peerClass;
  }
}

function applyLog(host: MainHost, target: SpreadsheetLike, msg: LogServerMessage): void {
  const SocialCalc = host.SocialCalc;
  const ss = host.spreadsheet!;
  if (ss.formDataViewer?._room === msg.room) {
    applyFormDataLog(ss, msg);
    return;
  }
  if (SocialCalc.hadSnapshot) return;
  SocialCalc.hadSnapshot = true;
  let parts;
  if (msg.snapshot) parts = target.DecodeSpreadsheetSave(msg.snapshot);
  if (parts) {
    if (parts.sheet) {
      target.sheet.ResetSheet();
      target.ParseSheetSave(msg.snapshot.substring(parts.sheet.start, parts.sheet.end));
    }
    if (parts.edit) {
      target.editor.SettingsCallbacks; // touch for type narrowing
      const loader = (SocialCalc.LoadEditorSettings ?? (() => {})) as (
        e: typeof target.editor,
        s: string,
        f: unknown,
      ) => void;
      loader(
        target.editor,
        msg.snapshot.substring(parts.edit.start, parts.edit.end),
        undefined,
      );
    }
  }
  host.addmsg?.(msg.chat.join('\n'), true);
  const cmdstr = msg.log
    .filter((line) => !/^re(calc|display)$/.test(line))
    .join('\n');
  if (cmdstr.length) {
    target.context.sheetobj.ScheduleSheetCommands(`${cmdstr}\nrecalc\n`, false, true);
  } else {
    target.context.sheetobj.ScheduleSheetCommands('recalc\n', false, true);
  }
}

function applyFormDataLog(ss: SpreadsheetLike, msg: LogServerMessage): void {
  let parts;
  if (msg.snapshot) parts = ss.DecodeSpreadsheetSave(msg.snapshot);
  const viewer = ss.formDataViewer!;
  viewer.sheet.ResetSheet();
  viewer.loaded = true;
  // Ask for log again to refresh — matches legacy behavior at player.ls:142.
  ss.editor; // no-op: touch for typing
  globalThisBroadcast('ask.log');
  if (parts?.sheet) {
    viewer.ParseSheetSave(msg.snapshot.substring(parts.sheet.start, parts.sheet.end));
    viewer.context.sheetobj.ScheduleSheetCommands('recalc\n', false, true);
  }
}

function globalThisBroadcast(type: string, data?: Record<string, unknown>): void {
  // Indirect hop through the global.  Lets `applyFormDataLog` re-enter the
  // broadcast surface without threading the adapter through.
  const w = globalThis as unknown as { SocialCalc?: SocialCalcGlobal };
  w.SocialCalc?.Callbacks.broadcast?.(type, data);
}

function applySnapshot(
  _SocialCalc: SocialCalcGlobal,
  target: SpreadsheetLike,
  msg: SnapshotServerMessage,
): void {
  const SocialCalc = _SocialCalc;
  SocialCalc.hadSnapshot = true;
  const parts = msg.snapshot ? target.DecodeSpreadsheetSave(msg.snapshot) : undefined;
  if (parts?.sheet) {
    target.sheet.ResetSheet();
    target.ParseSheetSave(msg.snapshot.substring(parts.sheet.start, parts.sheet.end));
    target.context.sheetobj.ScheduleSheetCommands('recalc\n', false, true);
  }
}

function applyRecalc(
  SocialCalc: SocialCalcGlobal,
  target: SpreadsheetLike,
  msg: RecalcServerMessage,
): void {
  if (msg.force) {
    const sheets = SocialCalc.Formula?.SheetCache?.sheets;
    if (sheets) delete sheets[msg.room];
    target.sheet.recalconce = true;
  }
  const parts = msg.snapshot ? target.DecodeSpreadsheetSave(msg.snapshot) : undefined;
  if (parts?.sheet) {
    const sheetdata = msg.snapshot.substring(parts.sheet.start, parts.sheet.end);
    SocialCalc.RecalcLoadedSheet?.(msg.room, sheetdata, true);
    const cache = SocialCalc.RecalcInfo.LoadSheetCache;
    if (cache && cache[msg.room] !== sheetdata) {
      cache[msg.room] = sheetdata;
      target.context.sheetobj.ScheduleSheetCommands('recalc\n', false, true);
    }
  } else {
    SocialCalc.RecalcLoadedSheet?.(msg.room, '', true);
  }
}

function applyExecute(
  host: MainHost,
  target: SpreadsheetLike,
  msg: ExecuteServerMessage,
): void {
  target.context.sheetobj.ScheduleSheetCommands(
    msg.cmdstr,
    /* saveundo */ false,
    /* isRemote */ true,
  );
  // If the user was on the graph tab, redraw shortly.  Legacy used a 100ms
  // debounce; we preserve.
  const ss = host.spreadsheet;
  const graphTab = ss?.tabnums?.['graph'];
  if (ss && graphTab !== undefined && (ss.currentTab as unknown) === graphTab) {
    host.setTimeout(() => host.DoGraph?.(false, false), 100);
  }
}

function applyStopHuddle(): void {
  // Legacy opens a confirm alert + navigates away.  Covered in `./boot.ts`
  // which is the browser-only entry point.  In-test, this is a no-op so
  // we can exercise the dispatcher end-to-end without redirecting.
}
