#!/usr/bin/env python3
"""Convert extracted questions to app format"""
import json

# Load extracted questions
with open('/Users/moji/Desktop/tmua/tmua_questions_v2.json', 'r') as f:
    questions = json.load(f)

# Convert to app format
app_questions = []
for q in questions:
    # Convert to LaTeX-style text (basic conversion)
    app_questions.append({
        'paper': q['paper'],
        'index': q['number'] - 1,  # 0-indexed
        'stemLatex': q['stem'],
        'options': [{'key': opt['key'], 'latex': opt['text']} for opt in q['options']],
        'answerKey': 'A',  # Placeholder - need answer key
        'explanationLatex': 'Explanation needed',
        'tags': [f"{q['year']}", f"paper{q['paper']}"],
        'difficulty': 2,
    })

# Save
output = '/Users/moji/Desktop/tmua/tmua-exam/lib/real-questions.ts'
with open(output, 'w', encoding='utf-8') as f:
    f.write('// Real TMUA questions extracted from PDFs\n')
    f.write('export const realQuestions = ')
    json.dump(app_questions, f, indent=2, ensure_ascii=False)
    f.write('\n')

print(f"✓ 已转换 {len(app_questions)} 题")
print(f"✓ 保存到: {output}")
print("\n注意：需要补充答案和解析")
