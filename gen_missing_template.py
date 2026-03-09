#!/usr/bin/env python3
"""Generate template for manual completion of missing questions"""
import json

# Missing questions
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

template = []
for paper_key, q_nums in sorted(MISSING.items()):
    year, paper = paper_key.split('-P')
    for q_num in q_nums:
        template.append({
            'year': year,
            'paper': int(paper),
            'number': q_num,
            'stem': f'[从PDF复制题干] Paper {paper} Question {q_num}',
            'options': [
                {'key': 'A', 'text': '[选项A]'},
                {'key': 'B', 'text': '[选项B]'},
                {'key': 'C', 'text': '[选项C]'},
                {'key': 'D', 'text': '[选项D]'},
                {'key': 'E', 'text': '[选项E]'},
            ],
            'answer': 'A',
            'explanation': '[解析]',
        })

with open('/Users/moji/Desktop/tmua/missing_questions_template.json', 'w') as f:
    json.dump(template, f, indent=2, ensure_ascii=False)

print(f"✓ 已生成模板: 75 题待补全")
print("✓ 文件: /Users/moji/Desktop/tmua/missing_questions_template.json")
print("\n手动编辑此文件，从PDF复制内容替换占位符")
