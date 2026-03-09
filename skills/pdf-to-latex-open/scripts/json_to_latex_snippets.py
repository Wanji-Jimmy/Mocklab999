#!/usr/bin/env python3
"""Render extracted JSON questions into simple LaTeX snippet blocks."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def latex_escape(s: str) -> str:
    return (
        s.replace("\\", r"\textbackslash{}")
        .replace("&", r"\&")
        .replace("%", r"\%")
        .replace("$", r"\$")
        .replace("#", r"\#")
        .replace("_", r"\_")
        .replace("{", r"\{")
        .replace("}", r"\}")
    )


def read_questions(path: Path) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise SystemExit("Input JSON must be a list of question objects")
    return payload


def emit_tex(questions: list[dict]) -> str:
    lines = [r"\section*{Extracted Questions}"]
    for i, q in enumerate(questions, start=1):
        stem = q.get("stemLatex") or q.get("stem") or ""
        options = q.get("options", [])
        lines.append(rf"\subsection*{{Question {i}}}")
        lines.append(latex_escape(str(stem)))
        lines.append(r"\begin{itemize}")
        for opt in options:
            key = opt.get("key", "?")
            body = opt.get("latex") or opt.get("text") or ""
            lines.append(rf"\item [{latex_escape(str(key))}] {latex_escape(str(body))}")
        lines.append(r"\end{itemize}")
        lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert extracted question JSON to LaTeX snippets.")
    parser.add_argument("input", type=Path, help="Input JSON path")
    parser.add_argument("--out", type=Path, default=Path("questions_snippets.tex"), help="Output .tex path")
    args = parser.parse_args()

    questions = read_questions(args.input)
    tex = emit_tex(questions)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(tex, encoding="utf-8")
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
