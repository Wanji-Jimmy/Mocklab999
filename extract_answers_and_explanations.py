#!/usr/bin/env python3
"""从答案卷PDF提取答案和详解"""
import pdfplumber
from pathlib import Path
import json
import re

ANSWER_FILES = {
    '2016': '/Users/moji/Desktop/pdfs/TMUA-2016-answer-keys.pdf',
    '2017': '/Users/moji/Desktop/pdfs/TMUA-2017-answer-keys.pdf',
    '2018': '/Users/moji/Desktop/pdfs/TMUA-2018-answer-keys.pdf',
    '2019': '/Users/moji/Desktop/pdfs/TMUA-2019-answer-keys.pdf',
    '2020': '/Users/moji/Desktop/pdfs/TMUA-2020-answer-keys.pdf',
    '2021': '/Users/moji/Desktop/pdfs/TMUA-2021-answer-keys.pdf',
    '2022': '/Users/moji/Desktop/pdfs/TMUA-2022-answer-keys.pdf',
    '2023': '/Users/moji/Desktop/pdfs/TMUA-2023-answer-keys.pdf',
}

EXPLANATION_FILES = {
    '2016-1': '/Users/moji/Desktop/pdfs/TMUA-2016-paper-1-worked-answers.pdf',
    '2016-2': '/Users/moji/Desktop/pdfs/TMUA-2016-paper-2-worked-answers.pdf',
    '2017-1': '/Users/moji/Desktop/pdfs/TMUA-2017-paper-1-worked-answers.pdf',
    '2017-2': '/Users/moji/Desktop/pdfs/TMUA-2017-paper-2-worked-answers.pdf',
    '2018-1': '/Users/moji/Desktop/pdfs/TMUA-2018-paper-1-worked-answers.pdf',
    '2018-2': '/Users/moji/Desktop/pdfs/TMUA-2018-paper-2-worked-answers.pdf',
    '2019-2': '/Users/moji/Desktop/pdfs/TMUA-2019-paper-2-worked-answers.pdf',
    '2020-1': '/Users/moji/Desktop/pdfs/TMUA-2020-paper-1-worked-answers.pdf',
    '2020-2': '/Users/moji/Desktop/pdfs/TMUA-2020-paper-2-worked-answers.pdf',
    '2021-1': '/Users/moji/Desktop/pdfs/TMUA-2021-paper-1-worked-answers.pdf',
    '2021-2': '/Users/moji/Desktop/pdfs/TMUA-2021-paper-2-worked-answers.pdf',
    '2022-1': '/Users/moji/Desktop/pdfs/TMUA-2022-paper-1-worked-answers.pdf',
    '2022-2': '/Users/moji/Desktop/pdfs/TMUA-2022-paper-2-worked-answers.pdf',
    '2023-1': '/Users/moji/Desktop/pdfs/TMUA-2023-paper-1-worked-answers.pdf',
    '2023-2': '/Users/moji/Desktop/pdfs/TMUA-2023-paper-2-worked-answers.pdf',
}

def extract_answer_keys(pdf_path):
    """从答案卷提取答案（Paper 1和Paper 2各20题）"""
    answers = {'1': {}, '2': {}}
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            text = ''
            for page in pdf.pages:
                text += page.extract_text() or ''
            
            # 匹配模式：Q1-Q20 for Paper 1 and Paper 2
            # 通常格式：Question 1: A  或  1. B
            for paper in ['1', '2']:
                pattern = rf'Paper\s+{paper}.*?(?=Paper\s+[^{paper}]|\Z)'
                paper_section = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                
                if paper_section:
                    section_text = paper_section.group()
                    
                    # 提取每题答案
                    for q_num in range(1, 21):
                        # 多种答案格式
                        patterns = [
                            rf'{q_num}[\.:\s]+([A-G])',
                            rf'Question\s+{q_num}[\.:\s]+([A-G])',
                            rf'Q{q_num}[\.:\s]+([A-G])',
                        ]
                        
                        for pattern in patterns:
                            match = re.search(pattern, section_text, re.IGNORECASE)
                            if match:
                                answers[paper][q_num] = match.group(1).upper()
                                break
        
        return answers
    except Exception as e:
        print(f"  ⚠ 答案提取失败: {e}")
        return answers

def extract_explanations(pdf_path):
    """从详解PDF提取每题解析"""
    explanations = {}
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ''
            for page in pdf.pages:
                full_text += page.extract_text() or ''
            
            # 按题号分割
            parts = re.split(r'\n\s*(?:Question\s+)?(\d{1,2})[\.:\s]', full_text)
            
            for i in range(1, len(parts), 2):
                if i+1 >= len(parts):
                    break
                
                q_num = int(parts[i])
                if 1 <= q_num <= 20:
                    explanation = parts[i+1].strip()
                    # 取前500字符作为解析预览
                    explanations[q_num] = explanation[:500] + ('...' if len(explanation) > 500 else '')
        
        return explanations
    except Exception as e:
        print(f"  ⚠ 解析提取失败: {e}")
        return {}

# 提取所有答案
all_answers = {}
all_explanations = {}

print("提取答案...")
for year, answer_file in sorted(ANSWER_FILES.items()):
    if Path(answer_file).exists():
        print(f"  {year}年...")
        answers = extract_answer_keys(answer_file)
        all_answers[year] = answers
    else:
        print(f"  ⚠ {year}年答案卷不存在")

print("\n提取详解...")
for key, exp_file in sorted(EXPLANATION_FILES.items()):
    if Path(exp_file).exists():
        year, paper = key.split('-')
        print(f"  {year}年-Paper{paper}...")
        explanations = extract_explanations(exp_file)
        if year not in all_explanations:
            all_explanations[year] = {}
        all_explanations[year][paper] = explanations
    else:
        print(f"  ⚠ {key}详解不存在")

# 保存结果
output_dir = Path('/Users/moji/Desktop/tmua')
with open(output_dir / 'extracted_answers.json', 'w') as f:
    json.dump(all_answers, f, indent=2, ensure_ascii=False)

with open(output_dir / 'extracted_explanations.json', 'w') as f:
    json.dump(all_explanations, f, indent=2, ensure_ascii=False)

print(f"\n✓ 答案已保存: extracted_answers.json")
print(f"✓ 解析已保存: extracted_explanations.json")

# 统计
total_answers = sum(len(papers['1']) + len(papers['2']) for papers in all_answers.values())
total_explanations = sum(
    sum(len(exps) for exps in year_exps.values()) 
    for year_exps in all_explanations.values()
)
print(f"\n统计：")
print(f"  答案: {total_answers} 题")
print(f"  解析: {total_explanations} 题")
