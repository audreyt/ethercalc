#!/usr/bin/env bun
/* istanbul ignore file -- Bun/Sandstorm process entrypoint; cli.ts carries the tested logic. */
import fs from 'node:fs/promises';

import { main as migrateMain } from './cli.ts';
import { RespClient } from './resp-client.ts';

const code = await migrateMain(process.argv.slice(2), {
  connectRedis: (url) => RespClient.connect(url),
  fs,
  stdout: (s) => process.stdout.write(s),
  stderr: (s) => process.stderr.write(s),
});

process.exit(code);
