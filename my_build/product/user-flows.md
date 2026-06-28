# User Flows

## Primary flows
- Start a task by reading `my_build/INDEX.md`.
- Add a feature record with `record_change.py`.
- Add a bug record after debugging.
- Add an ADR after an architecture decision.

## Edge flows
- If context is stale, move it to archive and update manifest.
- If links break, run validation and fix them.

## Admin/operator flows
- Run `make check` before commit.
- Run `make update-index` after editing active files in manifest.

## Unknowns
- Project-specific docs to fill after copying the template.
