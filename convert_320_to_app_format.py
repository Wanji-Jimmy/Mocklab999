#!/usr/bin/env python3
"""将320题转换为应用格式"""
import json
from pathlib import Path

# 加载320题（带答案和解析）
with open('/Users/moji/Desktop/tmua/tmua_questions_with_answers_320.json') as f:
    questions = json.load(f)

# 转换为应用格式
app_questions = []

for q in questions:
    app_q = {
        'id': f"{q['year']}-P{q['paper']}-Q{q['number']}",
        'paper': q['paper'],
        'index': q['number'],
        'stemLatex': q['stem'],
        'options': [
            {'key': opt['key'], 'latex': opt.get('text', '')}
            for opt in q['options']
        ],
        'answerKey': q.get('answer', 'A'),
        'explanationLatex': q.get('explanation', '[需补充]'),
        'tags': [f"{q['year']}", f"Paper{q['paper']}"],
        'difficulty': 1
    }
    
    # 添加图片URL
    if 'imageUrl' in q:
        app_q['imageUrl'] = q['imageUrl']
    if 'imageUrls' in q:
        app_q['imageUrls'] = q['imageUrls']
    
    app_questions.append(app_q)

# 保存
output_file = Path('/Users/moji/Desktop/tmua/tmua-exam/lib/complete-questions.ts')
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("import { Question } from './types'\n\n")
    f.write("export const completeQuestions: Question[] = ")
    f.write(json.dumps(app_questions, indent=2, ensure_ascii=False))
    f.write("\n")

print(f"✓ 转换完成: {len(app_questions)} 题")
print(f"✓ 保存至: {output_file}")
