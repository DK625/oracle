# Local Windows bridge rollout handoff

## Audience

Codex or an engineer working on the local Windows machine that owns the ChatGPT browser bridge.

## Goal

Pull the latest Oracle source on the Windows bridge machine, rebuild from the local checkout, verify the global `oracle` command resolves to that checkout, restart the bridge host, and prove the cloud Linux client can see the expected bridge capabilities.

This runbook is intentionally local-Windows specific. It assumes the signed-in ChatGPT browser profile stays on Windows and Linux clients reach it through the reverse SSH tunnel.

## Secret handling

Do not write bridge tokens, cookies, signed download URLs, raw logs, generated files, or session runtime directories into `my_build`.

Use an environment variable or an operator-provided secure source for the deployment token:

```powershell
$env:ORACLE_BRIDGE_TOKEN = "<set-from-secure-source>"
```

The examples below reference `$env:ORACLE_BRIDGE_TOKEN` rather than embedding the token.

## Preflight

From PowerShell:

```powershell
Set-Location -LiteralPath 'D:\pp\oracle'
git status --short --branch
git remote -v
git log -1 --oneline
```

If local changes are not clearly related to the current rollout, stop and ask before pulling. Known local memory/doc edits can be preserved through the pull:

```powershell
git stash push -m "pre-rollout local notes" -- docs/windows-work.md my_build/notes/gotchas.md
```

Leave unrelated untracked scratch files alone unless they would conflict with files coming from upstream.

## Pull the update

```powershell
git fetch origin
git log --oneline HEAD..origin/main
git diff --name-only HEAD..origin/main
git pull --ff-only origin main
git log -1 --oneline
```

If you stashed local notes, reapply them after the fast-forward pull:

```powershell
git stash pop
```

Resolve any conflict in favor of keeping durable, non-secret rollout lessons.

## Install and build

`corepack enable` can fail from non-admin PowerShell with `EPERM` when writing shims under `C:\Program Files\nodejs`. If `pnpm` is already available and suitable, continue with it:

```powershell
pnpm --version
pnpm install --frozen-lockfile
pnpm run build
```

The install may run `prepare` and build once; still run `pnpm run build` explicitly so the rollout has a standalone build result.

## Targeted validation

Run the bridge/artifact/server tests that cover the Windows host surface:

```powershell
pnpm vitest run tests/browser/chatgptFiles.test.ts tests/browser/artifacts.test.ts tests/remote/server.test.ts
```

For the bridge-concurrency update, `tests/remote/server.test.ts` can expose a platform/request-scheduling order assumption where the first three concurrent runs start as `run-2, run-1, run-3` instead of `run-1, run-2, run-3`. Treat that as a test-order caveat only if the failure is limited to that ordering assertion and `/health.runAdmission` later reports the expected limits. Do not ignore broader failures.

Validate durable memory after editing anything under `my_build`:

```powershell
py -3 my_build/scripts/run_all_checks.py
```

On this Windows machine, `python3` may resolve to the Microsoft Store alias; `py -3` or `python` is the working Python 3 launcher.

## Verify the global `oracle` command uses this checkout

```powershell
where.exe oracle
npm list -g --depth=0 @steipete/oracle
oracle --version
```

Expected global package shape:

```text
@steipete/oracle@<version> -> .\D:\pp\oracle
```

If it is not linked to `D:\pp\oracle`, run this from the repo:

```powershell
npm link
where.exe oracle
oracle --version
```

`oracle --version` alone is not proof because multiple source revisions can report the same package version.

## Restart the Windows bridge host

Prefer closing the old foreground bridge PowerShell window. If you need to inspect without printing secrets, identify the listener and bridge-related process tree:

```powershell
Get-NetTCPConnection -LocalPort 9473 -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,OwningProcess

Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -and ($_.CommandLine -match 'bridge\s+host|openclaw') } |
  ForEach-Object {
    [PSCustomObject]@{
      ProcessId = $_.ProcessId
      Name = $_.Name
      ParentProcessId = $_.ParentProcessId
      ExecutablePath = $_.ExecutablePath
    }
  }
```

Then start a fresh foreground host from `D:\pp\oracle`:

```powershell
oracle bridge host `
  --bind 127.0.0.1:9473 `
  --token $env:ORACLE_BRIDGE_TOKEN `
  --ssh openclaw `
  --ssh-remote-port 9473 `
  --ssh-extra-args "-o ExitOnForwardFailure=yes" `
  --foreground `
  --print `
  --max-concurrent-runs 3 `
  --max-queued-runs 3
```

Use the same SSH identity/options as the existing local bridge setup if they differ.

Keep this PowerShell open. The readiness lines to look for are:

- `[bridge host] ssh tunnel started ...`
- `Reverse SSH tunnel active (remote 127.0.0.1:9473 -> local 127.0.0.1:9473)`
- `Listening at 127.0.0.1:9473 ...`

If the host opens a manual-login Chrome profile and reports no ChatGPT cookies, complete the login in that Chrome window before running live browser smokes.

## Local health verification

From another local PowerShell:

```powershell
$headers = @{ Authorization = "Bearer $env:ORACLE_BRIDGE_TOKEN" }
Invoke-RestMethod -Uri 'http://127.0.0.1:9473/health' -Headers $headers -TimeoutSec 10 |
  ConvertTo-Json -Depth 8
```

Expected for the bridge artifact + concurrency host:

```json
{
  "ok": true,
  "capabilities": {
    "artifactTransfer": true,
    "artifactProtocolVersion": 1,
    "maxActiveRemoteRuns": 3,
    "maxQueuedRemoteRuns": 3
  },
  "runAdmission": {
    "maxActiveRuns": 3,
    "maxQueuedRuns": 3,
    "activeRuns": 0,
    "queuedRuns": 0
  }
}
```

If `/health` only shows artifact capabilities and no `runAdmission`, the Windows host is still running old code or was not rebuilt/restarted.

## Cloud verification

On the cloud Linux client, verify the host advertises run admission:

```bash
curl -s -H "Authorization: Bearer $ORACLE_BRIDGE_TOKEN" \
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

## Smoke test

After verification, start several cloud browser jobs with unique slugs. The first three should acquire browser slots; a fourth simultaneous run should queue instead of immediately failing with `ERROR: busy`. Artifact downloads should still transfer to the cloud session artifacts path.

For artifact smoke validation, the final cloud-side session should show a Linux-local artifacts path with `validation=ok` and `transfer=completed`; a visible `sandbox:/mnt/data/...` link alone is not sufficient.

## Rollout report checklist

Report these items back to the operator:

- `git log -1 --oneline`
- `pnpm run build` result
- targeted Vitest result, including any exact caveat
- `where.exe oracle`
- `npm list -g --depth=0 @steipete/oracle`
- bridge readiness lines for tunnel and listen
- `/health` capability summary, especially `artifactTransfer` and `runAdmission`

## Related files

- `my_build/features/bridge-concurrent-runs.md`
- `my_build/features/bridge-artifact-transfer.md`
- `my_build/notes/gotchas.md`
- `docs/bridge.md`
- `src/remote/server.ts`
- `tests/remote/server.test.ts`
