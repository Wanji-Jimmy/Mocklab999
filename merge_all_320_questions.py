#!/usr/bin/env python3
"""合并所有题目：260题文本 + 60题图片 = 320题完整题库"""
import json
from pathlib import Path
from collections import defaultdict

# 加载现有260题
with open('/Users/moji/Desktop/tmua/tmua_questions_v3.json') as f:
    existing_260 = json.load(f)

# 加载60题图片数据
with open('/Users/moji/Desktop/tmua/image_based_60_questions.json') as f:
    image_60 = json.load(f)

# 合并
all_questions = existing_260 + image_60

# 排序
all_questions.sort(key=lambda x: (x['year'], x['paper'], x['number']))

# 保存最终版本
output_file = Path('/Users/moji/Desktop/tmua/tmua_questions_complete_320.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_questions, f, indent=2, ensure_ascii=False)

print(f"✓ 原有题目: {len(existing_260)}")
print(f"✓ 图片题目: {len(image_60)}")
print(f"✓ 合并后: {len(all_questions)}")
print(f"✓ 保存至: {output_file}")

# 完整性校验
by_paper = defaultdict(list)
for q in all_questions:
    key = f"{q['year']}-P{q['paper']}"
    by_paper[key].append(q['number'])

print(f"\n完整性校验（320题）:")
missing_total = 0
for year in range(2016, 2024):
    for paper in [1, 2]:
        key = f"{year}-P{paper}"
        if key in by_paper:
            found = sorted(by_paper[key])
            missing = [i for i in range(1, 21) if i not in found]
            if missing:
                print(f"  {key}: ✗ 缺失 {missing}")
                missing_total += len(missing)
            else:
                print(f"  {key}: ✓ 完整 (20/20)")
        else:
            print(f"  {key}: ✗ 完全缺失")
            missing_total += 20

if missing_total == 0:
    print(f"\n{'='*50}")
    print(f"🎉 完美！320题全部完成，零缺失！")
    print(f"{'='*50}")
else:
    print(f"\n仍缺失: {missing_total} 题")
