#!/usr/bin/env python3
"""Convert PDF pages to images for manual review"""
import pdfplumber
from pathlib import Path
from PIL import Image

def pdf_to_images(pdf_path, output_dir):
    """Convert each page to image"""
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            img = page.to_image(resolution=150)
            img_path = output_dir / f"page_{i:03d}.png"
            img.save(img_path)
            print(f"Saved {img_path.name}")

# Convert missing question PDFs
MISSING_PDFS = [
    'TMUA-2016-paper-2.pdf',
    'TMUA-2017-paper-1.pdf',
]

for pdf_name in MISSING_PDFS:
    pdf_path = Path('/Users/moji/Desktop/tmua') / pdf_name
    if pdf_path.exists():
        output_dir = Path('/Users/moji/Desktop/tmua/images') / pdf_name.replace('.pdf', '')
        print(f"\n处理: {pdf_name}")
        pdf_to_images(pdf_path, output_dir)
