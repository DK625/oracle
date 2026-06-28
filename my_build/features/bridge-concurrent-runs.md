# Feature: Bridge concurrent browser runs

## Status

Implemented in fork; ready for targeted bridge/server validation.

## Business goal

Let cloud Linux clients use the same parallel ChatGPT tab capacity that direct local Windows Oracle runs already have.

## User value

Multiple agent/browser jobs can share one Windows ChatGPT bridge host without the second request immediately failing with `ERROR: busy`.

## Current behavior

- The bridge host uses bounded run admission instead of a global single-flight boolean.
- Defaults: 3 active remote runs and 3 queued remote runs.
- The fourth simultaneous run queues by default and starts FIFO when an active slot is released.
- If active + queued capacity is exhausted, the host returns backward-compatible `409 {"error":"busy"}` with extra non-secret admission metadata.
- The bridge admission layer protects HTTP streams, request state, and host resources; `tabLeaseRegistry` remains the browser/profile authority for actual ChatGPT tab leases.
- Each active run has isolated `runId`, temp attachment directories, response writer, artifact descriptors, cleanup, and slot release.
- Queued client disconnects are removed from the queue. Running client disconnects stop stream writes and release the slot after browser cleanup finishes.
- Artifact GET endpoints bypass run admission and remain bearer-token protected.

## Configuration

- `oracle bridge host --max-concurrent-runs <n>`
- `oracle bridge host --max-queued-runs <n>`
- `oracle serve --max-concurrent-runs <n>`
- `oracle serve --max-queued-runs <n>`
- `ORACLE_REMOTE_MAX_ACTIVE_RUNS`
- `ORACLE_REMOTE_MAX_QUEUED_RUNS`

Set queued runs to `0` to keep immediate busy behavior after all active slots are occupied.

## Implementation map

- Admission/server: `src/remote/server.ts`
- Protocol/health types: `src/remote/types.ts`, `src/remote/health.ts`
- CLI flags: `bin/oracle-cli.ts`, `src/cli/bridge/host.ts`
- Diagnostics: `src/cli/bridge/doctor.ts`
- Tests: `tests/remote/server.test.ts`
- Docs: `docs/bridge.md`, `CHANGELOG.md`

## Security and isolation rules

- Do not expose Windows host paths, bridge tokens, cookies, signed ChatGPT URLs, or raw artifact URLs in queue metadata, health output, descriptors, logs, docs, or test fixtures.
- Keep artifact transfer pull-based and token-protected.
- Do not let artifact GET requests consume run slots; otherwise queued browser jobs could block artifact transfer for completed runs.

## Tests

Targeted tests cover:

- Three active concurrent runs.
- Fourth run queued and FIFO-started.
- Queue-full `409 busy` fallback.
- Queued disconnect cleanup.
- Running disconnect slot release after cleanup.
- Artifact endpoint bypass and run-id/artifact-id isolation.

## Last updated

2026-06-28
