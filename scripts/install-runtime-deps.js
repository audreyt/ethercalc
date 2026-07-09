#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
if (existsSync(path.join(packageRoot, '.git'))) process.exit(0);

const env = { ...process.env };
delete env.CI;
const result = spawnSync('bun', ['install', '--production', '--ignore-scripts'], {
  cwd: packageRoot,
  env,
  stdio: 'inherit',
});

if (result.error?.code === 'ENOENT') {
  console.warn(
    "ethercalc: Bun is required to run EtherCalc; install Bun, then run 'bun install --production --ignore-scripts' in the package root.",
  );
  process.exit(0);
}

if (result.error) {
  console.error(`ethercalc: failed to install runtime dependencies: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
