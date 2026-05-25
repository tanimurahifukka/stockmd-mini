#!/usr/bin/env bash
# Sandbox seed: load synthetic fixtures into the local database.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ -f supabase/seed.sql ]; then
  if command -v psql >/dev/null 2>&1; then
    echo "[seed] psql < supabase/seed.sql"
    PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
      -v ON_ERROR_STOP=1 -f supabase/seed.sql
  else
    echo "[seed] psql not installed — skipping seed"
  fi
else
  echo "[seed] no supabase/seed.sql — skipping"
fi

