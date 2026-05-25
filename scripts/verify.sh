#!/usr/bin/env bash
# verify.sh — deterministic gate for stockmd-mini.
# Orchestrates the scripts/verify/*.sh sub-checks. Fails fast on first non-zero.
#
# Env knobs:
#   VERIFY_SKIP    CSV of substring patterns; any check whose path matches
#                  any pattern is skipped. Useful when retrofitting onto an
#                  existing project. Examples:
#                    VERIFY_SKIP=10-format,20-typecheck,30-unit
#                    VERIFY_SKIP=70-api-smoke
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

skip_csv="${VERIFY_SKIP:-}"

should_skip() {
  local check="$1"
  [ -z "$skip_csv" ] && return 1
  local IFS=','
  local pat
  for pat in $skip_csv; do
    pat="${pat#"${pat%%[![:space:]]*}"}"
    pat="${pat%"${pat##*[![:space:]]}"}"
    [ -z "$pat" ] && continue
    case "$check" in
      *"$pat"*) return 0 ;;
    esac
  done
  return 1
}

printf "verify: project=%s\n" "stockmd-mini"
[ -n "$skip_csv" ] && printf "verify: VERIFY_SKIP=%s\n" "$skip_csv"

for check in "${checks[@]}"; do
  if should_skip "$check"; then
    printf "\n--- %s (skipped via VERIFY_SKIP) ---\n" "$check"
    continue
  fi
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
