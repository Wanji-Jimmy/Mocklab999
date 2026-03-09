#!/usr/bin/env python3
"""手动提取零散缺失的15题"""
import pdfplumber
from pathlib import Path
import json
import re

# 缺失题目列表
MISSING = {
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

def extract_question_raw(pdf_path, question_num):
    """提取指定题号的原始文本（放宽匹配条件）"""
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n\n"
        
        # 多种题号匹配模式
        patterns = [
            rf'\n\s*{question_num}\s+([A-Z\u222b\(])',  # 标准：数字+空格+字母
            rf'\n\s*{question_num}\.\s+',  # 带点：数字.
            rf'\n\s*{question_num}\)\s+',  # 带括号：数字)
            rf'Question\s+{question_num}\s*[:\.]',  # Question 10:
            rf'\n{question_num}\s*\n',  # 独立行
        ]
        
        for pattern in patterns:
            matches = list(re.finditer(pattern, full_text, re.IGNORECASE))
            if matches:
                start = matches[0].start()
                
                # 找下一题的位置
                next_q = question_num + 1
                next_patterns = [
                    rf'\n\s*{next_q}\s+[A-Z\u222b\(]',
                    rf'\n\s*{next_q}\.\s+',
                    rf'Question\s+{next_q}',
                ]
                
                end = len(full_text)
                for np in next_patterns:
                    next_matches = list(re.finditer(np, full_text[start+10:], re.IGNORECASE))
                    if next_matches:
                        end = start + 10 + next_matches[0].start()
                        break
                
                question_text = full_text[start:end].strip()
                
                # 清理题号行
                question_text = re.sub(rf'^\s*{question_num}[\.\)]*\s*', '', question_text)
                
                return question_text
        
        return None

def parse_question_manual(text, year, paper, number):
    """手动解析题目文本"""
    if not text:
        return None
    
    # 多种选项分离模式
    option_patterns = [
        r'\n\s*([A-G])\s+([A-Z0-9\-−])',  # A 选项内容（选项开头是大写或数字）
        r'\n([A-G])\s+',  # 更宽松：A 后面有空格
        r'([A-G])\s+[0-9\-]',  # A 123
    ]
    
    option_match = None
    for pattern in option_patterns:
        option_match = re.search(pattern, text)
        if option_match:
            break
    
    if not option_match:
        print(f"  ⚠ 无法识别选项起始位置: {year}-P{paper}-Q{number}")
        return {
            'year': year,
            'paper': paper,
            'number': number,
            'stem': text[:300].strip(),
            'options': [],
            'answer': 'A',
            'explanation': '[需人工补充]'
        }
    
    stem = text[:option_match.start()].strip()
    options_text = text[option_match.start():]
    
    # 解析选项（更宽松）
    options = []
    option_split_pattern = r'(?=\n[A-G]\s)'
    parts = re.split(option_split_pattern, '\n' + options_text)
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # 提取选项标签
        key_match = re.match(r'^([A-G])\s+(.+)', part, re.DOTALL)
        if key_match:
            options.append({
                'key': key_match.group(1),
                'text': key_match.group(2).strip()
            })
    
    if len(options) < 4:
        print(f"  ⚠ 选项不足4个: {year}-P{paper}-Q{number} (找到{len(options)}个)")
    
    return {
        'year': year,
        'paper': paper,
        'number': number,
        'stem': stem,
        'options': options,
        'answer': 'A',
        'explanation': '[需人工补充]'
    }

# 处理所有缺失题目
pdf_dir = Path('/Users/moji/Desktop/tmua')
extracted = []

for paper_key, q_nums in sorted(MISSING.items()):
    year, paper = paper_key.split('-P')
    pdf_name = f"TMUA-{year}-paper-{paper}.pdf"
    pdf_path = pdf_dir / pdf_name
    
    if not pdf_path.exists():
        print(f"⚠ PDF不存在: {pdf_name}")
        continue
    
    print(f"\n处理: {pdf_name}")
    
    for q_num in q_nums:
        print(f"  提取 Q{q_num}...", end=' ')
        
        raw_text = extract_question_raw(pdf_path, q_num)
        
        if raw_text:
            question = parse_question_manual(raw_text, year, int(paper), q_num)
            if question:
                extracted.append(question)
                print(f"✓ (题干{len(question['stem'])}字, {len(question['options'])}选项)")
            else:
                print(f"✗ 解析失败")
        else:
            print(f"✗ 未找到")

# 保存结果
output_file = pdf_dir / 'missing_15_extracted.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(extracted, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"✓ 成功提取: {len(extracted)}/15 题")
print(f"✓ 保存至: {output_file}")
print(f"\n需手动校验和补充答案")
