import { encodeRoom } from '../lib/room-name.ts';
import { bulkMirrorRoomsToD1 } from '../lib/rooms-index.ts';

const MAX_ENTRY_BYTES = 120 * 1024;
const INDEX_BATCH_SIZE = 50;
const encoder = new TextEncoder();

export interface LegacyDiskMigrationEnv {
  readonly ROOM: DurableObjectNamespace;
  readonly LEGACY: Fetcher;
  readonly DB?: D1Database;
}

export interface LegacyRoom {
  readonly name: string;
  readonly snapshot: string;
  readonly log: readonly string[];
  readonly audit: readonly string[];
  readonly chat: readonly string[];
  readonly ecell: Readonly<Record<string, string>>;
  readonly updatedAt?: number;
}

export interface LegacyMigrationStats {
  readonly rooms: number;
  readonly droppedEntries: number;
}

type LegacyReadText = (path: string) => Promise<string | null>;

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

const KEY_PREFIXES = ['snapshot-', 'log-', 'audit-', 'chat-', 'ecell-'] as const;

export function roomsFromLegacyJsonBlob(text: string): LegacyRoom[] {
  const parsed = JSON.parse(text) as Record<string, unknown>;
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
    if (name.length === 0) continue;
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
  return Array.from(rooms.keys())
    .sort()
    .map((name) => {
      const accum = rooms.get(name) as RoomAccum;
      const ts = timestamps.get(`timestamp-${name}`) ?? timestamps.get(name);
      const updatedAt =
        ts !== undefined && Number.isFinite(Number(ts)) ? Number(ts) : undefined;
      return {
        name,
        snapshot: accum.snapshot,
        log: accum.log,
        audit: accum.audit,
        chat: accum.chat,
        ecell: accum.ecell,
        ...(updatedAt !== undefined ? { updatedAt } : {}),
      };
    });
}

export async function roomsFromLegacyDumpManifest(
  manifest: string,
  readText: LegacyReadText,
): Promise<LegacyRoom[]> {
  const files = new Map<string, { snapshot?: string; audit?: string }>();
  for (const entry of parseManifestEntries(manifest)) {
    const stem = entry.slice(0, -'.txt'.length);
    const dash = stem.indexOf('-');
    if (dash <= 0) continue;
    const kind = stem.slice(0, dash);
    const name = stem.slice(dash + 1);
    if (name.length === 0 || (kind !== 'snapshot' && kind !== 'audit')) continue;
    let f = files.get(name);
    if (f === undefined) {
      f = {};
      files.set(name, f);
    }
    f[kind] = `/dump/${entry}`;
  }

  const out: LegacyRoom[] = [];
  for (const name of Array.from(files.keys()).sort()) {
    const f = files.get(name) as { snapshot?: string; audit?: string };
    const snapshot = f.snapshot === undefined ? '' : (await readText(f.snapshot)) ?? '';
    let audit: string[] = [];
    if (f.audit !== undefined) {
      const raw = await readText(f.audit);
      if (raw !== null) {
        audit = raw
          .split('\n')
          .filter((s) => s.length > 0)
          .map(decodeLegacyAuditLine);
      }
    }
    out.push({
      name,
      snapshot,
      log: [],
      audit,
      chat: [],
      ecell: {},
    });
  }
  return out;
}

export async function migrateLegacyDisk(
  env: LegacyDiskMigrationEnv,
): Promise<LegacyMigrationStats> {
  const readText = (path: string): Promise<string | null> => readLegacyText(env.LEGACY, path);
  const dumpJson = await readText('/dump.json');
  const rooms =
    dumpJson !== null
      ? roomsFromLegacyJsonBlob(dumpJson)
      : await roomsFromLegacyDumpManifest(
          (await readText('/ethercalc-migrate-manifest.txt')) ?? '',
          readText,
        );

  const index: Array<{ readonly room: string; readonly updatedAt: number }> = [];
  let droppedEntries = 0;
  for (const room of rooms) {
    const seed = {
      snapshot: room.snapshot,
      log: filterOversized(room.log, () => {
        droppedEntries += 1;
      }),
      audit: filterOversized(room.audit, () => {
        droppedEntries += 1;
      }),
      chat: filterOversized(room.chat, () => {
        droppedEntries += 1;
      }),
      ecell: room.ecell,
      updatedAt: room.updatedAt ?? 0,
      skipIndex: true,
    };
    const res = await doFetch(env.ROOM, room.name, '/_do/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seed),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`seed ${room.name}: ${res.status} ${text}`);
    }
    index.push({ room: room.name, updatedAt: seed.updatedAt });
  }

  if (env.DB !== undefined) {
    for (let i = 0; i < index.length; i += INDEX_BATCH_SIZE) {
      await bulkMirrorRoomsToD1(env.DB, index.slice(i, i + INDEX_BATCH_SIZE));
    }
  }
  return { rooms: rooms.length, droppedEntries };
}

function parseManifestEntries(manifest: string): string[] {
  const out: string[] = [];
  for (const raw of manifest.split('\n')) {
    const entry = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (entry.length === 0 || entry.startsWith('.')) continue;
    if (!entry.endsWith('.txt')) continue;
    if (entry.includes('/') || entry.includes('\\') || entry.includes('\0')) continue;
    if (entry.includes('..')) continue;
    out.push(entry);
  }
  return out.sort();
}

function decodeLegacyAuditLine(line: string): string {
  return line
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\');
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

function filterOversized(
  entries: readonly string[],
  onDrop: () => void,
): string[] {
  const out: string[] = [];
  for (const entry of entries) {
    if (encoder.encode(entry).byteLength > MAX_ENTRY_BYTES) {
      onDrop();
      continue;
    }
    out.push(entry);
  }
  return out;
}

async function readLegacyText(fetcher: Fetcher, path: string): Promise<string | null> {
  const res = await fetcher.fetch(new Request(`http://legacy${path}`));
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`read legacy ${path}: ${res.status}`);
  }
  return res.text();
}

async function doFetch(
  namespace: DurableObjectNamespace,
  room: string,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const id = namespace.idFromName(encodeRoom(room));
  const stub = namespace.get(id);
  const url = `https://do.local${path}?name=${encodeURIComponent(room)}`;
  return stub.fetch(url, init);
}
