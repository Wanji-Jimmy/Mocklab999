#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

import pdfplumber


def extract_text(pdf_path: Path) -> str:
  pages = []
  with pdfplumber.open(str(pdf_path)) as pdf:
    for page in pdf.pages:
      pages.append(page.extract_text() or "")
  return "\n".join(pages)


def parse_answer_key(answer_text: str) -> dict[int, str]:
  answers: dict[int, str] = {}

  # Modern format: Q1 A MATH
  for q, a in re.findall(r"\bQ(\d{1,3})\s+([A-H])\b", answer_text):
    answers[int(q)] = a

  # Legacy format: 1 G 46 A (table with two columns)
  for q, a in re.findall(r"\b(\d{1,3})\s+([A-H])\b", answer_text):
    qi = int(q)
    if 1 <= qi <= 120:
      answers[qi] = a

  return answers


def parse_questions(question_text: str, max_question: int) -> list[dict]:
  start = question_text.find("PART A")
  if start >= 0:
    question_text = question_text[start:]

  anchors: list[tuple[int, int]] = []
  cursor = 0
  for n in range(1, max_question + 1):
    m = re.search(rf"(?m)^\s*{n}\s+", question_text[cursor:])
    if not m:
      raise RuntimeError(f"Could not locate question start for Q{n}")
    start_idx = cursor + m.start()
    end_idx = cursor + m.end()
    anchors.append((start_idx, end_idx))
    cursor = end_idx

  questions: list[dict] = []
  for i, (chunk_start, _chunk_head_end) in enumerate(anchors):
    qn = i + 1
    chunk_end = anchors[i + 1][0] if i + 1 < len(anchors) else len(question_text)
    block = question_text[chunk_start:chunk_end].strip()
    lines = [ln.rstrip() for ln in block.splitlines() if ln.strip()]
    if not lines:
      questions.append(
        {
          "questionNumber": qn,
          "question": "Question text unavailable.",
          "answers": {"a": "Option unavailable", "b": "Option unavailable"},
        }
      )
      continue

    first = re.sub(r"^\d{1,3}\s+", "", lines[0]).strip()
    if not first and len(lines) > 1:
      first = lines[1].strip()
      lines = [lines[0], *lines[2:]]

    stem_lines = [first] if first else []
    options: dict[str, str] = {}
    current_key = None

    for ln in lines[1:]:
      option_match = re.match(r"^([A-H])\s+(.*)$", ln.strip())
      if option_match:
        current_key = option_match.group(1).lower()
        options[current_key] = option_match.group(2).strip()
        continue
      if current_key is None:
        stem_lines.append(ln.strip())
      else:
        options[current_key] = f"{options[current_key]} {ln.strip()}".strip()

    stem = " ".join([s for s in stem_lines if s]).strip() or "Question text unavailable."
    if len(options) < 2:
      options = {"a": "Option unavailable", "b": "Option unavailable"}

    questions.append(
      {
        "questionNumber": qn,
        "question": stem,
        "answers": options,
      }
    )

  return questions


def nsaa_layout_for_year(year: str) -> dict:
  if year in {"2016", "2017", "2018", "2019"}:
    return {
      "max_question": 90,
      "ranges": {
        "mandatoryMath": (1, 18),
        "partBPhysics": (19, 36),
        "partCChemistry": (37, 54),
        "partDBiology": (55, 72),
        "partEAdvancedMathPhysics": (73, 90),
      },
    }

  return {
    "max_question": 80,
    "ranges": {
      "mandatoryMath": (1, 20),
      "partBPhysics": (21, 40),
      "partCChemistry": (41, 60),
      "partDBiology": (61, 80),
      "partEAdvancedMathPhysics": None,
    },
  }


def select_range(questions: list[dict], start: int, end: int, answers: dict[int, str]) -> list[dict]:
  rows = []
  for qn in range(start, end + 1):
    q = questions[qn - 1]
    rows.append(
      {
        "question": q["question"],
        "answers": q["answers"],
        "explanation": "Explanation pending (official PDF import).",
        "answer": answers.get(qn, "A").lower(),
      }
    )
  return rows


def build_payload(year: str, parsed_questions: list[dict], answers: dict[int, str]) -> dict:
  layout = nsaa_layout_for_year(year)
  max_question = layout["max_question"]
  if len(parsed_questions) < max_question:
    raise RuntimeError(f"Expected at least {max_question} parsed questions, got {len(parsed_questions)}")

  parsed_questions = parsed_questions[:max_question]
  ranges = layout["ranges"]

  payload = {
    "exam": "nsaa",
    "year": year,
    "source": "official-pdf-auto-parse",
    "mandatoryMath": select_range(parsed_questions, ranges["mandatoryMath"][0], ranges["mandatoryMath"][1], answers),
    "partBPhysics": select_range(parsed_questions, ranges["partBPhysics"][0], ranges["partBPhysics"][1], answers),
    "partCChemistry": select_range(parsed_questions, ranges["partCChemistry"][0], ranges["partCChemistry"][1], answers),
    "partDBiology": select_range(parsed_questions, ranges["partDBiology"][0], ranges["partDBiology"][1], answers),
    "partEAdvancedMathPhysics": [],
  }

  if ranges["partEAdvancedMathPhysics"] is not None:
    e_start, e_end = ranges["partEAdvancedMathPhysics"]
    payload["partEAdvancedMathPhysics"] = select_range(parsed_questions, e_start, e_end, answers)

  return payload


def main() -> None:
  parser = argparse.ArgumentParser(description="Import NSAA year data from official PDF files")
  parser.add_argument("--year", required=True, help="Year, e.g. 2016")
  args = parser.parse_args()

  root = Path(__file__).resolve().parents[1]
  year = str(args.year)

  question_pdf = root / "esat-materials" / "pdf" / f"NSAA_{year}_S1_QuestionPaper.pdf"
  answer_pdf = root / "esat-materials" / "pdf" / f"NSAA_{year}_S1_AnswerKey.pdf"
  output_json = root / "data" / "esat" / "nsaa" / f"{year}.json"
  extract_dir = root / "esat-materials" / "extracted" / "nsaa" / year

  if not question_pdf.exists() or not answer_pdf.exists():
    raise FileNotFoundError(f"Missing PDFs for NSAA {year}: {question_pdf} / {answer_pdf}")

  extract_dir.mkdir(parents=True, exist_ok=True)

  question_text = extract_text(question_pdf)
  answer_text = extract_text(answer_pdf)
  (extract_dir / "question_text.txt").write_text(question_text, encoding="utf-8")
  (extract_dir / "answer_key_text.txt").write_text(answer_text, encoding="utf-8")

  answers = parse_answer_key(answer_text)
  max_q = max(answers) if answers else nsaa_layout_for_year(year)["max_question"]
  parsed_questions = parse_questions(question_text, max_q)
  payload = build_payload(year, parsed_questions, answers)

  output_json.parent.mkdir(parents=True, exist_ok=True)
  output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  print(f"Wrote {output_json}")
  print(f"Questions parsed: {len(parsed_questions)} | Answers parsed: {len(answers)}")


if __name__ == "__main__":
  main()
