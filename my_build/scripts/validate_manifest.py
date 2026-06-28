#!/usr/bin/env python3
from __future__ import annotations

from common import REPO_ROOT, load_manifest


def _check_path(rel: str, failures: list[str], must_be_dir: bool = False) -> None:
    p = REPO_ROOT / rel
    if must_be_dir:
        if not p.is_dir():
            failures.append(f"missing directory route: {rel}")
    else:
        if not p.exists():
            failures.append(f"missing path: {rel}")


def main() -> None:
    failures: list[str] = []
    manifest = load_manifest()
    entrypoints = manifest.get("entrypoints", {})
    if not isinstance(entrypoints, dict):
        failures.append("entrypoints must be a mapping")
    else:
        for name, rel in entrypoints.items():
            if not isinstance(rel, str):
                failures.append(f"entrypoint {name} must be a string")
            else:
                _check_path(rel, failures)
    active = manifest.get("active_files", {})
    if not isinstance(active, dict):
        failures.append("active_files must be a mapping")
    else:
        for group, paths in active.items():
            if not isinstance(paths, list):
                failures.append(f"active_files.{group} must be a list")
                continue
            for rel in paths:
                if not isinstance(rel, str):
                    failures.append(f"active_files.{group} contains non-string path")
                else:
                    _check_path(rel, failures)
    routes = manifest.get("task_routes", {})
    if not isinstance(routes, dict):
        failures.append("task_routes must be a mapping")
    else:
        for route, paths in routes.items():
            if not isinstance(paths, list):
                failures.append(f"task_routes.{route} must be a list")
                continue
            for rel in paths:
                if not isinstance(rel, str):
                    failures.append(f"task_routes.{route} contains non-string path")
                else:
                    _check_path(rel, failures, must_be_dir=rel.endswith('/'))
    validation = manifest.get("validation", {})
    if not isinstance(validation, dict):
        failures.append("validation must be a mapping")
    elif not isinstance(validation.get("max_index_lines"), int):
        failures.append("validation.max_index_lines must be an integer")
    if failures:
        print("validate_manifest: FAIL")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print("validate_manifest: PASS")


if __name__ == "__main__":
    main()
