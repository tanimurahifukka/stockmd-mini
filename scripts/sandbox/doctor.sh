#!/usr/bin/env bash
# Sandbox doctor: diagnose the host before up.sh tries to start services.
# Exit codes follow the sandbox table in docs/sandbox-policy. 0 on success.
set -euo pipefail

cd "$(dirname "$0")/../.."

ok()   { printf "  [ok]   %s\n" "$1"; }
warn() { printf "  [warn] %s\n" "$1"; }
fail() { printf "  [fail] %s\n" "$1" >&2; }

failed=0

echo "== docker =="
if ! command -v docker >/dev/null 2>&1; then
  fail "docker CLI not found in PATH"
  failed=10
else
  ok "docker CLI present ($(docker --version 2>/dev/null | head -1))"
  if ! docker info >/dev/null 2>&1; then
    fail "docker daemon is not responding"
    case "$(uname -s)" in
      Darwin) echo "         On macOS: open Docker Desktop or run: open -a Docker" ;;
      Linux)  echo "         On Linux: sudo systemctl start docker" ;;
    esac
    failed=10
  else
    ok "docker daemon responds"
  fi
fi

if ! docker compose version >/dev/null 2>&1; then
  warn "docker compose plugin not detected — most scripts will fail"
fi

echo "== ports =="
required_ports=(3000 54321 54322 54323)

# Owners of ports that belong to *our* compose project don't count as conflicts.
our_compose_pids=""
if command -v docker >/dev/null 2>&1; then
  our_compose_pids=$(docker compose ps --status running -q 2>/dev/null \
    | xargs -I{} docker inspect -f '`}}' {} 2>/dev/null \
    | tr '\n' ' ' || true)
fi

is_our_pid() {
  case " $our_compose_pids " in
    *" $1 "*) return 0 ;;
    *) return 1 ;;
  esac
}

for port in "${required_ports[@]:-}"; do
  if command -v lsof >/dev/null 2>&1; then
    pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -1 || true)
    if [ -n "$pid" ]; then
      if is_our_pid "$pid"; then
        ok "port $port is held by our compose project (pid $pid)"
      else
        proc=$(ps -p "$pid" -o comm= 2>/dev/null || echo unknown)
        fail "port $port is in use by pid $pid ($proc)"
        failed=20
      fi
    else
      ok "port $port is free"
    fi
  elif command -v ss >/dev/null 2>&1; then
    if ss -lnt "( sport = :$port )" 2>/dev/null | grep -q LISTEN; then
      fail "port $port is in use"
      failed=20
    else
      ok "port $port is free"
    fi
  else
    warn "neither lsof nor ss available — skipping port check for $port"
  fi
done

echo "== env files =="
if [ -f .env.example ]; then
  ok ".env.example present"
else
  warn ".env.example is missing — bootstrap should have generated it"
fi
if [ -f .env ]; then
  if [ -f .gitignore ] && grep -q '^\.env$' .gitignore; then
    ok ".env present and gitignored"
  else
    warn ".env present but not listed in .gitignore"
  fi
else
  ok ".env not present (will be created from .env.example by up.sh)"
fi

echo "== disk =="
if command -v df >/dev/null 2>&1; then
  free=$(df -k . | awk 'NR==2 {print int($4/1024/1024)}')
  if [ "${free:-0}" -lt 20 ]; then
    warn "less than 20 GiB free on $(pwd) ($free GiB)"
  else
    ok "${free} GiB free on $(pwd)"
  fi
fi

echo "== supabase cli =="
if command -v supabase >/dev/null 2>&1; then
  ok "supabase CLI present ($(supabase --version 2>/dev/null | head -1))"
else
  warn "supabase CLI not found (install: brew install supabase/tap/supabase)"
fi
echo "== node / pnpm =="
if command -v node >/dev/null 2>&1; then
  ok "node $(node --version)"
fi
if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm $(pnpm --version)"
elif command -v npm >/dev/null 2>&1; then
  warn "pnpm not found; falling back to npm $(npm --version)"
fi

if [ "$failed" -ne 0 ]; then
  echo
  echo "doctor: FAILED (exit $failed)"
  exit "$failed"
fi

echo
echo "doctor: ok"
