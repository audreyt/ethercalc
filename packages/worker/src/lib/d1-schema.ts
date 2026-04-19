const ROOMS_TABLE_SQL =
  'CREATE TABLE IF NOT EXISTS rooms ' +
  '(room TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, cors_public INTEGER NOT NULL DEFAULT 0)';
const ROOMS_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS rooms_updated_at ON rooms(updated_at DESC)';
const CRON_TABLE_SQL =
  'CREATE TABLE IF NOT EXISTS cron_triggers ' +
  '(room TEXT NOT NULL, cell TEXT NOT NULL, fire_at INTEGER NOT NULL, ' +
  'PRIMARY KEY (room, cell, fire_at))';
const CRON_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS cron_triggers_fire_at ON cron_triggers(fire_at)';

function isMissingTableError(err: unknown, table: string): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes(`no such table: ${table}`);
}

async function ensureSchema(
  db: D1Database,
  statements: readonly string[],
): Promise<void> {
  for (const sql of statements) {
    await db.exec(sql);
  }
}

async function withSchemaRetry<T>(
  db: D1Database,
  table: string,
  statements: readonly string[],
  op: () => Promise<T>,
): Promise<T> {
  try {
    return await op();
  } catch (err) {
    if (!isMissingTableError(err, table)) throw err;
    await ensureSchema(db, statements);
    return await op();
  }
}

export async function withRoomsSchema<T>(
  db: D1Database,
  op: () => Promise<T>,
): Promise<T> {
  return withSchemaRetry(db, 'rooms', [ROOMS_TABLE_SQL, ROOMS_INDEX_SQL], op);
}

export async function withCronSchema<T>(
  db: D1Database,
  op: () => Promise<T>,
): Promise<T> {
  return withSchemaRetry(
    db,
    'cron_triggers',
    [CRON_TABLE_SQL, CRON_INDEX_SQL],
    op,
  );
}
