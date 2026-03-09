#!/usr/bin/env python3
"""Generic open-source PDF -> LaTeX-ready question extractor."""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

QUESTION_PATTERNS = [
    re.compile(r"\n\s*(\d{1,3})\s+"),
    re.compile(r"\n\s*(\d{1,3})\.\s+"),
]
OPTION_PATTERNS = [
    re.compile(r"\n\s*([A-Z])\s+"),
    re.compile(r"\n\s*\(([A-Z])\)\s+"),
]
CID_PATTERN = re.compile(r"\(cid:\d+\)")


@dataclass
class Option:
    key: str
    text: str


@dataclass
class Question:
    source_file: str
    number: int
    stem: str
    options: list[Option]


def clean_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def cid_ratio(text: str) -> float:
    if not text:
        return 0.0
    hits = len(CID_PATTERN.findall(text))
    return hits / max(1, len(text.split()))


def extract_text_pdfplumber(pdf_path: Path) -> str:
    try:
        import pdfplumber
    except ImportError as exc:
        raise SystemExit(
            "pdfplumber is required. Install it with: `pip install -r requirements.txt`"
        ) from exc

    chunks: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            if text.strip():
                chunks.append(text)
                continue
            words = page.extract_words() or []
            if words:
                chunks.append(" ".join(w.get("text", "") for w in words))
    return clean_text("\n\n".join(chunks))


def extract_text_pix2text(pdf_path: Path) -> str:
    from pix2text import Pix2Text  # optional dependency

    p2t = Pix2Text.from_config()
    result = p2t.recognize_pdf(str(pdf_path), page_numbers=None)

    lines: list[str] = []
    if isinstance(result, list):
        for page in result:
            if isinstance(page, dict):
                for key in ("text", "content", "latex"):
                    if key in page and isinstance(page[key], str):
                        lines.append(page[key])
            elif isinstance(page, str):
                lines.append(page)
    return clean_text("\n".join(lines))


def split_questions(text: str) -> list[str]:
    candidate = text if text.startswith("\n") else f"\n{text}"
    for pattern in QUESTION_PATTERNS:
        parts = pattern.split(candidate)
        if len(parts) >= 5:
            return parts
    return [candidate]


def parse_questions(text: str, source_file: str) -> list[Question]:
    out: list[Question] = []
    parts = split_questions(text)

    for i in range(1, len(parts), 2):
        if i + 1 >= len(parts):
            continue
        try:
            number = int(parts[i])
        except ValueError:
            continue

        block = parts[i + 1].strip()
        if not block:
            continue

        option_parts: list[str] = []
        for pattern in OPTION_PATTERNS:
            option_parts = pattern.split(block)
            if len(option_parts) >= 3:
                break
        if len(option_parts) < 3:
            continue

        stem = clean_text(option_parts[0])
        options: list[Option] = []

        for j in range(1, len(option_parts), 2):
            if j + 1 >= len(option_parts):
                continue
            key = option_parts[j].strip().upper()
            option_text = option_parts[j + 1]
            option_text = re.split(r"\n\s*(?:[A-Z]|\([A-Z]\))\s+", option_text)[0]
            option_text = clean_text(option_text)
            if key and option_text:
                options.append(Option(key=key, text=option_text))

        if stem and len(options) >= 2:
            out.append(Question(source_file=source_file, number=number, stem=stem, options=options))

    return out


def to_records(questions: Iterable[Question]) -> list[dict]:
    return [
        {
            "sourceFile": q.source_file,
            "number": q.number,
            "stem": q.stem,
            "options": [{"key": o.key, "text": o.text} for o in q.options],
        }
        for q in questions
    ]


def to_app_records(questions: Iterable[Question]) -> list[dict]:
    return [
        {
            "paper": 1,
            "index": q.number - 1,
            "stemLatex": q.stem,
            "options": [{"key": o.key, "latex": o.text} for o in q.options],
            "answerKey": "A",
            "explanationLatex": "[TODO]",
            "tags": [q.source_file],
            "difficulty": 2,
        }
        for q in questions
    ]


def collect_pdfs(input_path: Path) -> list[Path]:
    if input_path.is_file() and input_path.suffix.lower() == ".pdf":
        return [input_path]
    if input_path.is_dir():
        return sorted(p for p in input_path.glob("*.pdf") if p.is_file())
    return []


def process_pdf(pdf_path: Path, ocr_fallback: str) -> tuple[str, list[Question], float]:
    text = extract_text_pdfplumber(pdf_path)
    ratio = cid_ratio(text)

    if ocr_fallback == "pix2text" and ratio > 0.15:
        try:
            ocr_text = extract_text_pix2text(pdf_path)
            if ocr_text and len(ocr_text) > len(text) // 2:
                text = ocr_text
        except Exception:
            pass

    questions = parse_questions(text, pdf_path.name)
    return text, questions, ratio


def run(input_path: Path, out_dir: Path, fmt: str, ocr_fallback: str) -> None:
    pdfs = collect_pdfs(input_path)
    if not pdfs:
        raise SystemExit(f"No PDF found at: {input_path}")

    out_dir.mkdir(parents=True, exist_ok=True)
    merged: list[Question] = []
    summary: dict[str, dict] = {}

    for pdf in pdfs:
        text, questions, ratio = process_pdf(pdf, ocr_fallback)
        (out_dir / f"{pdf.stem}_raw_text.txt").write_text(text, encoding="utf-8")
        (out_dir / f"{pdf.stem}_questions.json").write_text(
            json.dumps(to_records(questions), ensure_ascii=False, indent=2), encoding="utf-8"
        )

        merged.extend(questions)
        summary[pdf.name] = {
            "questions": len(questions),
            "cidRatio": round(ratio, 4),
            "ocrFallback": ocr_fallback,
        }

    combined = to_app_records(merged) if fmt == "app" else to_records(merged)
    combined_name = "questions_app_format.json" if fmt == "app" else "questions_combined.json"
    (out_dir / combined_name).write_text(json.dumps(combined, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Processed {len(pdfs)} PDF(s)")
    for name, metrics in summary.items():
        print(f"- {name}: {metrics['questions']} questions, cidRatio={metrics['cidRatio']}")
    print(f"Output: {out_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract PDF questions into LaTeX-ready JSON.")
    parser.add_argument("input", type=Path, help="PDF file or directory")
    parser.add_argument("--out-dir", type=Path, default=Path("./output"), help="Output directory")
    parser.add_argument("--format", choices=["combined", "app"], default="combined", help="Output schema")
    parser.add_argument(
        "--ocr-fallback",
        choices=["none", "pix2text"],
        default="none",
        help="Fallback OCR backend when text layer quality is poor",
    )
    args = parser.parse_args()

    run(args.input, args.out_dir, args.format, args.ocr_fallback)


if __name__ == "__main__":
    main()
