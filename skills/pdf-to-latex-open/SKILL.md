---
name: pdf-to-latex-open
description: Open-source, reusable workflow for converting arbitrary exam or worksheet PDFs and math-heavy natural language into LaTeX-ready structured JSON. Use when users need PDF question extraction, mathematical text normalization (symbols/functions/powers), option parsing, OCR fallback for broken text layers, and clean exports for downstream apps or datasets.
---

# PDF To LaTeX Open

## Overview

Use this skill to build and run a generic PDF-to-LaTeX data pipeline that is not tied to TMUA or any single exam format.

## Workflow

1. Run baseline extraction.
Execute `scripts/extract_pdf_questions.py` on one PDF or a folder.

2. Inspect quality.
Check `summary.json` and `*_raw_text.txt` to find parsing failures.

3. Enable OCR fallback when needed.
If text is CID-corrupted or image-heavy, rerun with `--ocr-fallback pix2text`.

4. Normalize mathematical language to LaTeX-like tokens.
The extractor enables math normalization by default (`--normalize-math on`) to convert common forms like `x squared`, `sqrt(x)`, `≤`, and trig/log function names.

5. Export for downstream usage.
Use `--format app` for app-friendly records or use `scripts/json_to_latex_snippets.py` to generate `.tex` snippets.

## Commands

```bash
# Baseline extraction
python3 scripts/extract_pdf_questions.py /path/to/pdfs --normalize-math on --out-dir ./output

# With OCR fallback and app-style output
python3 scripts/extract_pdf_questions.py /path/to/pdfs --ocr-fallback pix2text --format app --out-dir ./output

# Convert extracted JSON to .tex snippets for manual review
python3 scripts/json_to_latex_snippets.py ./output/questions_combined.json --out ./output/questions_snippets.tex
```

## Output Contract

- `*_raw_text.txt`: extracted/normalized raw text per PDF
- `*_questions.json`: parsed question blocks per PDF
- `questions_combined.json` or `questions_app_format.json`: merged result
- `summary.json`: parser metrics and count per file

See [references/regex-tuning.md](references/regex-tuning.md) for parser tuning and failure handling.
