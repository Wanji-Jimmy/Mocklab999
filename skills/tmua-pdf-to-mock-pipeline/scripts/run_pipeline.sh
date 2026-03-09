#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
CONFIG="${2:-skills/tmua-pdf-to-mock-pipeline/pipeline.example.toml}"

python3 "$ROOT/skills/tmua-pdf-to-mock-pipeline/scripts/build_tmua_dataset.py" \
  --root "$ROOT" \
  --config "$CONFIG" \
  --autofix \
  --sync-app-data

node "$ROOT/tmua-exam/scripts/verify-data.js" || true

echo "Pipeline run finished. Check tmua_pipeline_report.json and verifier output."
