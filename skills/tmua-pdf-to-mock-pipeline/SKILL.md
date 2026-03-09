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
Use `--config` to override file paths without editing code.

3. Validate completeness and schema safety.
The script reports:
- fatal issues (blocking): 320 total + per-year/per-paper completeness
- warnings (non-blocking): option/answer/text-quality anomalies

4. Sync into app data.
Use `--sync-app-data` to write `tmua-exam/data/tmua_questions_with_answers_320.json`.
Use `--autofix` to auto-repair common non-fatal issues (duplicate options, invalid answer key, control chars).

5. Verify app dataset.
Run `node tmua-exam/scripts/verify-data.js` for final checks.
Note: this verifier may report legacy data quality issues in historical TMUA source records (for example duplicate option keys or control characters). Treat these as cleanup backlog unless the build script fails completeness checks.

## Commands

```bash
# Build dataset in repo root
python3 skills/tmua-pdf-to-mock-pipeline/scripts/build_tmua_dataset.py \
  --root . \
  --config skills/tmua-pdf-to-mock-pipeline/pipeline.example.toml \
  --autofix \
  --sync-app-data

# Dry run style (only write root outputs, skip app sync)
python3 skills/tmua-pdf-to-mock-pipeline/scripts/build_tmua_dataset.py --root .

# One-shot pipeline wrapper
bash skills/tmua-pdf-to-mock-pipeline/scripts/run_pipeline.sh .

# Verify app data integrity
node tmua-exam/scripts/verify-data.js
```

## Output Contract

- `tmua_questions_complete_320.json`
- `tmua_questions_with_answers_320.json`
- optional sync target: `tmua-exam/data/tmua_questions_with_answers_320.json`
- `tmua_pipeline_report.json`
  - includes `fatalIssues`, `warnings`, and `autofixStats`

See [references/pipeline-map.md](references/pipeline-map.md) for stage mapping to legacy scripts.
