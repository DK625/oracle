# Agent Rules

Before working on this repository, read:

1. `my_build/INDEX.md`
2. then only the files routed by `my_build/INDEX.md` for the current task.

Do not scan the entire repository by default.

After any durable change, update the relevant `my_build` file:

- new feature -> `my_build/features/`
- bug fix -> `my_build/bugs/`
- architecture decision -> `my_build/decisions/`
- debug lesson -> `my_build/debug/` or `my_build/notes/gotchas.md`
- API/event/db contract change -> `my_build/specs/`

Run from the Oracle repository root:

```bash
python3 my_build/scripts/run_all_checks.py
```

Do not commit scratch files, raw logs, temporary dumps, or large media into `my_build`.
