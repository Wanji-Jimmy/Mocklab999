---
name: tmua-pdf-to-mock-pipeline
description: Build and maintain the TMUA-specific pipeline from extracted PDF question files to mock-exam-ready dataset files. Use when users need to merge TMUA question sources, attach answers/explanations, validate 320-question completeness, and sync outputs into tmua-exam data.
---

# TMUA PDF To Mock Pipeline

## Overview

Use this skill to run the TMUA production data pipeline from intermediate extraction artifacts into mock-system-ready JSON.

## Workflow

1. Prepare intermediate files in repo root.
Required files:
- `tmua_questions_v3.json` (text-heavy extracted set)
- `image_based_60_questions.json` (image-based set)
- `extracted_answers.json`
- `extracted_explanations.json`

2. Build merged dataset.
Run `scripts/build_tmua_dataset.py`.

3. Validate completeness and schema safety.
The script enforces total 320 questions and per-year/per-paper 20 questions.

4. Sync into app data.
Use `--sync-app-data` to write `tmua-exam/data/tmua_questions_with_answers_320.json`.

5. Verify app dataset.
Run `node tmua-exam/scripts/verify-data.js` for final checks.
Note: this verifier may report legacy data quality issues in historical TMUA source records (for example duplicate option keys or control characters). Treat these as cleanup backlog unless the build script fails completeness checks.

## Commands

```bash
# Build dataset in repo root
python3 skills/tmua-pdf-to-mock-pipeline/scripts/build_tmua_dataset.py \
  --root . \
  --sync-app-data

# Dry run style (only write root outputs, skip app sync)
python3 skills/tmua-pdf-to-mock-pipeline/scripts/build_tmua_dataset.py --root .

# Verify app data integrity
node tmua-exam/scripts/verify-data.js
```

## Output Contract

- `tmua_questions_complete_320.json`
- `tmua_questions_with_answers_320.json`
- optional sync target: `tmua-exam/data/tmua_questions_with_answers_320.json`
- `tmua_pipeline_report.json`

See [references/pipeline-map.md](references/pipeline-map.md) for stage mapping to legacy scripts.
