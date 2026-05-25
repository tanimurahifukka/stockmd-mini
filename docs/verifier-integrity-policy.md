# Verifier Integrity Policy — stockmd-mini

The verifier is the one thing the agent cannot bend. This file is the
project-local copy of the rule.

## Protected files

Listed in `.agent/protected-files.json`. Includes:

- `scripts/verify.sh` and every `scripts/verify/*.sh`.
- `docs/risk-policy.md`, `docs/verifier-integrity-policy.md`,
  `docs/human-gates.md`.
- `.agent/protected-files.json` itself.
- All files under `.agent/schemas/`.

## Forbidden patterns

- `exit 0` inserted near the top of a verifier sub-script.
- Replacing tests with `xfail` / `skip` / `// TODO`.
- `git commit --no-verify` from inside the agent loop.
- Deleting a verifier sub-script to shorten `verify.sh`.
- Adding files to `.gitignore` to hide them from `99-integrity.sh`.

## If the verifier is wrong

Pause the task. Add to `QUESTIONS.md`:

```
- [ ] verifier check `<file>` reports X but I believe Y. Should the spec or
  the check change?
```

Wait for the human. Do not "fix" the verifier inside the same task.
