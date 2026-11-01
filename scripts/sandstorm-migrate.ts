import * as fs from 'node:fs/promises';

import { main } from '../packages/migrate/src/cli.ts';
import { RespClient } from '../packages/migrate/src/resp-client.ts';

const argv = process.argv.slice(2);
const token = process.env.ETHERCALC_MIGRATE_TOKEN;
if (token && !argv.includes('--token')) {
  argv.push('--token', token);
}

process.exitCode = await main(argv, {
  connectRedis: (url) => RespClient.connect(url),
  fs,
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
});
