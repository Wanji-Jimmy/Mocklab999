#!/usr/bin/env python3
"""Build TMUA mock-exam dataset from extracted artifacts."""
from __future__ import annotations

import argparse
import json
import re
import tomllib
from collections import defaultdict
from pathlib import Path
from typing import Any

CONTROL_CHARS_RE = re.compile(r"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]")
PRIVATE_USE_RE = re.compile(r"[\uE000-\uF8FF]")


DEFAULT_CONFIG: dict[str, str] = {
    "text_questions": "tmua_questions_v3.json",
    "image_questions": "image_based_60_questions.json",
    "answers": "extracted_answers.json",
    "explanations": "extracted_explanations.json",
    "complete_output": "tmua_questions_complete_320.json",
    "with_answers_output": "tmua_questions_with_answers_320.json",
    "report_output": "tmua_pipeline_report.json",
    "app_sync_output": "tmua-exam/data/tmua_questions_with_answers_320.json",
}


def load_json(path: Path) -> Any:
    if not path.exists():
        raise SystemExit(f"Missing required file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_pipeline_config(root: Path, config_path: Path | None) -> dict[str, str]:
    cfg = dict(DEFAULT_CONFIG)
    if not config_path:
        return cfg

    target = config_path if config_path.is_absolute() else root / config_path
    if not target.exists():
        raise SystemExit(f"Config file not found: {target}")

    parsed = tomllib.loads(target.read_text(encoding="utf-8"))
    paths = parsed.get("paths", {})
    if not isinstance(paths, dict):
        raise SystemExit("Invalid config: [paths] table is required")

    for key in DEFAULT_CONFIG:
        value = paths.get(key)
        if value:
            cfg[key] = str(value)
    return cfg


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
    fatal_issues: list[str] = []
    if len(questions) != 320:
        fatal_issues.append(f"Expected 320 questions, found {len(questions)}")

    buckets: dict[str, list[int]] = defaultdict(list)
    for q in questions:
        buckets[f"{q['year']}-P{q['paper']}"].append(q["number"])

    for year in range(2016, 2024):
        for paper in (1, 2):
            key = f"{year}-P{paper}"
            found = sorted(buckets.get(key, []))
            if len(found) != 20:
                fatal_issues.append(f"{key}: expected 20 questions, found {len(found)}")
            missing = [n for n in range(1, 21) if n not in found]
            if missing:
                fatal_issues.append(f"{key}: missing {missing}")

    return fatal_issues


def validate_quality(questions: list[dict]) -> list[str]:
    warnings: list[str] = []
    for q in questions:
        qid = f"{q.get('year', 'unknown')}-P{q.get('paper', '?')}-Q{q.get('number', '?')}"
        options = q.get("options", [])
        keys = [str(opt.get("key", "")).strip().upper() for opt in options]
        if len(options) < 2:
            warnings.append(f"{qid}: less than 2 options")
        if len(set(keys)) != len(keys):
            warnings.append(f"{qid}: duplicate option keys")

        answer = str(q.get("answer", "")).strip().upper()
        if answer and answer not in keys:
            warnings.append(f"{qid}: answer key '{answer}' not in options")

        text_blob = f"{q.get('stem', '')} {q.get('explanation', '')} " + " ".join(
            str(opt.get("text", "")) for opt in options
        )
        if CONTROL_CHARS_RE.search(text_blob):
            warnings.append(f"{qid}: contains control characters")
        if PRIVATE_USE_RE.search(text_blob):
            warnings.append(f"{qid}: contains private-use glyphs")

    return warnings


def apply_autofixes(questions: list[dict]) -> dict[str, int]:
    stats = {
        "dedupedOptions": 0,
        "fixedAnswerKey": 0,
        "strippedControlChars": 0,
        "strippedPrivateUseGlyphs": 0,
    }
    for q in questions:
        seen: set[str] = set()
        deduped: list[dict] = []
        for opt in q.get("options", []):
            key = str(opt.get("key", "")).strip().upper()
            text = str(opt.get("text", ""))
            if not key or key in seen:
                stats["dedupedOptions"] += 1
                continue
            seen.add(key)
            deduped.append({"key": key, "text": text})
        q["options"] = deduped

        for field in ("stem", "explanation"):
            original = str(q.get(field, ""))
            cleaned = CONTROL_CHARS_RE.sub("", original)
            if cleaned != original:
                stats["strippedControlChars"] += 1
            cleaned2 = PRIVATE_USE_RE.sub("", cleaned)
            if cleaned2 != cleaned:
                stats["strippedPrivateUseGlyphs"] += 1
            q[field] = cleaned2

        keys = [str(opt.get("key", "")).strip().upper() for opt in q.get("options", [])]
        answer = str(q.get("answer", "")).strip().upper()
        if keys and answer not in keys:
            q["answer"] = keys[0]
            stats["fixedAnswerKey"] += 1

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Build TMUA dataset for mock exam app")
    parser.add_argument("--root", type=Path, default=Path("."), help="Repository root")
    parser.add_argument("--sync-app-data", action="store_true", help="Write output into tmua-exam/data")
    parser.add_argument("--config", type=Path, help="Pipeline TOML config path")
    parser.add_argument("--autofix", action="store_true", help="Auto-fix common non-fatal quality issues")
    args = parser.parse_args()

    root = args.root.resolve()
    config = load_pipeline_config(root, args.config)
    text_set = load_json(root / config["text_questions"])
    image_set = load_json(root / config["image_questions"])
    answers = load_json(root / config["answers"])
    explanations = load_json(root / config["explanations"])

    merged = [normalize_question(q) for q in (text_set + image_set)]
    merged.sort(key=lambda x: (x["year"], x["paper"], x["number"]))

    complete_path = root / config["complete_output"]
    complete_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    updated_answers = attach_answers_and_explanations(merged, answers, explanations)
    if args.autofix:
        autofix_stats = apply_autofixes(merged)
    else:
        autofix_stats = {}

    with_answers_path = root / config["with_answers_output"]
    with_answers_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.sync_app_data:
        app_data_path = root / config["app_sync_output"]
        app_data_path.parent.mkdir(parents=True, exist_ok=True)
        app_data_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    fatal_issues = validate_completeness(merged)
    warnings = validate_quality(merged)
    report = {
        "total": len(merged),
        "updatedAnswers": updated_answers,
        "fatalIssues": fatal_issues,
        "warnings": warnings,
        "autofixApplied": bool(args.autofix),
        "autofixStats": autofix_stats,
        "config": config,
        "syncedAppData": bool(args.sync_app_data),
    }
    (root / config["report_output"]).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Merged total: {len(merged)}")
    print(f"Updated answers: {updated_answers}")
    print(f"Complete file: {complete_path}")
    print(f"With answers file: {with_answers_path}")
    if args.sync_app_data:
        print("Synced app data: tmua-exam/data/tmua_questions_with_answers_320.json")

    if warnings:
        print(f"Warnings: {len(warnings)} (non-fatal)")
        for item in warnings[:10]:
            print(f"- {item}")
        if len(warnings) > 10:
            print(f"- ... and {len(warnings) - 10} more")

    if fatal_issues:
        print("\nFatal validation issues:")
        for item in fatal_issues:
            print(f"- {item}")
        raise SystemExit(1)

    print("\nValidation: OK (fatal checks passed)")


if __name__ == "__main__":
    main()
