#!/usr/bin/env python3
from __future__ import annotations

from common import MY_BUILD, load_manifest, fail

START = "<!-- ACTIVE_FILES_START -->"
END = "<!-- ACTIVE_FILES_END -->"


def main() -> None:
    manifest = load_manifest()
    index_path = MY_BUILD / "INDEX.md"
    if not index_path.exists():
        fail(f"INDEX missing: {index_path}")
    text = index_path.read_text(encoding="utf-8")
    if START not in text or END not in text:
        fail("update_index: FAIL markers missing")
    active = manifest.get("active_files", {})
    if not isinstance(active, dict):
        fail("update_index: FAIL active_files must be a mapping")
    lines = [START]
    for group, paths in active.items():
        lines.append(f"### {group}")
        if not isinstance(paths, list):
            fail(f"update_index: FAIL active_files.{group} must be a list")
        for p in paths:
            lines.append(f"- `{p}`")
        lines.append("")
    if lines[-1] == "":
        lines.pop()
    lines.append(END)
    before, rest = text.split(START, 1)
    _, after = rest.split(END, 1)
    index_path.write_text(before + "\n".join(lines) + after, encoding="utf-8")
    print("update_index: OK")


if __name__ == "__main__":
    main()
