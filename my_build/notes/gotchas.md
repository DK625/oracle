# Gotchas

## Bridge version gotcha

Both Windows host and Linux client must run the patched source. Version `0.15.0` alone is not proof because the patch retains that package version; use source revision plus `oracle bridge doctor` capability output.

## Token and tunnel gotcha

Use the configured fixed bridge token and `127.0.0.1`. Do not use `--token auto` in the shared case3 deployment, and do not start duplicate bridge hosts or reverse tunnels on port 9473.

## Artifact result gotcha

A visible `sandbox:/mnt/data/...` link proves only that ChatGPT created a file. Success requires a Linux-local session path with `validation=ok` and `transfer=completed`.

## Source-link gotcha

`oracle --version` still reports `0.15.0`. Verify `npm list -g --depth=0 @steipete/oracle` and the resolved command path to confirm `npm link` points at the intended source checkout.

## Windows corepack gotcha

`corepack enable` can fail from non-admin PowerShell because it writes shims under `C:\Program Files\nodejs`. If `pnpm --version` is already available and suitable for the repo, continue with the frozen install/build instead of blocking the rollout.

## Security gotcha

Never store bridge tokens, PATs, cookies, signed download URLs, raw logs, generated ZIPs, or session runtime directories in `my_build`.

## Sandbox capture gotcha

A ChatGPT `sandbox:/mnt/data/...` link is only a candidate. Oracle must save the file on the Windows browser host first; only then can the bridge host register a descriptor and emit `artifact-ready`. When candidates exist but no file is saved, use the sanitized `chatgptFiles.ts` diagnostics instead of assuming a bridge transfer bug.

## Bridge concurrency gotcha

The bridge admission limit is not a replacement for `tabLeaseRegistry`. Keep the bridge active limit at or below the shared browser tab limit unless intentionally testing queueing; otherwise accepted remote runs can still wait inside the browser layer for a tab lease.

## Bridge concurrency test gotcha

The first three admitted remote runs are intentionally concurrent; their `runBrowser` start order can differ by platform/request scheduling. A validation failure that only swaps `run-1` and `run-2` in `tests/remote/server.test.ts` is an order-assumption issue; verify the active set, FIFO queue behavior, and `/health.runAdmission` before diagnosing bridge runtime admission.
