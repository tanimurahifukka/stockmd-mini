# Permissions — stockmd-mini

What the agent is allowed to do without asking. Adjust to match the host
machine and the operator's tolerance. The harness ships with a conservative
default.

## Allowed without asking

- Read any file in this repository (except those matching `.env`, `secrets/`,
  `**/*.key`).
- Edit any file under `src/`, `tests/`, `docs/`, `supabase/`, except those
  listed in `.agent/protected-files.json`.
- Run any script under `scripts/` whose path is in the "allowed scripts"
  list below.
- Run `bash scripts/sandbox/up.sh`, `down.sh`, `status.sh`, `healthcheck.sh`,
  `doctor.sh`, `migrate.sh`, `seed.sh`.
- Run `bash scripts/verify.sh` and any sub-script under `scripts/verify/`.
- Run `python3 scripts/evolution/*.py`.
- Run package-manager commands consistent with the stack: `pnpm install`,
  `pnpm test`, `pnpm typecheck`, etc.

## Requires asking

- `bash scripts/sandbox/reset.sh --yes` (medium gate).
- `git push` (medium gate — pushes to the remote).
- Adding a dependency to `package.json` (medium gate).
- Anything in `docs/human-gates.md`.

## Forbidden

- Network calls outside the local sandbox.
- Modifying anything in `.git/` other than via `git` commands.
- Installing system packages (`brew`, `apt`, `npm install -g`, `pip install --user`).

## Allowed scripts

```
scripts/sandbox/doctor.sh
scripts/sandbox/up.sh
scripts/sandbox/down.sh
scripts/sandbox/status.sh
scripts/sandbox/healthcheck.sh
scripts/sandbox/logs.sh
scripts/sandbox/migrate.sh
scripts/sandbox/seed.sh
scripts/verify.sh
scripts/verify/*.sh
scripts/evolution/*.py
```
