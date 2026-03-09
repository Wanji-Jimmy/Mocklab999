# Regex Tuning Guide

## Goal

Keep extraction deterministic while allowing light customization for different PDF layouts.

## Split heuristics

- Question split candidates:
  - `\n\s*(\d{1,3})\s+`
  - `\n\s*(\d{1,3})\.\s+`
- Option split candidates:
  - `\n\s*([A-Z])\s+`
  - `\n\s*\(([A-Z])\)\s+`

## Quality checks

- If output count is too low, inspect `*_raw_text.txt` before changing regex.
- If many `(cid:xxxx)` tokens exist, prefer OCR fallback instead of aggressive regex.
- Keep all parser changes pattern-based, never question-specific.

## CID/OCR fallback rule

If CID token ratio is high and extracted text looks unreadable, run with `--ocr-fallback pix2text` and merge back into the same schema.
