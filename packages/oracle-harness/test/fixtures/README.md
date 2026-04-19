# Oracle-harness binary fixtures

Tiny xlsx/ods test archives exercised by `matchers.xlsx.test.ts` and
`matchers.ods.test.ts`.

These are **generated** at test setup from literal byte arrays in the
sibling `zip-fixtures.ts` module — the `.xlsx` / `.ods` files in this
directory are the materialized output, persisted so reviewers can
unzip and inspect them from the CLI (`unzip test/fixtures/xlsx/basic.xlsx`).

If a generator function changes, delete the corresponding file here and
re-run `bun run test` — it gets regenerated on the next test-setup pass.

## Naming

- `basic.xlsx` / `basic.ods` — minimal single-sheet archive with
  known cell values. Used as the "expected" side in most equality tests.
- `docprops-only-diff.{xlsx,ods}` — identical content but different
  volatile metadata (timestamps / authorship). Should compare equal.
- `cell-value-diff.{xlsx,ods}` — one cell value changed. Should
  compare NOT equal, with the path of the differing entry in the diff.
- `corrupted.{xlsx,ods}` — random bytes (not a valid zip). Should
  compare NOT equal with a parse-error diff.

All fixtures are committed so the test suite is hermetic.
