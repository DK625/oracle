#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path
from common import MY_BUILD, REPO_ROOT, iter_markdown_files

LINK_RE = re.compile(r"(?<!!\[)[\[]([^\]]+)\]\(([^)]+)\)")


def strip_code_fences(text: str) -> str:
    lines = []
    in_fence = False
    for line in text.splitlines():
        if line.strip().startswith('```'):
            in_fence = not in_fence
            continue
        if not in_fence:
            lines.append(line)
    return "\n".join(lines)


def main() -> None:
    failures: list[str] = []
    for md in iter_markdown_files():
        text = strip_code_fences(md.read_text(encoding="utf-8"))
        for match in LINK_RE.finditer(text):
            target = match.group(2).strip()
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target_no_anchor = target.split('#', 1)[0]
            if not target_no_anchor:
                continue
            resolved = (md.parent / target_no_anchor).resolve()
            try:
                resolved.relative_to(REPO_ROOT.resolve())
            except ValueError:
                failures.append(f"{md.relative_to(REPO_ROOT)} -> outside repo: {target}")
                continue
            if not resolved.exists():
                failures.append(f"{md.relative_to(REPO_ROOT)} -> missing: {target}")
    if failures:
        print("validate_links: FAIL")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print("validate_links: PASS")


if __name__ == "__main__":
    main()
