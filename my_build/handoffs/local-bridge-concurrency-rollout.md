# Local bridge concurrency rollout handoff

## Audience

Codex or an engineer working on the local Windows machine that owns the ChatGPT browser bridge.

## Goal

Pull the bridge concurrency update, rebuild Oracle locally, restart the Windows bridge host, and verify the cloud Linux client sees the new run-admission contract.

## Required local steps

1. Stop any currently running `oracle bridge host` PowerShell window.
2. Pull the updated fork branch that contains the bridge concurrent-runs change.
3. From the local Oracle repo checkout, run:

```powershell
pnpm install
pnpm run build
```

4. Restart the Windows bridge host:

```powershell
oracle bridge host `
  --bind 127.0.0.1:9473 `
  --token f667af3845a136e7a1d6573a1d0ecff2 `
  --ssh openclaw `
  --ssh-remote-port 9473 `
  --ssh-extra-args "-o ExitOnForwardFailure=yes" `
  --foreground `
  --print `
  --max-concurrent-runs 3 `
  --max-queued-runs 3
```

Use the same SSH identity/options as the existing local bridge setup if they differ.

## Cloud verification

On the cloud Linux client, verify the host advertises run admission:

```bash
curl -s -H "Authorization: Bearer f667af3845a136e7a1d6573a1d0ecff2" \
  http://127.0.0.1:9473/health

oracle bridge doctor
```

Expected `/health` includes:

```json
"runAdmission": {
  "maxActiveRuns": 3,
  "maxQueuedRuns": 3,
  "activeRuns": 0,
  "queuedRuns": 0
}
```

If `/health` only shows artifact capabilities and no `runAdmission`, the Windows host is still running old code or was not rebuilt/restarted.

## Smoke test

After verification, start several cloud browser jobs with unique slugs. The first three should acquire browser slots; a fourth simultaneous run should queue instead of immediately failing with `ERROR: busy`. Artifact downloads should still transfer to the cloud session artifacts path.

## Related files

- `my_build/features/bridge-concurrent-runs.md`
- `docs/bridge.md`
- `src/remote/server.ts`
- `tests/remote/server.test.ts`
