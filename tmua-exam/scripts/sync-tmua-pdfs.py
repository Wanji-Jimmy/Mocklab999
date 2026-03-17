#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = ROOT / "public" / "admissions" / "tmua"
DATA_ROOT = ROOT / "data" / "admissions"
PAGE_URL = "https://esat-tmua.ac.uk/tmua-preparation-materials/"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


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
    normalized = re.sub(r"[^A-Za-z0-9._-]+", "-", value)
    normalized = re.sub(r"-{2,}", "-", normalized)
    return normalized.strip("-").lower()


def extract_links() -> List[str]:
    html = fetch_bytes(PAGE_URL).decode("utf-8", "ignore")
    hrefs = re.findall(r'href="([^"]+\.pdf[^"]*)"', html, flags=re.I)
    return sorted(dict.fromkeys(urllib.parse.urljoin(PAGE_URL, href) for href in hrefs))


def infer_year(title: str) -> int | None:
    match = re.search(r"(19|20)\d{2}", title)
    return int(match.group(0)) if match else None


def classify_type(title: str) -> str:
    lower = title.lower()
    if "answer-key" in lower or "answer-keys" in lower:
        return "answer-key"
    if "worked-answers" in lower:
        return "worked-answer"
    if "specimen" in lower:
        return "specimen"
    if "paper-1" in lower:
        return "paper-1"
    if "paper-2" in lower:
        return "paper-2"
    return "document"


def infer_category(title: str, year: int | None) -> str:
    if "specimen" in title.lower():
        return "specimen"
    if year is not None:
        return str(year)
    return "general"


def infer_sort_order(material_type: str) -> int:
    order = {
        "paper-1": 10,
        "worked-answer-paper-1": 20,
        "paper-2": 30,
        "worked-answer-paper-2": 40,
        "answer-key": 50,
        "specimen": 60,
        "document": 70,
    }
    return order.get(material_type, 90)


def build_item(url: str, size_bytes: int) -> Dict[str, object]:
    title = Path(urllib.parse.urlsplit(url).path).name
    title = re.sub(r"\.pdf$", "", title, flags=re.I)
    year = infer_year(title)
    material_type = classify_type(title)

    if material_type == "worked-answer":
        if "paper-1" in title.lower():
            material_type = "worked-answer-paper-1"
        elif "paper-2" in title.lower():
            material_type = "worked-answer-paper-2"

    category = infer_category(title, year)
    filename = slugify(title) + ".pdf"

    if category == "specimen":
        relative_path = Path("specimen") / filename
    elif year is not None:
        relative_path = Path(str(year)) / filename
    else:
        relative_path = Path(filename)

    return {
        "id": slugify(f"tmua-{title}"),
        "exam": "tmua",
        "title": title.replace("-", " "),
        "year": year,
        "category": category,
        "subcategory": None,
        "type": material_type,
        "sourceUrl": url,
        "publicUrl": f"/admissions/tmua/{relative_path.as_posix()}",
        "relativePath": f"tmua/{relative_path.as_posix()}",
        "sizeBytes": size_bytes,
        "sortOrder": infer_sort_order(material_type),
    }


def sync_tmua() -> Dict[str, object]:
    links = extract_links()
    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)

    items: List[Dict[str, object]] = []
    total_bytes = 0

    for index, url in enumerate(links, start=1):
        title = Path(urllib.parse.urlsplit(url).path).name
        title = re.sub(r"\.pdf$", "", title, flags=re.I)
        year = infer_year(title)
        category = infer_category(title, year)
        filename = slugify(title) + ".pdf"

        if category == "specimen":
            destination = PUBLIC_ROOT / "specimen" / filename
        elif year is not None:
            destination = PUBLIC_ROOT / str(year) / filename
        else:
            destination = PUBLIC_ROOT / filename

        destination.parent.mkdir(parents=True, exist_ok=True)

        if destination.exists():
            content = destination.read_bytes()
        else:
            content = fetch_bytes(url)
            destination.write_bytes(content)

        total_bytes += len(content)
        items.append(build_item(url, len(content)))

        if index % 10 == 0 or index == len(links):
            print(f"[tmua] {index}/{len(links)} downloaded", file=sys.stderr)

    items.sort(key=lambda item: (str(item["category"]), int(item.get("sortOrder", 90)), str(item["title"])))

    manifest = {
        "exam": "tmua",
        "sourcePage": PAGE_URL,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(items),
        "totalBytes": total_bytes,
        "items": items,
    }

    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    (DATA_ROOT / "tmua-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> int:
    manifest = sync_tmua()
    print(json.dumps({"exam": manifest["exam"], "count": manifest["count"], "totalBytes": manifest["totalBytes"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
