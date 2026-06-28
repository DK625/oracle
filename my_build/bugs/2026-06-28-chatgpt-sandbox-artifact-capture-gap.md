# Bug: ChatGPT sandbox artifact capture gap

## Date

2026-06-28

## Status

Fixed in local patch; needs live Windows bridge smoke validation.

## Context

In `case3_cloud_linux_to_local_windows`, ChatGPT Web can return a visible `sandbox:/mnt/data/*.zip` link while the Linux client still receives no ZIP. The bridge transfer protocol cannot begin until the Windows browser host first materializes that ChatGPT file into the Oracle session artifact directory and registers the descriptor.

## Root cause

The observed failure is upstream of Windows-to-cloud transfer: no browser-host file was saved, so no `artifact-ready` event was available for the bridge client to pull. The old capture path logged only broad button-fallback messages and did not record enough safe detail to distinguish direct sandbox fetch failure, missing DOM candidates, or a changed download control shape.

## Fix

- Broadened assistant-turn discovery in `src/browser/chatgptFiles.ts` to include sandbox anchors, ChatGPT file cards, anchors with `download`, buttons, role buttons, `data-testid`, `aria-label`, and title/icon controls.
- Added direct sandbox diagnostics with candidate counts, sanitized filename/source kind, strategy, HTTP status/statusText/content-type, final URL kind, body kind, and short redacted text snippets for JSON/HTML/text failures.
- Preserved in-page fetch for sandbox downloads when possible, then added a controlled browser-navigation/download fallback after configuring Chrome download behavior.
- Scoped fallback by expected filename/label where possible and kept generic download clicks as the last resort.
- Added an explicit warning when candidates exist but no local browser-host artifact is saved, because bridge `artifact-ready` cannot be emitted in that state.

## Safety

Diagnostics intentionally avoid raw URLs, query strings, cookies, tokens, signed URLs, and raw response bodies. Logs use URL-kind classifications and redacted short snippets only.

## Validation

- `python3 my_build/scripts/run_all_checks.py` passed.
- `pnpm vitest run tests/browser/chatgptFiles.test.ts tests/browser/artifacts.test.ts tests/remote/server.test.ts` passed.
- `pnpm run lint` passed.
- `pnpm run build` passed.
- `pnpm test` passed: 140 test files passed, 18 skipped; 1342 tests passed, 43 skipped.
- `pnpm run check` still fails before lint because unrelated pre-existing `my_build/*` Markdown files do not pass repository-wide `oxfmt --check .`; the files changed by this fix pass targeted `oxfmt --check`.

## Related files

- `src/browser/chatgptFiles.ts`
- `tests/browser/chatgptFiles.test.ts`
- `my_build/features/bridge-artifact-transfer.md`
- `my_build/debug/quick-debug.md`
- `my_build/notes/gotchas.md`
