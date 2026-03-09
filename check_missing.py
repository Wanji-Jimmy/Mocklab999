#!/usr/bin/env python3
import json
from pathlib import Path
from collections import defaultdict

# Load extracted questions
with open('/Users/moji/Desktop/tmua/tmua_questions_v2.json', 'r') as f:
    questions = json.load(f)

# Group by year and paper
by_paper = defaultdict(list)
for q in questions:
    key = f"{q['year']}-P{q['paper']}"
    by_paper[key].append(q['number'])

# Expected papers
expected = []
for year in range(2016, 2024):
    for paper in [1, 2]:
        expected.append(f"{year}-P{paper}")

print("缺失题目分析：\n")
print("=" * 60)

total_missing = 0
for paper_key in sorted(expected):
    if paper_key in by_paper:
        found = sorted(by_paper[paper_key])
        missing = [i for i in range(1, 21) if i not in found]
        
        if missing:
            print(f"\n{paper_key}: 缺失 {len(missing)} 题")
            print(f"  已提取: {found}")
            print(f"  缺失: {missing}")
            total_missing += len(missing)
        else:
            print(f"\n{paper_key}: ✓ 完整 (20/20)")
    else:
        print(f"\n{paper_key}: ✗ 完全缺失 (0/20)")
        total_missing += 20

print("\n" + "=" * 60)
print(f"\n总计缺失: {total_missing} 题")
print(f"成功提取: {len(questions)} 题")
print(f"完成率: {len(questions)/(16*20)*100:.1f}%")
