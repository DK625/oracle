# Feature: Secure bridge artifact transfer

## Status

Implemented in fork; upstream review in progress at https://github.com/steipete/oracle/pull/277

## Business goal

Automatically return ChatGPT-generated files from a Windows browser host to a cloud Linux Oracle client.

## User value

GPT Web fix flows can receive a validated cloud-readable ZIP path without manual Windows download and upload.

## Current behavior

- Host advertises artifact protocol v1 through `/health`.
- Current-run ChatGPT files are saved and validated on the host before any bridge transfer begins.
- ChatGPT sandbox/file candidates are discovered from answer text plus latest assistant-turn anchors, file cards, and download controls.
- Sandbox links first use in-page credentialed fetch when possible; failed candidates then use scoped browser download fallback after Chrome download behavior is configured.
- Host emits redacted descriptors and serves bytes through a bearer-token-protected endpoint.
- Client writes a partial file, verifies size/SHA-256/ZIP structure, atomically publishes it, and records client-local metadata.
- Mixed versions retain text output and show manual fallback guidance.

## Implementation map

- Browser artifacts: `src/browser/artifacts.ts`, `src/browser/chatgptFiles.ts`
- Protocol: `src/remote/types.ts`, `src/remote/health.ts`, `src/remote/server.ts`, `src/remote/client.ts`
- CLI/session: `src/cli/bridge/client.ts`, `src/cli/bridge/doctor.ts`, `src/cli/sessionDisplay.ts`, `src/sessionManager.ts`
- Tests: `tests/browser/artifacts.test.ts`, `tests/browser/chatgptImages.test.ts`, `tests/remote/server.test.ts`
- Docs: `docs/bridge.md`, `docs/browser-mode.md`, `CHANGELOG.md`

## Edge cases

- Old host/client combinations must remain text-compatible.
- `.crdownload`, empty files, invalid ZIPs, size mismatches, and SHA mismatches are never published as completed.
- Unsafe or duplicate filenames are sanitized and collision-safe.
- Host paths, cookies, tokens, and signed download URLs must not appear in descriptors/results.

## Tests

- Format, lint/typecheck, and build passed.
- Targeted suite passed: 43 tests.
- Full suite passed: 1,340 tests; 43 skipped.
- Live Windows-to-Linux smoke passed with a generated ZIP, matching SHA-256, `validation=ok`, and `transfer=completed`.

## Debug notes

Run `oracle bridge doctor`. `manual fallback` means the connected host does not advertise the patched capability; `bridge v1` means transfer is available.

If a visible `sandbox:/mnt/data/*.zip` appears but no Linux artifact path is returned, inspect browser-host logs from `src/browser/chatgptFiles.ts`: candidate counts, sanitized filename/source kind, direct download strategy, HTTP status/content type/final URL kind/body kind, fallback control count/details, and the explicit warning that no local browser-host artifact was saved. Absence of `artifact-ready` usually means capture failed before the bridge transfer contract began.

## Related decisions

- `my_build/decisions/ADR-0002-bridge-artifact-transfer-protocol.md`

## Last updated

2026-06-28
