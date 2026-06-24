/**
 * Sandstorm-only one-shot migration Worker.
 *
 * This is bundled to `workerd/worker/migrate.js` by `.sandstorm/build.sh`
 * and used only by `config-migrate.capnp`. Keeping it separate from the
 * normal Worker entrypoint avoids adding Sandstorm's LEGACY disk binding to
 * the public app runtime or to the normal route table.
 */
/* istanbul ignore file */
import { buildHealthBody } from './handlers/health.ts';
import {
  migrateLegacyDisk,
  type LegacyDiskMigrationEnv,
} from './handlers/legacy-disk-migrate.ts';
import { verifyMigrateToken } from './lib/migrate-auth.ts';

export { RoomDO } from './room.ts';

interface SandstormLegacyMigrationEnv extends LegacyDiskMigrationEnv {
  readonly ETHERCALC_MIGRATE_TOKEN?: string;
}

const TEXT_CT = 'text/plain; charset=utf-8';

export default {
  async fetch(
    request: Request,
    env: SandstormLegacyMigrationEnv,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/_health') {
      return Response.json(buildHealthBody());
    }
    if (request.method !== 'POST' || url.pathname !== '/_migrate/from-legacy-disk') {
      return text('Not Found', 404);
    }

    const verdict = verifyMigrateToken(
      env.ETHERCALC_MIGRATE_TOKEN,
      request.headers.get('Authorization'),
    );
    if (verdict.kind === 'disabled') return text('Not Found', 404);
    if (verdict.kind === 'missing' || verdict.kind === 'bad') {
      return text('Unauthorized', 401);
    }

    try {
      const stats = await migrateLegacyDisk(env);
      return text(
        `migrated ${stats.rooms} rooms; dropped ${stats.droppedEntries} oversized entries`,
        201,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return text(`legacy migration failed: ${msg}`, 500);
    }
  },
};

function text(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': TEXT_CT },
  });
}

