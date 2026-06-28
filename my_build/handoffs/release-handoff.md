# Release Handoff

## Before release
- Confirm upstream PR #277 review/CI status.
- Run format, lint/typecheck, targeted tests, full unit tests, and build.
- Run a Windows-host to Linux-client generated ZIP smoke test.
- Confirm session metadata shows Linux-local path, matching SHA-256, `validation=ok`, and `transfer=completed`.
- Confirm no secret or Windows host path appears in the result.

## Commands

```bash
pnpm run format:check
pnpm run lint
pnpm run build
pnpm test
python3 my_build/scripts/run_all_checks.py
```

## Notes
Until upstream merges/releases the feature, both bridge endpoints must use the same fork source revision. After release, remove source links and install the released `@steipete/oracle` version on both endpoints.
