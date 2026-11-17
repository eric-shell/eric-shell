---
name: map
description: One line per source module (path, size, header-comment purpose) so you can find the right file without opening it; with a path argument, each matching module's full header comment and exports. Use before exploring the code or whenever you are unsure where something lives.
argument-hint: [dir or path fragment, e.g. src/components/ui]
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/map.sh *)
---
# Repo map

!`${CLAUDE_SKILL_DIR}/map.sh $ARGUMENTS`

Many modules have no header comment, so the purpose column is blank: use the names, and `.claude/rules/ui.md` for the ui directory. Next: `grep -rn "export .* <name>" src` to locate a symbol, then read only the file or line range you need. Re-run with a path (`/map src/hooks`) for exports and full headers of one area.
