#!/usr/bin/env bash
# Typecheck, lint, then Vitest (or part of it), printing only failures and a summary line.
#   check.sh                          typecheck, lint, the whole suite
#   check.sh tsc                      typecheck only
#   check.sh tests/notes.test.ts      any `vitest run` arguments narrow the tests (lint is skipped)
# Always exits 0: the summary carries the verdict, and a skill invocation must not abort on failures.
set -u
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 0
[ -d node_modules ] || { echo "node_modules missing: run npm ci first"; exit 0; }

out=$(npx tsc -b 2>&1); rc=$?
if [ $rc -eq 0 ]; then echo "typecheck: ok"; else
  echo "typecheck: $(printf '%s\n' "$out" | grep -c 'error TS') error(s)"
  printf '%s\n' "$out" | grep 'error TS' | head -30
fi
[ "${1:-}" = "tsc" ] && exit 0

if [ $# -eq 0 ]; then
  out=$(npx eslint . 2>&1); rc=$?
  if [ $rc -eq 0 ]; then echo "lint: ok"; else
    echo "lint: failed"; printf '%s\n' "$out" | grep -v '^$' | head -40
  fi
fi

out=$(npx vitest run "$@" 2>&1); rc=$?
summary=$(printf '%s\n' "$out" | grep -E '^\s*(Test Files|Tests)\s' | sed 's/^ *//' | tr '\n' ' ')
if [ $rc -ne 0 ]; then
  printf '%s\n' "$out" | grep -E 'FAIL|AssertionError|Error:|expected|❯' | head -40
fi
echo "tests: ${summary:-vitest exited $rc without a summary}"
exit 0
