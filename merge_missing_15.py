#!/usr/bin/env python3
"""合并缺失的15题到主题库"""
import json
from pathlib import Path

# 加载现有题库
with open('/Users/moji/Desktop/tmua/tmua_questions_v2.json') as f:
    existing = json.load(f)

# 加载新提取的15题
with open('/Users/moji/Desktop/tmua/missing_15_extracted.json') as f:
    missing_15 = json.load(f)

# 转换格式
for q in missing_15:
    # 转换选项格式
    new_options = []
    for opt in q['options']:
        new_options.append({
            'key': opt['key'],
            'text': opt['text']
        })
    q['options'] = new_options

# 合并
all_questions = existing + missing_15

# 按年份、paper、题号排序
all_questions.sort(key=lambda x: (x['year'], x['paper'], x['number']))

# 保存
output_file = Path('/Users/moji/Desktop/tmua/tmua_questions_v3.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_questions, f, indent=2, ensure_ascii=False)

print(f"✓ 原有题目: {len(existing)}")
print(f"✓ 新增题目: {len(missing_15)}")
print(f"✓ 合并后: {len(all_questions)}")
print(f"✓ 保存至: {output_file}")

# 验证完整性
from collections import defaultdict
by_paper = defaultdict(list)
for q in all_questions:
    key = f"{q['year']}-P{q['paper']}"
    by_paper[key].append(q['number'])

print(f"\n完整性校验:")
missing_count = 0
for year in range(2016, 2024):
    for paper in [1, 2]:
        key = f"{year}-P{paper}"
        if key in by_paper:
            found = sorted(by_paper[key])
            missing = [i for i in range(1, 21) if i not in found]
            if missing:
                print(f"  {key}: 缺失 {missing}")
                missing_count += len(missing)
            else:
                print(f"  {key}: ✓")
        else:
            print(f"  {key}: ✗ 完全缺失")
            missing_count += 20

print(f"\n总计仍缺失: {missing_count} 题")
