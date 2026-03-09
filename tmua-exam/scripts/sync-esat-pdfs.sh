#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/esat-materials/pdf"
URL_LIST_FILE="$ROOT_DIR/esat-materials/esat_pdf_urls.txt"
SOURCE_PAGE="${1:-https://esat-tmua.ac.uk/esat-preparation-materials/}"

mkdir -p "$OUT_DIR"

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

curl -sSL "$SOURCE_PAGE" \
  | rg --pcre2 -o 'https?://[^"\s>]+\.pdf' \
  | rg '_(20(1[6-9]|2[0-3]))_S1_(QuestionPaper|AnswerKey)\.pdf$' \
  | rg '(ENGAA|NSAA)_' \
  | sort -u > "$tmp_file"

cp "$tmp_file" "$URL_LIST_FILE"

while IFS= read -r url; do
  file_name="$(basename "$url")"
  curl -sSL "$url" -o "$OUT_DIR/$file_name"
  printf 'downloaded %s\n' "$file_name"
done < "$tmp_file"

printf 'saved %s files to %s\n' "$(wc -l < "$tmp_file")" "$OUT_DIR"
