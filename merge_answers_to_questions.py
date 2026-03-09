#!/usr/bin/env python3
"""将答案和解析合并到完整题库"""
import json
from pathlib import Path

# 加载题库
with open('/Users/moji/Desktop/tmua/tmua_questions_complete_320.json') as f:
    questions = json.load(f)

# 加载答案
with open('/Users/moji/Desktop/tmua/extracted_answers.json') as f:
    answers = json.load(f)

# 加载解析
with open('/Users/moji/Desktop/tmua/extracted_explanations.json') as f:
    explanations = json.load(f)

# 合并
updated_count = 0
for q in questions:
    year = q['year']
    paper = str(q['paper'])
    number = q['number']
    
    # 更新答案
    if year in answers and paper in answers[year]:
        if number in answers[year][paper]:
            q['answer'] = answers[year][paper][number]
            updated_count += 1
        elif str(number) in answers[year][paper]:
            q['answer'] = answers[year][paper][str(number)]
            updated_count += 1
    
    # 更新解析
    if year in explanations and paper in explanations[year]:
        if number in explanations[year][paper]:
            q['explanation'] = explanations[year][paper][number]
        elif str(number) in explanations[year][paper]:
            q['explanation'] = explanations[year][paper][str(number)]

# 保存
output_file = Path('/Users/moji/Desktop/tmua/tmua_questions_with_answers_320.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f"✓ 已更新 {updated_count} 题答案")
print(f"✓ 保存至: {output_file}")

# 统计
has_answer = sum(1 for q in questions if q.get('answer') != 'A')
has_explanation = sum(1 for q in questions if q.get('explanation') and '[需' not in q['explanation'])
print(f"\n统计：")
print(f"  有答案: {has_answer}/320 题")
print(f"  有解析: {has_explanation}/320 题")
