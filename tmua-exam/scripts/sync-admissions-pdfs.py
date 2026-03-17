#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "public" / "admissions"
DATA_ROOT = ROOT / "data" / "admissions"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

SOURCES: Dict[str, Dict[str, str]] = {
    "step": {
        "page_url": "https://www.physicsandmathstutor.com/admissions/step/",
        "download_prefix": "https://pmt.physicsandmathstutor.com/download/Admissions/STEP/",
    },
    "mat": {
        "page_url": "https://www.physicsandmathstutor.com/admissions/mat/",
        "download_prefix": "https://pmt.physicsandmathstutor.com/download/Admissions/MAT/",
    },
}


def fetch_bytes(url: str) -> bytes:
    parsed = urllib.parse.urlsplit(url)
    safe_url = urllib.parse.urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            urllib.parse.quote(parsed.path),
            parsed.query,
            parsed.fragment,
        )
    )
    request = urllib.request.Request(safe_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def slugify(value: str) -> str:
    normalized = re.sub(r"%[0-9A-Fa-f]{2}", "", value)
    normalized = normalized.replace("&", " and ")
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized)
    return normalized.strip("-").lower()


def extract_links(page_url: str) -> List[str]:
    html = fetch_bytes(page_url).decode("utf-8", "ignore")
    hrefs = re.findall(r'href=["\\\']([^"\\\']+)["\\\']', html)
    results = []
    for href in hrefs:
        full = urllib.parse.urljoin(page_url, href)
        if ".pdf" not in full.lower():
            continue
        if "physicsandmathstutor.com/download/Admissions/" not in full:
            continue
        results.append(full)
    return sorted(dict.fromkeys(results))


def infer_year(title: str) -> int | None:
    match = re.search(r"(19|20)\d{2}", title)
    return int(match.group(0)) if match else None


def classify_type(title: str, category: str) -> str:
    lower = title.lower()
    if "report" in lower:
        return "report"
    if "solution" in lower or "answer" in lower or "hint" in lower:
        return "solution"
    if "specification" in lower or "formulae" in lower or "booklet" in lower:
        return "guide"
    if "specimen" in lower:
        return "specimen"
    if category == "papers":
        return "paper"
    return "document"


def build_item(exam: str, url: str, download_prefix: str, size_bytes: int) -> Dict[str, object]:
    relative = urllib.parse.unquote(url.replace(download_prefix, "", 1))
    path = Path(relative)
    parts = [slugify(part) for part in path.parts[:-1] if part]
    filename = slugify(path.stem) + path.suffix.lower()
    public_relative = Path(exam).joinpath(*parts, filename) if parts else Path(exam) / filename
    title = path.stem
    category = slugify(path.parts[0]) if len(path.parts) > 1 else "general"
    subcategory = slugify(path.parts[1]) if len(path.parts) > 2 else None
    item_id = slugify(f"{exam}-{category}-{title}")
    return {
        "id": item_id,
        "exam": exam,
        "title": title,
        "year": infer_year(title),
        "category": category,
        "subcategory": subcategory,
        "type": classify_type(title, category),
        "sourceUrl": url,
        "publicUrl": f"/admissions/{public_relative.as_posix()}",
        "relativePath": public_relative.as_posix(),
        "sizeBytes": size_bytes,
    }


def sync_exam(exam: str, config: Dict[str, str]) -> Dict[str, object]:
    page_url = config["page_url"]
    download_prefix = config["download_prefix"]
    links = extract_links(page_url)

    target_root = PUBLIC_ROOT / exam
    target_root.mkdir(parents=True, exist_ok=True)

    items: List[Dict[str, object]] = []
    total_bytes = 0

    for index, url in enumerate(links, start=1):
        relative = urllib.parse.unquote(url.replace(download_prefix, "", 1))
        path = Path(relative)
        parts = [slugify(part) for part in path.parts[:-1] if part]
        filename = slugify(path.stem) + path.suffix.lower()
        destination = target_root.joinpath(*parts, filename) if parts else target_root / filename
        destination.parent.mkdir(parents=True, exist_ok=True)

        if destination.exists():
            content = destination.read_bytes()
        else:
            content = fetch_bytes(url)
            destination.write_bytes(content)

        total_bytes += len(content)
        item = build_item(exam, url, download_prefix, len(content))
        items.append(item)

        if index % 25 == 0 or index == len(links):
            print(f"[{exam}] {index}/{len(links)} downloaded", file=sys.stderr)

    manifest = {
        "exam": exam,
        "sourcePage": page_url,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(items),
        "totalBytes": total_bytes,
        "items": items,
    }

    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    manifest_path = DATA_ROOT / f"{exam}-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Download STEP/MAT PDFs from Physics & Maths Tutor into the local app.")
    parser.add_argument("exam", choices=["step", "mat", "all"], help="Which exam library to sync.")
    args = parser.parse_args()

    targets = list(SOURCES.keys()) if args.exam == "all" else [args.exam]
    summaries = []
    for exam in targets:
        summaries.append(sync_exam(exam, SOURCES[exam]))

    print(json.dumps([{"exam": item["exam"], "count": item["count"], "totalBytes": item["totalBytes"]} for item in summaries], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
