---
name: check
description: Verify the code - typecheck (tsc -b), ESLint, then the Vitest suite (about 6 s in all), printing only failures and a one-line summary. Use only when CLAUDE.md's Checks table calls for it or when asked whether things pass; most prompts need none. Arguments narrow the tests (a file, -t "name"; typecheck still runs, lint is skipped) or "tsc" for typecheck only.
argument-hint: [tests/file.test.ts] [-t name] | tsc
allowed-tools: Bash(.claude/skills/check/check.sh *)
---
Run from the project root:

    .claude/skills/check/check.sh $ARGUMENTS

- Typecheck alone is about 3 s (`check.sh tsc`); lint about 2 s; the suite about 1 s. `npm run build` (about 5 s, with the prerender) is separate: run it for config, route, prerender or `vercel.json` changes.
- Fix the first failure, then re-run the narrowest target. A `tests/ui-vocabulary.test.ts` or `tests/notes.test.ts` failure means a class, value or entry needs fixing, not the test; the message says what to use.
- Report the script's output verbatim only when it shows failures; otherwise state the summary lines.
