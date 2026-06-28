#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path
from common import MY_BUILD, fail


def slugify(title: str) -> str:
    text = title.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "untitled"


def next_adr_number() -> int:
    max_num = 0
    for path in (MY_BUILD / "decisions").glob("ADR-*.md"):
        m = re.match(r"ADR-(\d+)-", path.name)
        if m:
            max_num = max(max_num, int(m.group(1)))
    return max_num + 1


def render_from_template(template_path: Path, title: str) -> str:
    if template_path.exists():
        text = template_path.read_text(encoding="utf-8")
    else:
        text = f"# {title}\n\n## Notes\n"
    today = date.today().isoformat()
    text = text.replace("<name>", title)
    text = text.replace("<decision title>", title)
    text = text.replace("YYYY-MM-DD", today)
    return text


def unique_write(path: Path, content: str) -> None:
    if path.exists():
        fail(f"record_change: FAIL file already exists: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"created: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a my_build knowledge record from a template.")
    parser.add_argument("--type", choices=["feature", "bug", "decision", "note"], required=True)
    parser.add_argument("--title", required=True)
    args = parser.parse_args()
    today = date.today().isoformat()
    slug = slugify(args.title)
    if args.type == "feature":
        path = MY_BUILD / "features" / f"{slug}.md"
        content = render_from_template(MY_BUILD / "features" / "_template.md", args.title)
    elif args.type == "bug":
        path = MY_BUILD / "bugs" / f"{today}-{slug}.md"
        content = render_from_template(MY_BUILD / "bugs" / "_template.md", args.title)
        content = content.replace("## Date\n", f"## Date\n{today}\n")
    elif args.type == "decision":
        num = next_adr_number()
        path = MY_BUILD / "decisions" / f"ADR-{num:04d}-{slug}.md"
        content = render_from_template(MY_BUILD / "decisions" / "_template.md", args.title)
        content = content.replace("ADR-0000", f"ADR-{num:04d}")
    else:
        path = MY_BUILD / "notes" / f"{today}-{slug}.md"
        tmpl = MY_BUILD / "notes" / "_template.md"
        if tmpl.exists():
            content = render_from_template(tmpl, args.title)
        else:
            content = f"# Note: {args.title}\n\n## Date\n{today}\n\n## Context\n\n## Durable lesson\n\n## Reuse trigger\n\n## Related files\n"
    unique_write(path, content)


if __name__ == "__main__":
    main()
