#!/usr/bin/env bash
# 50-module-boundaries: enforce src/modules/<A> -> src/modules/<B> only via
# index.ts. Use dependency-cruiser when present, fall back to grep heuristic.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -d src/modules ]; then
  echo "  no src/modules — skipping"
  exit 0
fi

if command -v npx >/dev/null 2>&1 && [ -f dependency-cruiser.config.js ]; then
  if npx --no-install depcruise --version >/dev/null 2>&1; then
    npx --no-install depcruise --config dependency-cruiser.config.js src || {
      echo "  FAIL: module boundary violation reported by dependency-cruiser" >&2
      exit 1
    }
    echo "  50-module-boundaries: ok (depcruise)"
    exit 0
  fi
fi

# grep fallback
violations=0
modules=$(find src/modules -mindepth 1 -maxdepth 1 -type d | sed 's|.*/||' || true)
for mod in $modules; do
  while IFS= read -r line; do
    case "$line" in
      *"src/modules/$mod/"*) continue ;;
      *"src/modules/"*"/index"*) continue ;;
      *) echo "  FAIL: $line" >&2; violations=$((violations + 1)) ;;
    esac
  done < <(grep -RInE "from ['\"](.*src/modules/[^/]+/[^'\"]+)" "src/modules/$mod" 2>/dev/null || true)
done

# lib must not import from modules
while IFS= read -r line; do
  echo "  FAIL (lib->modules): $line" >&2
  violations=$((violations + 1))
done < <(grep -RInE "from ['\"](.*src/modules/[^'\"]+)" src/lib 2>/dev/null || true)

if [ "$violations" -ne 0 ]; then
  echo "  FAIL: $violations module-boundary violation(s)" >&2
  exit 1
fi

echo "  50-module-boundaries: ok (grep fallback)"
