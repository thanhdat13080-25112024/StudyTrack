"""Dump the FastAPI OpenAPI schema to a file without running a server.
Usage: python scripts/dump_openapi.py [out_path]   (default: openapi.json)"""

from __future__ import annotations

import json
import sys

from app.main import app


def main() -> None:
    out = sys.argv[1] if len(sys.argv) > 1 else "openapi.json"
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(app.openapi(), fh, ensure_ascii=False, indent=2)
    print(f">> wrote {out}")


if __name__ == "__main__":
    main()
