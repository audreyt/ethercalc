-- Phase 9 — cron_triggers table.
--
-- Legacy behavior (src/main.ls:184-217 + src/sc.ls:220-244): a Redis hash
-- named `cron-list` mapped `<room>!<cell>` to a comma-separated list of
-- epoch-minute timestamps. An external cron pinged `GET /_timetrigger`
-- every minute to fire due entries and prune them from the list.
--
-- In the Worker world we replace both sides:
--   - Storage: this `cron_triggers` table (one row per fire_at).
--   - Pulse:   Cloudflare Cron Trigger (`*/1 * * * *`) invokes the
--              Worker's `scheduled()` handler directly. The legacy
--              `GET /_timetrigger` endpoint stays wired as a backwards-
--              compat surface for self-host users whose external cron
--              still pings it (§6.1 Q3 Phase 9 brief).
--
-- `fire_at` is epoch MINUTES (`Math.floor(Date.now()/60000)`) to keep
-- byte-equivalent semantics with the legacy `timeList` values. A row
-- is "due" when `fire_at <= now_minutes`.
--
-- PRIMARY KEY (room, cell, fire_at) lets a single cell carry multiple
-- future triggers — matches the legacy comma-list. Dedup is the
-- caller's responsibility (the `settimetrigger` handler does
-- `INSERT OR IGNORE`).
--
-- The secondary index on `fire_at` keeps the scheduled scan cheap even
-- as the table grows: the cron handler reads `WHERE fire_at <= ?` and
-- deletes the fired rows, so hot access is always by that column.
CREATE TABLE cron_triggers (
  room     TEXT NOT NULL,
  cell     TEXT NOT NULL,
  fire_at  INTEGER NOT NULL,  -- epoch minutes (matches legacy `timeList` semantics)
  PRIMARY KEY (room, cell, fire_at)
);
CREATE INDEX cron_triggers_fire_at ON cron_triggers(fire_at);
