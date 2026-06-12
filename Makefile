# Legacy LiveScript/webpack build removed in Phase 12 sweep.
# See CLAUDE.md §15 runbook and bin/ethercalc for local dev.

.PHONY: help dev test
help:
	@echo "Use: bun run --cwd packages/worker dev"
	@echo "     bun run test"

dev:
	bun run --cwd packages/worker dev

test:
	bun run test