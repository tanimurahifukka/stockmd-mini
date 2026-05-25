#!/usr/bin/env bash
# verify.sh — deterministic gate for stockmd-mini.
# Orchestrates the scripts/verify/*.sh sub-checks. Fails fast on first non-zero.
set -euo pipefail

cd "$(dirname "$0")/.."

checks=(
  scripts/verify/00-env.sh
  scripts/verify/10-format.sh
  scripts/verify/20-typecheck.sh
  scripts/verify/30-unit.sh
  scripts/verify/40-crud-coverage.sh
  scripts/verify/50-module-boundaries.sh
  scripts/verify/60-task-queue.sh
  scripts/verify/70-api-smoke.sh
  scripts/verify/99-integrity.sh
)

printf "verify: project=%s\n" "stockmd-mini"

for check in "${checks[@]}"; do
  printf "\n--- %s ---\n" "$check"
  if [ ! -x "$check" ]; then
    chmod +x "$check" 2>/dev/null || true
  fi
  if ! bash "$check"; then
    printf "\nverify: FAILED at %s\n" "$check" >&2
    exit 1
  fi
done

printf "\nverify: all checks passed\n"
