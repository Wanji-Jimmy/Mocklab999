#!/usr/bin/env python3
"""Convert TMUA PDFs to LaTeX using Pix2Text"""
from pix2text import Pix2Text
from pathlib import Path
import json

# Initialize Pix2Text (will download models on first run)
p2t = Pix2Text.from_config()

pdf_dir = Path('/Users/moji/Desktop/tmua')
output = []

# Process missing PDFs first
PRIORITY_PDFS = [
    'TMUA-2016-paper-2.pdf',
    'TMUA-2017-paper-1.pdf',
]

for pdf_name in PRIORITY_PDFS:
    pdf_path = pdf_dir / pdf_name
    if not pdf_path.exists():
        continue
    
    print(f"\n处理: {pdf_name}")
    
    try:
        # Convert PDF to LaTeX
        result = p2t.recognize_pdf(str(pdf_path), page_numbers=None)
        
        # Save raw result
        output_file = pdf_dir / f"{pdf_name.replace('.pdf', '_latex.json')}"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"✓ 已保存: {output_file}")
        
    except Exception as e:
        print(f"✗ 错误: {e}")

print("\n完成！检查输出文件手动提取题目。")
