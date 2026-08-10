# Production upgrade docs

**Entry point:** [`PROD_UPGRADE_PLAN.md`](./PROD_UPGRADE_PLAN.md) — the authoritative operator runbook.

The other four files here are supporting evidence. Read them only when the runbook points you there, or when you need the underlying audit.

**During an incident:** open the runbook’s **Critical-path quick reference** (one-screen map near the front) first — not the full ~2,300-line document.

**Baseline caveat:** exact production revision is still `[OPERATOR-VERIFY]` pending `wrangler deployments list`; this plan is scoped to the candidate range `[d2afa90, b7d8840)`.

## Companion documents

- **`DELTA_AUDIT.md`** — prod→`main` delta with per-item classification and irreversibility analysis. Read before approving the cutover shape.
- **`SKEW_AND_RECONNECT.md`** — what breaks for a browser tab already open across the cutover. Read when planning operator comms or soak checks.
- **`PREFLIGHT_RESULTS.md`** — recorded results of this runbook's §1 gates against the final tree. Read to confirm preflight already passed (or what failed).
- **`INVENTORY.md`** — verbatim mechanical inventory of wrangler config, workflows, D1 migrations, and self-host env. Read when a command or binding needs a ground-truth dump.
