#!/usr/bin/env bash
# =============================================================================
# pre-commit guard: refuse to commit any .env file.
# Receives candidate staged paths (matched by the hook's `files:` regex) as
# args. Allows ONLY ".env.example" (the committed template); fails on the rest.
# =============================================================================
set -euo pipefail

blocked=()
for path in "$@"; do
  base="$(basename "$path")"
  if [[ "$base" == ".env.example" ]]; then
    continue
  fi
  blocked+=("$path")
done

if [[ ${#blocked[@]} -gt 0 ]]; then
  echo "ERROR: refusing to commit env/secret file(s):" >&2
  for p in "${blocked[@]}"; do
    echo "  - $p" >&2
  done
  echo "Use .env.example for placeholders; keep real secrets out of git." >&2
  exit 1
fi
