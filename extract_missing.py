#!/usr/bin/env python3
"""Manual extraction helper - output missing questions for manual review"""
import pdfplumber
import json
from pathlib import Path

# Missing questions map
MISSING = {
    '2016-P2': list(range(1, 21)),
    '2017-P1': list(range(1, 21)),
    '2017-P2': [10],
    '2018-P1': [10],
    '2018-P2': [18],
    '2019-P1': [1, 9, 14],
    '2019-P2': [3, 8],
    '2020-P2': [13, 20],
    '2021-P2': [16],
    '2022-P1': [4, 17, 20],
    '2022-P2': [11],
}

def find_question_text(pdf_path, q_num):
    """Try to find question text around question number"""
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n"
        
        # Search for question number context
        import re
        patterns = [
            rf'({q_num-1}\s+.{{200,400}}\n{q_num}\s+.{{200,800}}\n{q_num+1})',
            rf'(\n{q_num}\s+.{{500,1500}})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, full_text, re.DOTALL)
            if match:
                return match.group(0)
        
        return None

def main():
    pdf_dir = Path('/Users/moji/Desktop/tmua')
    output = []
    
    for paper_key, q_nums in MISSING.items():
        year, paper = paper_key.split('-P')
        pdf_name = f"TMUA-{year}-paper-{paper}.pdf"
        pdf_path = pdf_dir / pdf_name
        
        if not pdf_path.exists():
            continue
        
        print(f"\n{'='*60}")
        print(f"Checking {paper_key}: Questions {q_nums}")
        print('='*60)
        
        for q_num in q_nums:
            text = find_question_text(pdf_path, q_num)
            if text:
                print(f"\nQ{q_num} context found:")
                print(text[:500])
                output.append({
                    'paper': paper_key,
                    'question': q_num,
                    'context': text[:1000]
                })
            else:
                print(f"\nQ{q_num}: NOT FOUND")
    
    # Save to file
    output_file = pdf_dir / 'missing_questions_raw.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n\n✓ Saved to: {output_file}")
    print("手动编辑此文件以补全题目")

if __name__ == '__main__':
    main()
