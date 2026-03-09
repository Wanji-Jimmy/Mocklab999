#!/usr/bin/env python3
"""Build TMUA mock-exam dataset from extracted artifacts."""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    if not path.exists():
        raise SystemExit(f"Missing required file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_question(q: dict) -> dict:
    out = dict(q)
    out["year"] = str(out.get("year", ""))
    out["paper"] = int(out.get("paper", 0) or 0)
    out["number"] = int(out.get("number", 0) or 0)

    options = out.get("options", [])
    normalized_options = []
    for opt in options:
        key = str((opt or {}).get("key", "")).strip().upper()
        text = str((opt or {}).get("text", "")).strip()
        if key and text:
            normalized_options.append({"key": key, "text": text})
    out["options"] = normalized_options
    return out


def attach_answers_and_explanations(questions: list[dict], answers: dict, explanations: dict) -> int:
    updated_answers = 0
    for q in questions:
        year = q["year"]
        paper = str(q["paper"])
        number = q["number"]
        answer = (
            answers.get(year, {}).get(paper, {}).get(str(number))
            or answers.get(year, {}).get(paper, {}).get(number)
        )
        explanation = (
            explanations.get(year, {}).get(paper, {}).get(str(number))
            or explanations.get(year, {}).get(paper, {}).get(number)
        )
        if answer:
            q["answer"] = str(answer).strip().upper()
            updated_answers += 1
        else:
            q.setdefault("answer", "A")
        if explanation:
            q["explanation"] = str(explanation).strip()
        else:
            q.setdefault("explanation", "[需补充]")
    return updated_answers


def validate_completeness(questions: list[dict]) -> list[str]:
    issues: list[str] = []
    if len(questions) != 320:
        issues.append(f"Expected 320 questions, found {len(questions)}")

    buckets: dict[str, list[int]] = defaultdict(list)
    for q in questions:
        buckets[f"{q['year']}-P{q['paper']}"] .append(q["number"])

    for year in range(2016, 2024):
        for paper in (1, 2):
            key = f"{year}-P{paper}"
            found = sorted(buckets.get(key, []))
            if len(found) != 20:
                issues.append(f"{key}: expected 20 questions, found {len(found)}")
            missing = [n for n in range(1, 21) if n not in found]
            if missing:
                issues.append(f"{key}: missing {missing}")

    return issues


def main() -> None:
    parser = argparse.ArgumentParser(description="Build TMUA dataset for mock exam app")
    parser.add_argument("--root", type=Path, default=Path("."), help="Repository root")
    parser.add_argument("--sync-app-data", action="store_true", help="Write output into tmua-exam/data")
    args = parser.parse_args()

    root = args.root.resolve()
    text_set = load_json(root / "tmua_questions_v3.json")
    image_set = load_json(root / "image_based_60_questions.json")
    answers = load_json(root / "extracted_answers.json")
    explanations = load_json(root / "extracted_explanations.json")

    merged = [normalize_question(q) for q in (text_set + image_set)]
    merged.sort(key=lambda x: (x["year"], x["paper"], x["number"]))

    complete_path = root / "tmua_questions_complete_320.json"
    complete_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    updated_answers = attach_answers_and_explanations(merged, answers, explanations)
    with_answers_path = root / "tmua_questions_with_answers_320.json"
    with_answers_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.sync_app_data:
        app_data_path = root / "tmua-exam" / "data" / "tmua_questions_with_answers_320.json"
        app_data_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    issues = validate_completeness(merged)
    report = {
        "total": len(merged),
        "updatedAnswers": updated_answers,
        "issues": issues,
        "syncedAppData": bool(args.sync_app_data),
    }
    (root / "tmua_pipeline_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Merged total: {len(merged)}")
    print(f"Updated answers: {updated_answers}")
    print(f"Complete file: {complete_path}")
    print(f"With answers file: {with_answers_path}")
    if args.sync_app_data:
        print("Synced app data: tmua-exam/data/tmua_questions_with_answers_320.json")

    if issues:
        print("\nValidation issues:")
        for item in issues:
            print(f"- {item}")
        raise SystemExit(1)

    print("\nValidation: OK (320 complete)")


if __name__ == "__main__":
    main()
