#!/usr/bin/env bash
set -euo pipefail

# Fail on filenames with uppercase letters or spaces.
# Allowed chars: a-z 0-9 . _ - and /

violations=()
while IFS= read -r path; do
  # skip empty
  [[ -z "$path" ]] && continue
  # allowlist for conventional uppercase files
  case "$path" in
    CHANGELOG.md|VERSION|CNAME|_headers|.github/CODEOWNERS|.github/ISSUE_TEMPLATE/*|.github/pull_request_template.md) continue;;
  esac
  # check for uppercase
  if grep -q '[A-Z]' <<<"$path"; then
    violations+=("Uppercase: $path")
    continue
  fi
  # check for spaces
  if grep -q '[[:space:]]' <<<"$path"; then
    violations+=("Spaces: $path")
    continue
  fi
done < <(git ls-files)

if ((${#violations[@]})); then
  printf 'Filename policy violations (%d):\n' "${#violations[@]}" >&2
  printf '%s\n' "${violations[@]}" >&2
  exit 1
fi
echo "Filename policy: OK"
