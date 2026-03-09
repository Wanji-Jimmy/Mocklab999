#!/usr/bin/env python3
"""检查题目中是否包含大量CID编码或无法识别内容"""
import json
from pathlib import Path
import re

# 加载题库
with open('/Users/moji/Desktop/tmua/tmua_questions_v3.json') as f:
    questions = json.load(f)

# 检查标准
def check_quality(text):
    """检查文本质量"""
    if not text:
        return 'empty', 0
    
    # 统计CID编码
    cid_count = len(re.findall(r'\(cid:\d+\)', text))
    cid_ratio = cid_count / max(len(text), 1)
    
    # 统计乱码字符
    garbled = len(re.findall(r'[�\ufffd\x00-\x08\x0b\x0c\x0e-\x1f]', text))
    
    # 题干太短可能提取不完整
    if len(text) < 20:
        return 'too_short', len(text)
    
    if cid_ratio > 0.1 or cid_count > 10:
        return 'high_cid', cid_count
    
    if garbled > 5:
        return 'garbled', garbled
    
    return 'ok', 0

# 分析所有题目
problematic = []

for q in questions:
    stem_status, stem_score = check_quality(q['stem'])
    
    # 检查选项
    bad_options = 0
    for opt in q['options']:
        opt_status, _ = check_quality(opt.get('text', ''))
        if opt_status != 'ok':
            bad_options += 1
    
    if stem_status != 'ok' or bad_options >= 2:
        problematic.append({
            'year': q['year'],
            'paper': q['paper'],
            'number': q['number'],
            'stem_issue': stem_status,
            'stem_score': stem_score,
            'bad_options': bad_options,
            'stem_preview': q['stem'][:100]
        })

# 输出结果
print("需要转图片的题目：\n")
print("="*70)

for item in problematic:
    print(f"\n{item['year']}-P{item['paper']}-Q{item['number']}:")
    print(f"  题干问题: {item['stem_issue']} (分数: {item['stem_score']})")
    print(f"  坏选项数: {item['bad_options']}")
    print(f"  预览: {item['stem_preview'][:60]}...")

print(f"\n{'='*70}")
print(f"总计需转图片: {len(problematic)} 题")

# 保存列表
output = Path('/Users/moji/Desktop/tmua/questions_need_images.json')
with open(output, 'w', encoding='utf-8') as f:
    json.dump(problematic, f, indent=2, ensure_ascii=False)

print(f"详细列表: {output}")
