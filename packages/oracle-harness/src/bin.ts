/* istanbul ignore file — tiny bun entry wrapper; exercised end-to-end by record/replay scripts. */

import { main } from './cli.ts';

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exit(2);
  },
);
