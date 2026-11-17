#!/usr/bin/env bash
# Repo map for Claude: one line per module (path, line count, first sentence of its header comment).
# With a path fragment argument it lists the full header and exports of each match.
#   map.sh                    compact map of src/, api/, scripts/ and tests/ (stories and generated data excluded)
#   map.sh src/components/ui  detailed map of everything whose path contains the fragment
set -u
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 0
filter=${1:-}

git ls-files src api scripts tests | grep -E '\.(tsx?|mjs)$' | grep -vE '\.stories\.tsx$|src/data/(lqip|resumeQr|notes-index)\.ts$' \
  | { if [ -n "$filter" ]; then grep -F -- "$filter"; else cat; fi; } | sort | while read -r f; do
  lines=$(wc -l < "$f" | tr -d ' ')
  header=$(awk '
    NR == 1 && $0 ~ /^#!/ { next }
    !mode { if ($0 ~ /^\/\//) mode = "line"; else if ($0 ~ /^\/\*/) mode = "block"; else exit }
    mode == "line" { if ($0 !~ /^\/\//) exit; line = $0; sub(/^\/\/[ \t]?/, "", line); if (line != "") printf "%s ", line; next }
    { line = $0; sub(/[ \t]*\*\/.*$/, "", line); sub(/^[ \t]*\/?\*+[ \t]?/, "", line); sub(/^[ \t]+/, "", line); if (line != "") printf "%s ", line }
    /\*\// { exit }
  ' "$f")
  if [ -n "$filter" ]; then
    printf '%s (%s lines)\n' "$f" "$lines"
    [ -n "$header" ] && printf '  %s\n' "$header"
    exports=$(grep -oE '^export (default )?(async )?(function\*? |class |const |let |interface |type |enum )[A-Za-z0-9_]+' "$f" | awk '{ printf "%s ", $NF }')
    [ -n "$exports" ] && printf '  exports: %s\n' "$exports"
  else
    first=$(printf '%s' "$header" | awk '{ s = $0; n = length(s); cut = 0; for (i = 30; i < n; i++) if (substr(s, i, 2) == ". " && substr(s, i - 1, 1) !~ /[0-9]/) { cut = i; break } if (cut) s = substr(s, 1, cut); if (length(s) > 118) s = substr(s, 1, 115) "..."; print s }')
    printf '%-52s %5s  %s\n' "$f" "$lines" "$first"
  fi
done

if [ -z "$filter" ]; then
  echo
  echo "Data: src/data/*.ts (work, testimonials, instagram, navigation, resume, notes, pages, chat-context). Notes bodies live only in notes.ts; the browser reads generated notes-index.ts."
  echo "UI primitives: src/components/ui/<Name>/ with a barrel index.ts; /ui is the reference. Components with stories and generated data files are left out of this map."
fi
exit 0
