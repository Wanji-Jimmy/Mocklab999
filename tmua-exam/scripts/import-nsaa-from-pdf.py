#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path

import pdfplumber

OPTION_RE = re.compile(r"^\(?([A-H])(?:[\)\.]|\s|$)\s*(.*)$")
CID_RE = re.compile(r"\(cid:\d+\)")
TRAILING_PAGE_NUMBER_RE = re.compile(r"^(.+\D)\s+\d{1,2}$")
TRAILING_PAPER_CODE_RE = re.compile(r"^(.+\D)\s+\d{3}\s+\d{3}$")
STANDALONE_OPTION_TOKEN_RE = re.compile(r"(?:(?<=^)|(?<=\s))([A-H])(?=\s|$)")
PURE_OPTION_LABEL_LINE_RE = re.compile(r"^(?:[A-H]\s+){1,}[A-H]$")

INLINE_NOISE_PATTERNS = [
  re.compile(r"\s*©\s*UCLES.*$", re.IGNORECASE),
  re.compile(r"\s*\[?\s*Turn\s+over\s*\]?.*$", re.IGNORECASE),
  re.compile(r"\s*Page\s+\d+.*$", re.IGNORECASE),
  re.compile(r"\s*Question\s+Paper.*$", re.IGNORECASE),
  re.compile(r"\s*Answer\s+Key.*$", re.IGNORECASE),
  re.compile(r"\s*BLANK\s+PAGE.*$", re.IGNORECASE),
  re.compile(r"\s*PART\s+[A-E]\b.*$", re.IGNORECASE),
  re.compile(r"\s*END\s+OF\s+TEST.*$", re.IGNORECASE),
]

NOISE_LINE_PATTERNS = [
  re.compile(r"^NATURAL\s+SCIENCES\b", re.IGNORECASE),
  re.compile(r"^ENGINEERING\s+ADMISSIONS\s+ASSESSMENT\b", re.IGNORECASE),
  re.compile(r"^ADMISSIONS\s+ASSESSMENT\b", re.IGNORECASE),
  re.compile(r"^SECTION\s+1\b", re.IGNORECASE),
  re.compile(r"^INSTRUCTIONS\s+TO\s+CANDIDATES\b", re.IGNORECASE),
  re.compile(r"^THIS\s+QUESTION\s+PAPER\s+CONSISTS\s+OF\b", re.IGNORECASE),
  re.compile(r"^PAPER\s+CONTENT\b", re.IGNORECASE),
  re.compile(r"^PV\d+\b", re.IGNORECASE),
  re.compile(r"^\*\d{8,}\*$"),
  re.compile(r"^\[?diagram\s+not\s+to\s+scale\]?$", re.IGNORECASE),
]


def extract_text(pdf_path: Path) -> str:
  pages = []
  with pdfplumber.open(str(pdf_path)) as pdf:
    for page in pdf.pages:
      # Drop rotated chart-axis glyphs that become reversed token noise in plain text extraction.
      filtered_page = page.filter(lambda obj: obj.get("object_type") != "char" or obj.get("upright", True))
      pages.append(filtered_page.extract_text() or "")
  return "\n".join(pages)


def clean_fragment(text: str) -> str:
  out = CID_RE.sub(" ", str(text or "").replace("\xa0", " "))
  for pattern in INLINE_NOISE_PATTERNS:
    out = pattern.sub("", out)
  out = re.sub(r"\s+", " ", out).strip()
  return out


def is_noise_line(line: str) -> bool:
  candidate = line.strip()
  if not candidate:
    return True
  return any(pattern.search(candidate) for pattern in NOISE_LINE_PATTERNS)


def normalize_source_text(raw_text: str, start_marker: str) -> str:
  text = raw_text
  marker = start_marker.upper()
  idx = text.upper().find(marker)
  if idx >= 0:
    text = text[idx:]

  rows = []
  for raw_line in text.splitlines():
    line = clean_fragment(raw_line)
    if not line:
      continue
    if is_noise_line(line):
      continue
    rows.append(line)

  return "\n".join(rows)


def parse_answer_key(answer_text: str, max_question: int) -> dict[int, str]:
  answers: dict[int, str] = {}

  working = answer_text
  q1_match = re.search(r"\bQ\s*1\b", working, re.IGNORECASE)
  if q1_match:
    working = working[q1_match.start():]
  else:
    table_match = re.search(r"(?m)^\s*1\s+[A-H]\b", working)
    if table_match:
      working = working[table_match.start():]

  normalized = normalize_source_text(working, "")

  for q, a in re.findall(r"\bQ\s*([1-9]\d{0,2})\s*([A-H])\b", normalized, re.IGNORECASE):
    qi = int(q)
    if 1 <= qi <= max_question:
      answers.setdefault(qi, a.upper())

  for q, a in re.findall(r"\b([1-9]\d{0,2})\s+([A-H])\b", normalized, re.IGNORECASE):
    qi = int(q)
    if 1 <= qi <= max_question:
      answers.setdefault(qi, a.upper())

  return answers


def strip_question_lead(line: str) -> str:
  return re.sub(r"^\s*\d{1,3}\s*", "", line).strip()


def find_option_start(lines: list[str]) -> int | None:
  for i, line in enumerate(lines):
    m = OPTION_RE.match(line)
    if not m:
      continue
    if m.group(1).upper() != "A":
      continue
    for j in range(i + 1, min(i + 5, len(lines))):
      m2 = OPTION_RE.match(lines[j])
      if m2 and m2.group(1).upper() == "B":
        return i
  return None


def parse_inline_options(block_lines: list[str]) -> tuple[str, dict[str, str]] | None:
  joined = clean_fragment(" ".join(block_lines))
  if not joined:
    return None
  joined = strip_question_lead(joined)

  markers = list(STANDALONE_OPTION_TOKEN_RE.finditer(joined))
  if not markers:
    return None

  candidate_runs: list[list[re.Match[str]]] = []
  for i, marker in enumerate(markers):
    if marker.group(1) != "A":
      continue
    run = [marker]
    expected_ord = ord("B")
    for j in range(i + 1, len(markers)):
      letter = markers[j].group(1)
      if ord(letter) == expected_ord:
        run.append(markers[j])
        expected_ord += 1
        if expected_ord > ord("H"):
          break
      elif letter == "A":
        break
    if len(run) >= 3:
      candidate_runs.append(run)

  if not candidate_runs:
    return None

  candidate_runs.sort(key=lambda run: (-len(run), run[0].start()))
  for run in candidate_runs:
    stem = clean_fragment(joined[:run[0].start()])
    options: dict[str, str] = {}
    for idx, marker in enumerate(run):
      key = marker.group(1).lower()
      start = marker.end()
      end = run[idx + 1].start() if idx + 1 < len(run) else len(joined)
      value = clean_fragment(joined[start:end])
      if value:
        options[key] = value

    if len(options) < 3:
      continue
    if len(options.get("a", "")) > 120:
      continue
    return (stem, options)

  return None


def sanitize_option_text(value: str) -> str:
  cleaned = clean_fragment(value)
  paper_code = TRAILING_PAPER_CODE_RE.match(cleaned)
  if paper_code:
    cleaned = clean_fragment(paper_code.group(1))
  page_like = TRAILING_PAGE_NUMBER_RE.match(cleaned)
  if page_like:
    candidate = page_like.group(1)
    trailing_number = cleaned.rsplit(" ", 1)[-1]
    if trailing_number.isdigit() and 10 <= int(trailing_number) <= 99:
      return clean_fragment(candidate)
  return cleaned


def option_placeholder(letter: str) -> str:
  return f"Option {letter} (diagram/text unavailable in PDF text extraction)."


def parse_visual_options(lines: list[str]) -> dict[str, str] | None:
  if not lines:
    return None

  tail_start = 0
  for idx, line in enumerate(lines):
    if "?" in line or re.search(r"\b(Which|What)\b", line):
      tail_start = idx + 1

  tail = lines[tail_start:] if tail_start < len(lines) else lines
  options: dict[str, str] = {}

  for line in tail:
    line = line.strip()
    if not line:
      continue

    inline_markers = list(STANDALONE_OPTION_TOKEN_RE.finditer(line))
    if inline_markers and inline_markers[0].start() == 0 and len(inline_markers) >= 2:
      for idx, marker in enumerate(inline_markers):
        key = marker.group(1).lower()
        start = marker.end()
        end = inline_markers[idx + 1].start() if idx + 1 < len(inline_markers) else len(line)
        text = sanitize_option_text(line[start:end])
        options.setdefault(key, text or option_placeholder(marker.group(1)))
      continue

    option_match = OPTION_RE.match(line)
    if option_match:
      key = option_match.group(1).lower()
      text = sanitize_option_text(option_match.group(2))
      options.setdefault(key, text or option_placeholder(option_match.group(1)))
      continue

    if PURE_OPTION_LABEL_LINE_RE.match(line):
      for label in STANDALONE_OPTION_TOKEN_RE.findall(line):
        options.setdefault(label.lower(), option_placeholder(label))

  if len(options) < 4:
    return None

  return {key: options[key] for key in sorted(options.keys())}


def anchor_patterns(question_number: int) -> list[str]:
  return [
    rf"(?m)^\s*{question_number}[ \t]+(?:[A-Z][a-z]|[A-Z][ \t]+[a-z])[^\n]{{1,}}$",
    rf"(?m)^\s*{question_number}[ \t]+[A-Z][^\n]{{2,}}$",
    rf"(?m)^\s*{question_number}[ \t]+(?=[^\n]{{0,32}}[A-Za-z])[^\n]{{4,}}$",
    rf"(?m)^\s*{question_number}[ \t]+(?![-+−–=<>*/().,\d\s]+$)[^\n]{{4,}}$",
    rf"(?m)^\s*{question_number}(?:[ \t]+.*)?$",
  ]


def is_valid_fallback_candidate(text: str, question_number: int, start: int, end: int) -> bool:
  line = text[start:end]
  match = re.match(rf"^\s*{question_number}(?:[ \t]+(.*))?$", line)
  if not match:
    return False

  tail = (match.group(1) or "").strip()
  if tail:
    return bool(re.search(r"[A-Za-z]", tail))

  line_break = text.find("\n", end)
  if line_break < 0:
    return False

  probe = line_break + 1
  for _ in range(6):
    next_end = text.find("\n", probe)
    next_line = text[probe:] if next_end < 0 else text[probe:next_end]
    probe = len(text) if next_end < 0 else next_end + 1

    candidate = next_line.strip()
    if not candidate:
      continue

    numbered_line = re.match(r"^([1-9]\d{0,2})[ \t]+[A-Za-z]", candidate)
    if numbered_line:
      return False

    if OPTION_RE.match(candidate):
      return False

    if re.match(r"^(PART|SECTION|INSTRUCTIONS|BLANK\s+PAGE|©)\b", candidate, re.IGNORECASE):
      return False

    if re.match(r"^[A-Za-z(]", candidate):
      return True

    if candidate.startswith("["):
      continue

    if re.match(r"^\d[\dA-Za-z()./\\-]*$", candidate):
      continue

  return False


def build_anchor_candidates(text: str, question_number: int) -> list[tuple[int, int, int]]:
  by_start: dict[int, tuple[int, int, int]] = {}
  for score, pattern in enumerate(anchor_patterns(question_number)):
    for match in re.finditer(pattern, text):
      start = match.start()
      end = match.end()
      if score == 4 and not is_valid_fallback_candidate(text, question_number, start, end):
        continue
      existing = by_start.get(start)
      if existing is None or score < existing[2]:
        by_start[start] = (start, end, score)
  return sorted(by_start.values(), key=lambda row: (row[0], row[2]))


def has_lookahead_chain(
  candidates_map: dict[int, list[tuple[int, int, int]]],
  min_start: int,
  question_number: int,
  max_question: int,
  depth: int,
) -> bool:
  if depth <= 0 or question_number > max_question:
    return True

  candidates = candidates_map.get(question_number, [])
  for start, end, _score in candidates:
    if start < min_start:
      continue
    if has_lookahead_chain(candidates_map, end, question_number + 1, max_question, depth - 1):
      return True
  return False


def parse_questions(question_text: str, max_question: int) -> list[dict]:
  question_text = normalize_source_text(question_text, "PART A")

  candidates_map: dict[int, list[tuple[int, int, int]]] = {
    n: build_anchor_candidates(question_text, n) for n in range(1, max_question + 1)
  }

  anchors: list[tuple[int, int]] = []
  cursor = 0
  for n in range(1, max_question + 1):
    candidates = candidates_map.get(n, [])
    valid_candidates: list[tuple[int, int, int]] = []
    for candidate in candidates:
      start, end, _score = candidate
      if start < cursor:
        continue
      if has_lookahead_chain(candidates_map, end, n + 1, max_question, depth=2):
        valid_candidates.append(candidate)

    chosen: tuple[int, int, int] | None = None
    if valid_candidates:
      chosen = min(valid_candidates, key=lambda row: (row[2], row[0]))
    else:
      for candidate in candidates:
        if candidate[0] >= cursor:
          chosen = candidate
          break

    if chosen is None:
      raise RuntimeError(f"Could not locate question start for Q{n}")

    start_idx = chosen[0]
    end_idx = chosen[1]
    anchors.append((start_idx, end_idx))
    cursor = end_idx

  questions: list[dict] = []
  for i, (chunk_start, _chunk_head_end) in enumerate(anchors):
    qn = i + 1
    chunk_end = anchors[i + 1][0] if i + 1 < len(anchors) else len(question_text)
    block = question_text[chunk_start:chunk_end].strip()

    raw_lines = [clean_fragment(ln) for ln in block.splitlines() if clean_fragment(ln)]
    lines = [ln for ln in raw_lines if not is_noise_line(ln)]

    if not lines:
      questions.append(
        {
          "questionNumber": qn,
          "question": "Question text unavailable.",
          "answers": {"a": "Option unavailable", "b": "Option unavailable"},
        }
      )
      continue

    option_start = find_option_start(lines)
    stem_slice = lines if option_start is None else lines[:option_start]

    stem_lines: list[str] = []
    if stem_slice:
      first = strip_question_lead(stem_slice[0])
      if first:
        stem_lines.append(first)
      for ln in stem_slice[1:]:
        if OPTION_RE.match(ln):
          continue
        stem_lines.append(ln)

    stem = " ".join([s for s in stem_lines if s]).strip() or "Question text unavailable."

    options: dict[str, str] = {}
    current_key = None
    if option_start is not None:
      for ln in lines[option_start:]:
        match = OPTION_RE.match(ln)
        if match:
          current_key = match.group(1).lower()
          option_text = sanitize_option_text(match.group(2))
          options[current_key] = option_text or "Option unavailable"
          continue
        if current_key is None:
          continue
        continuation = clean_fragment(ln)
        if continuation and not is_noise_line(continuation):
          options[current_key] = sanitize_option_text(f"{options[current_key]} {continuation}")

    if len(options) < 4:
      inline_fallback = parse_inline_options(lines)
      if inline_fallback:
        inline_stem, inline_options = inline_fallback
        if len(inline_options) > len(options):
          stem = inline_stem or stem
          options = inline_options
    if len(options) < 4:
      visual_options = parse_visual_options(lines)
      if visual_options and len(visual_options) > len(options):
        options = visual_options
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
    answer_keys = q.get("answers") or {"a": "Option unavailable"}
    default_answer = next(iter(answer_keys.keys()), "a").upper()
    keyed_answer = answers.get(qn, default_answer).lower()
    if keyed_answer not in answer_keys:
      keyed_answer = default_answer.lower()
    rows.append(
      {
        "question": q["question"],
        "answers": answer_keys,
        "explanation": "Explanation pending (official PDF import).",
        "answer": keyed_answer,
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

  max_q = nsaa_layout_for_year(year)["max_question"]
  answers = parse_answer_key(answer_text, max_q)
  parsed_questions = parse_questions(question_text, max_q)
  payload = build_payload(year, parsed_questions, answers)

  output_json.parent.mkdir(parents=True, exist_ok=True)
  output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  print(f"Wrote {output_json}")
  print(f"Questions parsed: {len(parsed_questions)} | Answers parsed: {len(answers)}")


if __name__ == "__main__":
  main()
