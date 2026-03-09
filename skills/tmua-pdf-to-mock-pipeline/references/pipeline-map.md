# TMUA Pipeline Map

## Legacy chain (historical)

- Extraction phase:
  - `extract_questions.py`
  - `extract_with_ocr.py`
  - `convert_pdf_latex.py`
- Merge phase:
  - `merge_all_320_questions.py`
  - `merge_answers_to_questions.py`
- App integration:
  - `tmua-exam/data/tmua_questions_with_answers_320.json`
  - `tmua-exam/scripts/verify-data.js`

## Current skill scope

This skill starts from intermediate JSON artifacts and standardizes merge + validation + app sync into one repeatable command.

## Data expectations

- Each question record includes: `year`, `paper`, `number`, `stem`, `options`
- Option shape: `{ key, text }`
- Answers map shape: `answers[year][paper][number]`
- Explanations map shape: `explanations[year][paper][number]`
