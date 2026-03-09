#!/usr/bin/env python3
"""Debug: Check PDF text structure"""
import pdfplumber
from pathlib import Path

pdf_path = Path('/Users/moji/Desktop/tmua/TMUA-2023-paper-1.pdf')

with pdfplumber.open(pdf_path) as pdf:
    # Print first 3 pages text
    for i, page in enumerate(pdf.pages[:3]):
        print(f"\n{'='*60}")
        print(f"PAGE {i+1}")
        print('='*60)
        text = page.extract_text()
        print(text[:2000])  # First 2000 chars
