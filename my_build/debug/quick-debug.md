# Quick Debug

## First 5 checks

1. Run `oracle bridge doctor` on the Linux client.
2. Confirm both Windows and Linux source revisions match.
3. Confirm exactly one Windows bridge host and one SSH reverse tunnel own port 9473.
4. Inspect the latest session artifact metadata, not only the assistant link.
5. Run targeted bridge/browser tests before changing protocol code.

## Common failure patterns
- `Artifact transfer: manual fallback`: host is old or the wrong bridge process owns the port.
- ZIP link exists but Linux file is absent: inspect `artifact-ready` handling and authenticated endpoint fetch.
- `.part-*` remains: transfer was interrupted or validation failed.
- SHA/ZIP mismatch: do not use the artifact; preserve text and follow manual fallback.

## Commands

```bash
oracle bridge doctor
oracle session <session-id> --render
python3 my_build/scripts/validate_structure.py
python3 my_build/scripts/validate_manifest.py
python3 my_build/scripts/validate_links.py
python3 my_build/scripts/run_all_checks.py
```

## Escalation notes
For a live smoke, ask ChatGPT Web to create a small ZIP and verify the Linux session shows `validation=ok`, `transfer=completed`, a SHA-256 value, and a readable ZIP.
