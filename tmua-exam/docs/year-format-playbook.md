# TMUA Year Formatting Playbook (Proven on 2016)

This is the stable workflow that fixed 2016 math rendering and formatting end-to-end.
Use this same flow for each next year (2017, 2018, ...).

## 1. Lock the runtime first

Before touching data, ensure you are testing the correct dev server process.

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:3002 -sTCP:LISTEN
```

If needed, kill stale process and restart with a dedicated dist dir:

```bash
kill <pid>
NEXT_DIST_DIR=.next-dev-3001 npx next dev --hostname 127.0.0.1 --port 3001
```

Reason: stale server was a root cause of "fix not visible" during 2016 work.

## 2. Verify pipeline order

Always check in this order:

1. Data file: `data/tmua_questions_with_answers_320.json`
2. API output: `/api/questions?year=YYYY`
3. Renderer behavior: `components/LatexRenderer.tsx`
4. CSS availability: bundled KaTeX css in app build output

Key checks:

```bash
curl -s 'http://127.0.0.1:3001/api/questions?year=2016' | head -c 2000
curl -s 'http://127.0.0.1:3001/exam/2016' | rg -n "app/layout.css" -S
curl -s 'http://127.0.0.1:3001/_next/static/css/app/layout.css?...' | rg -n "katex|msupsub|sqrt" -S
```

## 3. Normalize that year's question text

For target year:

- remove noisy outer `$$...$$`
- convert `$$$$` separators to paragraph breaks
- normalize whitespace/newlines
- keep inline math wrapped consistently

Directly patch only the target year entries first.

## 4. Fix high-impact math tokens explicitly

For target year, ensure:

- exponents use `^` (prefer `^{2}` for robust display in options)
- roots use `\\sqrt{...}`
- sums/integrals use correct index syntax
- obvious OCR typos are corrected (`n+1` vs `n=1`, etc.)

## 5. Renderer safety rules (critical)

`LatexRenderer` must classify formula lines as math, not prose.

The 2016 fix that mattered:

- expressions like `a_n = (-1)^n ...` must be treated as math
- single symbol delimiters (`$a$`) must still render as math
- do not strip valid math delimiters when mixed with prose

If symptoms are "sqrt bar wrong", "superscript becomes plain 2", "raw LaTeX text":
check classifier logic before editing more data.

## 6. CSS rule for math rendering

Use local bundled KaTeX CSS import in root layout:

```ts
import 'katex/dist/katex.min.css'
```

Do not rely on external CDN as the only source.

## 7. Year-specific QA checklist

For year `YYYY`, manually inspect at least:

- P1 Q1 (mixed prose + root/superscript)
- P1 Q4 (subscript/sum)
- P1 Q9 (circle equation with powers)
- P2 Q1 (integral form)
- P2 Q6 (multi-line recurrence + sum)
- P2 Q17/18 (multi-equation statements)

## 8. Required verification commands

```bash
npm run verify:data
npm run verify:journey
```

Then API spot-check:

```bash
curl -s 'http://127.0.0.1:3001/api/questions?year=YYYY'
```

## 9. Known anti-patterns to avoid

- Fixing only screenshots without checking API output
- Editing data while testing stale server process
- Treating renderer bugs as data bugs
- Relying on browser cache state instead of hard checks

## 10. Success criteria

A year is considered done only when:

1. API text for that year is normalized and mathematically correct
2. renderer shows powers/roots/sums correctly in UI
3. verify scripts pass
4. manual checklist questions render cleanly

