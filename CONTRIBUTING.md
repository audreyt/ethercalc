# Contributing to EtherCalc

## Development setup

```bash
git clone https://github.com/audreyt/ethercalc
cd ethercalc
bun install
bun run --cwd packages/worker dev    # http://127.0.0.1:8787
```

See [AGENTS.md](./AGENTS.md) for agent context, [packages/docs/](packages/docs/) for the Starlight docs site (`bun run --cwd packages/docs dev`), and [docs/historic/REWRITE_ULTRAPLAN.md](./docs/historic/REWRITE_ULTRAPLAN.md) for the archived rewrite plan.

## Tests and coverage

```bash
bun run test                         # all workspace packages
bun run --cwd packages/worker test:coverage   # 100% gate on handlers/lib/room
```

Gated packages enforce **100% line/branch/function/statement** coverage in CI. PRs that drop a metric fail.

## Issue triage runbook

Open issues are labeled `triage:*` after a full pass. Re-run triage when socialcalc or worker behavior changes.

### 1. Record open issues

```bash
gh issue list --state open --limit 500 --json number,title \
  > /tmp/open-issues.txt
```

### 2. Headless probes (no server)

```bash
bun scripts/triage-open-issues.ts
```

This exercises `packages/socialcalc-headless` for formula/export regressions and classifies known-fixed items.

### 3. HTTP probes (local worker)

```bash
bun run --cwd packages/worker dev   # separate terminal
bun scripts/triage-open-issues.ts --http http://127.0.0.1:8787
```

Adds route/export checks (`/_/:room/csv`, formdata siblings, room index gates).

### 4. Apply labels

```bash
bun scripts/apply-triage-labels.ts   # reads triage output, applies triage:* via gh
```

Label meanings:

| Label | Meaning |
| ----- | ------- |
| `triage:broken` | Reproducible bug, needs code fix |
| `triage:ui` | SocialCalc UI / client behavior |
| `triage:enhancement` | Feature request |
| `triage:question` | Answered in docs/FAQ; close with link |
| `triage:ci` | CI/infra only |

### 5. Close verified fixes

```bash
bun scripts/close-socialcalc-3.0.4-issues.ts   # example batch closer
```

Comment with evidence (probe output, commit SHA, docs link) before closing.

## Sandstorm packaging

Sandstorm packaging lives on `main`: `SANDSTORM.md`, `run_grain.sh`, `sandstorm-pkgdef.capnp`. Build and sign with `spk pack` locally — see **Who publishes the `.spk`?** in `SANDSTORM.md` (app-owner keyring, not CI).

## Pull requests

1. One logical change per PR when possible.
2. Add or update tests; keep coverage at 100% on gated paths.
3. Run `bun run typecheck` and affected package tests locally.
4. Update [AGENTS.md](./AGENTS.md) session log if the change is architectural.