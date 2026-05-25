#!/usr/bin/env bash
# Sandbox migrate: apply schema migrations to the local database.
set -euo pipefail

cd "$(dirname "$0")/../.."

if command -v supabase >/dev/null 2>&1; then
  if [ -d supabase/migrations ] && [ -n "$(ls -A supabase/migrations 2>/dev/null)" ]; then
    echo "[migrate] supabase migration up"
    supabase migration up
  else
    echo "[migrate] no migrations under supabase/migrations — skipping"
  fi
else
  echo "[migrate] supabase CLI not installed — skipping"
fi

