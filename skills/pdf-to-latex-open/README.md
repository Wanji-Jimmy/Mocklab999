# pdf-to-latex-open

Open-source Codex skill for converting arbitrary exam/worksheet PDFs into LaTeX-ready structured JSON, with optional OCR fallback.

## What this includes

- Reusable Codex skill spec: `SKILL.md`
- Generic parser script: `scripts/extract_pdf_questions.py`
- JSON -> LaTeX snippet exporter: `scripts/json_to_latex_snippets.py`
- Regex tuning notes: `references/regex-tuning.md`
- Unit tests + CI workflow

## Quick start

```bash
cd skills/pdf-to-latex-open
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Parse one PDF
python3 scripts/extract_pdf_questions.py /absolute/path/to/file.pdf --out-dir ./output

# Parse a folder with app-format output
python3 scripts/extract_pdf_questions.py /absolute/path/to/pdfs --format app --out-dir ./output

# OCR fallback (requires optional deps)
pip install -r requirements-optional.txt
python3 scripts/extract_pdf_questions.py /absolute/path/to/pdfs --ocr-fallback pix2text --out-dir ./output

# Convert JSON output to tex snippets
python3 scripts/json_to_latex_snippets.py ./output/questions_combined.json --out ./output/questions_snippets.tex
```

## Output files

- `*_raw_text.txt`
- `*_questions.json`
- `questions_combined.json` or `questions_app_format.json`
- `summary.json`

## Run tests

```bash
python3 -m unittest discover -s tests -v
```

## License

MIT
