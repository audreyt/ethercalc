/**
 * Filesystem-source adapter — streams rooms out of a legacy on-disk
 * EtherCalc dump written by `src/db.ls` when no Redis server was
 * reachable. This is the "first-load" path for self-hosters moving from
 * the legacy Node implementation to the new Worker, most notably the
 * Sandstorm grain (`sandstorm-pkgdef.capnp` sets `OPENSHIFT_DATA_DIR=/var`
 * and falls through to filesystem storage).
 *
 * Two layouts supported, mirroring what the legacy loader reads at
 * `src/db.ls:73-96`:
 *
 *   1. Directory form — `dump/` with per-key files:
 *        `snapshot-<room>.txt` — raw SocialCalc save string (UTF-8)
 *        `audit-<room>.txt`    — newline-joined with \\n/\\r/\\\\ escape
 *                                encoding (legacy encoder at db.ls:122-125)
 *      Log, chat, and ecell are NOT persisted to disk in this layout —
 *      legacy intentionally keeps them in-memory and drops them on restart.
 *      We yield rooms with empty log/chat/ecell to match.
 *
 *   2. Single-blob form — `dump.json`:
 *      A flat object whose keys match the legacy Redis key patterns
 *      (`snapshot-<room>`, `log-<room>`, `audit-<room>`, `chat-<room>`,
 *      `ecell-<room>`, plus a shared `timestamps` hash). This is the
 *      earliest filesystem layout — predates the `dump/` directory form
 *      and still exists in older self-hosted instances.
 *
 * Path resolution: if `path` is a file we assume single-blob; if it's a
 * directory we prefer `<path>/dump.json` → `<path>/dump/` → `<path>`
 * itself (treated as a dump directory). This lets Sandstorm callers
 * point `--source file:///var` at the grain root and have auto-detection
 * do the right thing whichever layout the previous legacy install used.
 *
 * Memory: O(1) per room in dir mode (one file read at a time) and O(N)
 * in JSON mode (full blob loaded — unavoidable because JSON isn't
 * streamable). Legacy `dump.json` instances are tiny (≤ a few MB); the
 * large dumps are always Redis-backed.
 */
import type { Room } from '../apply.ts';
import {
  filterOversized,
  type OversizedCallback,
} from './filter-oversized.ts';

/** Narrow filesystem surface — `node:fs/promises` satisfies it. */
export interface FsLike {
  readdir(path: string): Promise<string[]>;
  readFile(path: string, encoding: 'utf8'): Promise<string>;
  stat(path: string): Promise<FsStatLike>;
}

/** Minimal `Stats` shape — only the `isDirectory`/`isFile` predicates. */
export interface FsStatLike {
  isDirectory(): boolean;
  isFile(): boolean;
}

export interface RoomsFromFilesystemOptions {
  /** Invoked after each room is yielded. */
  onProgress?: (info: { readonly done: number; readonly total: number }) => void;
  /**
   * Max bytes per individual log/audit/chat entry. Default 120 KiB.
   * See {@link filterOversized} for the rationale.
   */
  maxEntryBytes?: number;
  /** Called when an entry is dropped for exceeding `maxEntryBytes`. */
  onOversizedEntry?: OversizedCallback;
  /**
   * Max bytes for a whole room's snapshot — rooms whose snapshot exceeds
   * this are skipped entirely (otherwise the DO would exist with logs
   * but no save, a confusing half-state). Default Infinity — the worker
   * chunks snapshots internally since 2026-04-22 (CLAUDE.md §14).
   */
  maxSnapshotBytes?: number;
  /** Called when a whole room is skipped for an oversized snapshot. */
  onSkippedRoom?: (info: {
    readonly room: string;
    readonly bytes: number;
  }) => void;
}

/**
 * Enumerate every EtherCalc room in the on-disk dump at `path` and
 * yield a fully-assembled {@link Room} for each. Auto-detects directory
 * vs single-blob layout per the module docstring.
 */
export async function* roomsFromFilesystem(
  fs: FsLike,
  path: string,
  options: RoomsFromFilesystemOptions = {},
): AsyncIterable<Room> {
  const layout = await detectLayout(fs, path);
  if (layout.kind === 'json') {
    yield* roomsFromJsonBlob(fs, layout.file, options);
    return;
  }
  yield* roomsFromDumpDir(fs, layout.dir, options);
}

type Layout =
  | { kind: 'json'; file: string }
  | { kind: 'dir'; dir: string };

async function detectLayout(fs: FsLike, path: string): Promise<Layout> {
  const st = await fs.stat(path);
  if (st.isFile()) return { kind: 'json', file: path };
  // Directory: prefer dump.json, then dump/, then treat path as the dump dir.
  const entries = await fs.readdir(path);
  if (entries.includes('dump.json')) {
    return { kind: 'json', file: joinPath(path, 'dump.json') };
  }
  if (entries.includes('dump')) {
    const sub = joinPath(path, 'dump');
    const subStat = await fs.stat(sub);
    if (subStat.isDirectory()) return { kind: 'dir', dir: sub };
  }
  return { kind: 'dir', dir: path };
}

// Minimal posix-style join — legacy dumps live on Linux/Unix, so this
// is consistent across caller platforms without pulling `node:path`.
function joinPath(a: string, b: string): string {
  if (a.endsWith('/')) return `${a}${b}`;
  return `${a}/${b}`;
}

// ───────────── single-blob (dump.json) ─────────────

const KEY_PREFIXES = ['snapshot-', 'log-', 'audit-', 'chat-', 'ecell-'] as const;

/** Intermediate accumulator for the JSON-blob mode. */
interface RoomAccum {
  snapshot: string;
  log: string[];
  audit: string[];
  chat: string[];
  ecell: Record<string, string>;
}

function emptyAccum(): RoomAccum {
  return { snapshot: '', log: [], audit: [], chat: [], ecell: {} };
}

async function* roomsFromJsonBlob(
  fs: FsLike,
  file: string,
  options: RoomsFromFilesystemOptions,
): AsyncIterable<Room> {
  const text = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(text) as Record<string, unknown>;

  // First pass — group keys by room. We walk the blob once and stash
  // typed shape per (room, kind); an unrecognized prefix is ignored,
  // matching legacy db.ls which simply doesn't touch keys it doesn't
  // know about.
  const rooms = new Map<string, RoomAccum>();
  const getRoom = (name: string): RoomAccum => {
    let r = rooms.get(name);
    if (r === undefined) {
      r = emptyAccum();
      rooms.set(name, r);
    }
    return r;
  };
  for (const [key, value] of Object.entries(parsed)) {
    const prefix = KEY_PREFIXES.find((p) => key.startsWith(p));
    if (prefix === undefined) continue;
    const name = key.slice(prefix.length);
    const r = getRoom(name);
    if (prefix === 'snapshot-' && typeof value === 'string') {
      r.snapshot = value;
    } else if (prefix === 'log-' && Array.isArray(value)) {
      r.log = value.map(String);
    } else if (prefix === 'audit-' && Array.isArray(value)) {
      r.audit = value.map(String);
    } else if (prefix === 'chat-' && Array.isArray(value)) {
      r.chat = value.map(String);
    } else if (prefix === 'ecell-' && isStringRecord(value)) {
      r.ecell = { ...value };
    }
  }

  const timestamps = parseTimestamps(parsed['timestamps']);
  const sorted = Array.from(rooms.keys()).sort();
  const total = sorted.length;
  const maxEntryBytes = options.maxEntryBytes ?? 120 * 1024;
  const maxSnapshotBytes = options.maxSnapshotBytes ?? Infinity;

  let done = 0;
  for (const name of sorted) {
    const accum = rooms.get(name) as RoomAccum;
    const snapshotBytes = Buffer.byteLength(accum.snapshot, 'utf8');
    if (snapshotBytes > maxSnapshotBytes) {
      options.onSkippedRoom?.({ room: name, bytes: snapshotBytes });
      done += 1;
      options.onProgress?.({ done, total });
      continue;
    }

    const ts =
      timestamps.get(`timestamp-${name}`) ?? timestamps.get(name);
    const updatedAt =
      ts !== undefined && Number.isFinite(Number(ts)) ? Number(ts) : undefined;

    yield {
      name,
      snapshot: accum.snapshot,
      log: filterOversized(accum.log, 'log', name, maxEntryBytes, options.onOversizedEntry),
      audit: filterOversized(accum.audit, 'audit', name, maxEntryBytes, options.onOversizedEntry),
      chat: filterOversized(accum.chat, 'chat', name, maxEntryBytes, options.onOversizedEntry),
      ecell: accum.ecell,
      ...(updatedAt !== undefined ? { updatedAt } : {}),
    };
    done += 1;
    options.onProgress?.({ done, total });
  }
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  for (const val of Object.values(v)) {
    if (typeof val !== 'string') return false;
  }
  return true;
}

function parseTimestamps(v: unknown): ReadonlyMap<string, number | string> {
  const out = new Map<string, number | string>();
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'number' || typeof val === 'string') out.set(k, val);
  }
  return out;
}

// ───────────── directory (dump/) ─────────────

/**
 * Reverse of the legacy encoder at db.ls:122-125:
 *   str = entry.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\\/g, '\\\\')
 *
 * Decoder order matters — legacy applies newline/CR first, backslash
 * last, so we reverse in the same order (newline first). Note: the
 * legacy encoder is asymmetric (encodes backslashes AFTER having added
 * escaped newlines, so a newline-containing entry round-trips with an
 * extra backslash). We preserve that quirk so migrated audit entries
 * byte-match what legacy EtherCalc would have displayed to the user.
 */
function decodeLegacyAuditLine(line: string): string {
  return line
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');
}

async function* roomsFromDumpDir(
  fs: FsLike,
  dir: string,
  options: RoomsFromFilesystemOptions,
): AsyncIterable<Room> {
  const entries = await fs.readdir(dir);

  // Map of room → what we've found on disk. A `.txt` suffix and a
  // `<kind>-<room>` stem is the format db.ls uses (see db.ls:74-89).
  // Hidden files (dotfiles) are skipped to match the legacy loader's
  // `filter (/^[^.]/.test _)`.
  const files = new Map<string, { snapshot?: string; audit?: string }>();
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    if (!entry.endsWith('.txt')) continue;
    const stem = entry.slice(0, -'.txt'.length);
    const dash = stem.indexOf('-');
    if (dash <= 0) continue;
    const kind = stem.slice(0, dash);
    const name = stem.slice(dash + 1);
    if (kind !== 'snapshot' && kind !== 'audit') continue;
    let f = files.get(name);
    if (f === undefined) {
      f = {};
      files.set(name, f);
    }
    f[kind] = joinPath(dir, entry);
  }

  const sorted = Array.from(files.keys()).sort();
  const total = sorted.length;
  const maxEntryBytes = options.maxEntryBytes ?? 120 * 1024;
  const maxSnapshotBytes = options.maxSnapshotBytes ?? Infinity;

  let done = 0;
  for (const name of sorted) {
    const f = files.get(name) as { snapshot?: string; audit?: string };
    const snapshot = f.snapshot !== undefined
      ? await fs.readFile(f.snapshot, 'utf8')
      : '';
    const snapshotBytes = Buffer.byteLength(snapshot, 'utf8');
    if (snapshotBytes > maxSnapshotBytes) {
      options.onSkippedRoom?.({ room: name, bytes: snapshotBytes });
      done += 1;
      options.onProgress?.({ done, total });
      continue;
    }

    let audit: string[] = [];
    if (f.audit !== undefined) {
      const raw = await fs.readFile(f.audit, 'utf8');
      audit = raw.split('\n').filter((s) => s.length > 0).map(decodeLegacyAuditLine);
    }

    yield {
      name,
      snapshot,
      // log/chat/ecell are never persisted to disk in dir mode — legacy
      // db.ls keeps them in-memory only, so a restart drops them. We
      // match by yielding empty.
      log: [],
      audit: filterOversized(audit, 'audit', name, maxEntryBytes, options.onOversizedEntry),
      chat: [],
      ecell: {},
      // updatedAt omitted — legacy initializes timestamps[id]=0 on
      // first load from disk (db.ls:80). The apply layer defaults to 0
      // when undefined.
    };
    done += 1;
    options.onProgress?.({ done, total });
  }
}
