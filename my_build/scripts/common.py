#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MY_BUILD = REPO_ROOT / "my_build"


def fail(message: str, code: int = 1) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(code)


def parse_scalar(value: str):
    value = value.strip()
    if value == "":
        return ""
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    lowered = value.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if lowered in {"null", "none"}:
        return None
    if re.fullmatch(r"-?\d+", value):
        try:
            return int(value)
        except ValueError:
            return value
    return value


def _strip_comment(line: str) -> str:
    # Good enough for this manifest: comments are whole-line comments.
    return line.rstrip("\n")


def _fallback_parse_yaml(text: str):
    raw_lines = [_strip_comment(line) for line in text.splitlines()]
    lines = []
    for line in raw_lines:
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        lines.append(line.rstrip())

    def indent_of(s: str) -> int:
        return len(s) - len(s.lstrip(' '))

    def parse_block(i: int, indent: int):
        container = None
        while i < len(lines):
            line = lines[i]
            cur_indent = indent_of(line)
            if cur_indent < indent:
                break
            if cur_indent > indent:
                fail(f"manifest parse error near indented line: {line}")
            stripped = line.strip()
            if stripped.startswith('- '):
                if container is None:
                    container = []
                if not isinstance(container, list):
                    fail(f"manifest parse error: mixed list/dict near {line}")
                container.append(parse_scalar(stripped[2:]))
                i += 1
                continue
            if ':' not in stripped:
                fail(f"manifest parse error: expected key: value near {line}")
            if container is None:
                container = {}
            if not isinstance(container, dict):
                fail(f"manifest parse error: mixed list/dict near {line}")
            key, value = stripped.split(':', 1)
            key = key.strip()
            value = value.strip()
            if value:
                container[key] = parse_scalar(value)
                i += 1
            else:
                # Find child block if any.
                if i + 1 >= len(lines) or indent_of(lines[i + 1]) <= cur_indent:
                    container[key] = {}
                    i += 1
                else:
                    child, i = parse_block(i + 1, indent_of(lines[i + 1]))
                    container[key] = child
        if container is None:
            container = {}
        return container, i

    data, idx = parse_block(0, 0)
    if idx != len(lines):
        fail("manifest parse error: unparsed trailing lines")
    return data


def load_manifest() -> dict:
    path = MY_BUILD / "manifest.yml"
    if not path.exists():
        fail(f"manifest missing: {path}")
    text = path.read_text(encoding="utf-8")
    try:
        import yaml  # type: ignore
        data = yaml.safe_load(text)
    except ModuleNotFoundError:
        data = _fallback_parse_yaml(text)
    except Exception as exc:
        fail(f"manifest parse error: {exc}")
    if not isinstance(data, dict):
        fail("manifest parse error: root must be a mapping")
    return data


def repo_path(rel: str) -> Path:
    return REPO_ROOT / rel


def iter_markdown_files():
    return sorted(MY_BUILD.rglob("*.md"))
