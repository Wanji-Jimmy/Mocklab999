#!/usr/bin/env python3
"""为2016-P1/P2和2017-P1生成基于图片的题目数据"""
import json
from pathlib import Path

# 页面到题号的映射（根据TMUA试卷结构）
# 通常：封面2页，说明1页，题目从第3页开始，每页约2-3题
PAGE_TO_QUESTIONS = {
    '2016-1': {
        'page_03.png': [1],
        'page_04.png': [2],
        'page_05.png': [3],
        'page_06.png': [4, 5],
        'page_07.png': [6],
        'page_08.png': [7, 8],
        'page_09.png': [9],
        'page_10.png': [10, 11],
        'page_11.png': [12],
        'page_12.png': [13, 14],
        'page_13.png': [15],
        'page_14.png': [16, 17],
        'page_15.png': [18],
        'page_16.png': [19, 20],
    },
    '2016-2': {
        'page_03.png': [1],
        'page_04.png': [2],
        'page_05.png': [3],
        'page_06.png': [4],
        'page_07.png': [5, 6],
        'page_08.png': [7],
        'page_09.png': [8, 9],
        'page_10.png': [10],
        'page_11.png': [11, 12],
        'page_12.png': [13],
        'page_13.png': [14, 15],
        'page_14.png': [16],
        'page_15.png': [17, 18],
        'page_16.png': [19],
        'page_17.png': [20],
    },
    '2017-1': {
        'page_04.png': [1],
        'page_05.png': [2],
        'page_06.png': [3],
        'page_07.png': [4],
        'page_08.png': [5, 6],
        'page_09.png': [7],
        'page_10.png': [8],
        'page_11.png': [9, 10],
        'page_12.png': [11],
        'page_13.png': [12],
        'page_14.png': [13, 14],
        'page_15.png': [15],
        'page_16.png': [16],
        'page_17.png': [17, 18],
        'page_18.png': [19],
        'page_19.png': [20],
    }
}

questions = []

for paper_key, page_map in PAGE_TO_QUESTIONS.items():
    year, paper = paper_key.split('-')
    
    for page_file, q_nums in page_map.items():
        for q_num in q_nums:
            questions.append({
                'year': f'201{year}' if year in ['6', '7'] else year,
                'paper': int(paper),
                'number': q_num,
                'stem': f'[Question {q_num} - See image]',
                'imageUrl': f'/TMUA-20{year}-paper-{paper}/{page_file}',
                'options': [
                    {'key': 'A', 'text': '[See image]'},
                    {'key': 'B', 'text': '[See image]'},
                    {'key': 'C', 'text': '[See image]'},
                    {'key': 'D', 'text': '[See image]'},
                    {'key': 'E', 'text': '[See image]'},
                ],
                'answer': 'A',
                'explanation': '[需查看答案卷]'
            })

# 排序
questions.sort(key=lambda x: (x['year'], x['paper'], x['number']))

# 保存
output_file = Path('/Users/moji/Desktop/tmua/image_based_60_questions.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f"✓ 生成 {len(questions)} 题（基于图片）")
print(f"✓ 保存至: {output_file}")

# 验证数量
by_paper = {}
for q in questions:
    key = f"{q['year']}-P{q['paper']}"
    by_paper[key] = by_paper.get(key, 0) + 1

print(f"\n分布:")
for key, count in sorted(by_paper.items()):
    print(f"  {key}: {count} 题")
