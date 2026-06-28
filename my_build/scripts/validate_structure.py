#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from common import MY_BUILD, REPO_ROOT

REQUIRED_DIRS = [
    "my_build/product", "my_build/architecture", "my_build/features", "my_build/bugs",
    "my_build/debug", "my_build/decisions", "my_build/notes", "my_build/specs",
    "my_build/handoffs", "my_build/scripts", "my_build/validation/reports", "my_build/archive",
]

REQUIRED_FILES = [
    "README.md", "AGENTS.md", ".gitignore",
    "my_build/INDEX.md", "my_build/manifest.yml",
    "my_build/product/vision.md", "my_build/product/roadmap.md", "my_build/product/user-flows.md", "my_build/product/glossary.md",
    "my_build/architecture/overview.md", "my_build/architecture/data-flow.md", "my_build/architecture/service-map.md",
    "my_build/architecture/database.md", "my_build/architecture/integrations.md",
    "my_build/features/_template.md", "my_build/features/example-feature.md",
    "my_build/bugs/_template.md", "my_build/bugs/example-bug.md",
    "my_build/debug/quick-debug.md", "my_build/debug/logs.md", "my_build/debug/database.md", "my_build/debug/services.md", "my_build/debug/local-env.md",
    "my_build/decisions/_template.md", "my_build/decisions/ADR-0001-example-decision.md",
    "my_build/notes/reusable-patterns.md", "my_build/notes/gotchas.md", "my_build/notes/lessons-learned.md",
    "my_build/specs/api-contracts.md", "my_build/specs/event-contracts.md", "my_build/specs/db-schema.md",
    "my_build/handoffs/agent-context.md", "my_build/handoffs/human-context.md", "my_build/handoffs/release-handoff.md",
    "my_build/scripts/common.py", "my_build/scripts/update_index.py", "my_build/scripts/validate_structure.py",
    "my_build/scripts/validate_links.py", "my_build/scripts/validate_manifest.py", "my_build/scripts/record_change.py", "my_build/scripts/run_all_checks.py",
    "my_build/validation/reports/.gitkeep", "my_build/archive/README.md",
]


def main() -> None:
    failures = []
    for rel in REQUIRED_DIRS:
        if not (REPO_ROOT / rel).is_dir():
            failures.append(f"missing directory: {rel}")
    for rel in REQUIRED_FILES:
        path = REPO_ROOT / rel
        if not path.exists():
            failures.append(f"missing file: {rel}")
        elif path.is_file() and path.stat().st_size == 0 and rel != "my_build/validation/reports/.gitkeep":
            failures.append(f"empty core file: {rel}")
    for path in MY_BUILD.rglob("tmp_*"):
        failures.append(f"temporary file forbidden: {path.relative_to(REPO_ROOT)}")
    for path in MY_BUILD.rglob("*"):
        if path.suffix in {".tmp", ".bak"}:
            failures.append(f"temporary/backup file forbidden: {path.relative_to(REPO_ROOT)}")
    if failures:
        print("validate_structure: FAIL")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print("validate_structure: PASS")


if __name__ == "__main__":
    main()
