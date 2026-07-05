/**
 * Help text for `bin/ethercalc`.
 *
 * Kept separate from `parse.ts` so a test can snapshot it without importing
 * argv-parsing side effects. Format mirrors the legacy README "Runtime
 * Flags" section (see README.md) so long-time users recognize the layout.
 */
export const HELP_TEXT: string = [
  'ethercalc — multi-user spreadsheet server',
  '',
  'USAGE',
  '  ethercalc [OPTIONS]',
  '',
  'OPTIONS',
  '  --key <secret>       HMAC secret for read-write auth (§6.4).',
  '                       Sets ETHERCALC_KEY for the Worker.',
  '  --cors               Legacy compatibility flag: hide room-index routes.',
  '                       Sets ETHERCALC_CORS=1; CORS headers stay permissive.',
  '  --port <n>           Listening port (default 8000).',
  '                       Passed as `wrangler dev --port <n>`.',
  '  --host <addr>        Listening address (default 0.0.0.0).',
  '                       Passed as `wrangler dev --ip <addr>`.',
  '  --expire <sec>       Seconds of inactivity before a room is pruned.',
  '                       Sets ETHERCALC_EXPIRE=<sec>.',
  '  --basepath <prefix>  URL prefix when running behind a reverse proxy.',
  '                       Sets BASEPATH=<prefix> and ETHERCALC_BASEPATH=<prefix>.',
  '  --keyfile <path>     TLS private key (DEFERRED — wrangler dev does not',
  '                       currently expose TLS; use a reverse proxy).',
  '  --certfile <path>    TLS certificate (DEFERRED — see --keyfile).',
  '  --persist-to <dir>   Persist Miniflare D1/KV/R2/DO state to <dir>.',
  '                       Default: .wrangler/state (wrangler default).',
  '  -h, --help           Print this help and exit.',
  '',
  'See AGENTS.md §8 Phase 11 and §13 Q6 for the design rationale.',
].join('\n');
