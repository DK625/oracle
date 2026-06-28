#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = REPO_ROOT / "my_build" / "scripts"
CHECKS = ["validate_structure.py", "validate_manifest.py", "validate_links.py"]


def main() -> None:
    for script in CHECKS:
        result = subprocess.run([sys.executable, str(SCRIPTS / script)], cwd=REPO_ROOT)
        if result.returncode != 0:
            print(f"run_all_checks: FAIL at {script}")
            raise SystemExit(result.returncode)
    print("run_all_checks: PASS")


if __name__ == "__main__":
    main()
