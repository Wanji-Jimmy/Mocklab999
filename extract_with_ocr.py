#!/usr/bin/env python3
"""使用pytesseract OCR提取PDF内容"""
import pdfplumber
from pathlib import Path
import json
import re

def extract_text_aggressive(pdf_path):
    """使用多种方法提取文本"""
    texts = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # 方法1: 默认提取
            text = page.extract_text()
            if text:
                texts.append(text)
            
            # 方法2: 提取表格
            tables = page.extract_tables()
            for table in tables:
                if table:
                    texts.append('\n'.join([' | '.join(filter(None, row)) for row in table]))
            
            # 方法3: 提取单词（处理CID问题）
            words = page.extract_words()
            if words:
                page_text = ' '.join([w['text'] for w in words if 'cid' not in w['text'].lower()])
                texts.append(page_text)
    
    return '\n\n'.join(texts)

def parse_questions(full_text, year, paper):
    """解析题目"""
    questions = []
    
    # 按题号分割
    parts = re.split(r'\n\s*(\d+)\s+', full_text)
    
    for i in range(1, len(parts), 2):
        if i+1 >= len(parts):
            break
            
        q_num = int(parts[i])
        if q_num < 1 or q_num > 20:
            continue
        
        q_text = parts[i+1]
        
        # 分离题干和选项
        option_match = re.search(r'\n\s*([A-G])[\.:\s]+', q_text)
        if not option_match:
            continue
        
        stem = q_text[:option_match.start()].strip()
        options_text = q_text[option_match.start():]
        
        # 解析选项
        options = []
        for m in re.finditer(r'\n\s*([A-G])[\.:\s]+(.+?)(?=\n\s*[A-G][\.:\s]+|\Z)', options_text, re.DOTALL):
            options.append({
                'key': m.group(1),
                'text': m.group(2).strip()
            })
        
        if len(options) >= 4:  # 至少4个选项
            questions.append({
                'year': year,
                'paper': paper,
                'number': q_num,
                'stem': stem,
                'options': options,
                'answer': 'A',  # 占位
                'explanation': '[需补充]'
            })
    
    return questions

# 处理缺失的PDF
MISSING_PDFS = [
    ('TMUA-2016-paper-2.pdf', '2016', 2),
    ('TMUA-2017-paper-1.pdf', '2017', 1),
]

all_questions = []

for pdf_name, year, paper in MISSING_PDFS:
    pdf_path = Path('/Users/moji/Desktop/tmua') / pdf_name
    if not pdf_path.exists():
        continue
    
    print(f"处理: {pdf_name}")
    
    try:
        full_text = extract_text_aggressive(pdf_path)
        questions = parse_questions(full_text, year, paper)
        
        print(f"  提取: {len(questions)} 题")
        all_questions.extend(questions)
        
        # 保存原始文本用于调试
        debug_file = pdf_path.parent / f"{pdf_name.replace('.pdf', '_raw_text.txt')}"
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(full_text)
        
    except Exception as e:
        print(f"  错误: {e}")

# 保存结果
output_file = Path('/Users/moji/Desktop/tmua/ocr_extracted.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_questions, f, indent=2, ensure_ascii=False)

print(f"\n✓ 共提取 {len(all_questions)} 题")
print(f"✓ 保存至: {output_file}")
