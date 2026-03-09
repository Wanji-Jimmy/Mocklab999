#!/usr/bin/env python3
"""将提取的图片关联到题目数据"""
import json
from pathlib import Path

# 加载现有题目
with open('/Users/moji/Desktop/tmua/tmua_questions_v2.json') as f:
    questions = json.load(f)

# 加载图片索引
with open('/Users/moji/Desktop/tmua/extracted_images/images_index.json') as f:
    images_index = json.load(f)

# 手动映射图片到题目（2016-P2有3张图）
IMAGE_MAPPING = {
    # 2016-P2-Q20 的三视图
    '2016-2-20': [
        'extracted_images/TMUA-2016-paper-2/page18_img0.png',
        'extracted_images/TMUA-2016-paper-2/page18_img1.png',
        'extracted_images/TMUA-2016-paper-2/page18_img2.png',
    ]
}

# 更新题目数据
updated = 0
for q in questions:
    key = f"{q['year']}-{q['paper']}-{q['number']}"
    if key in IMAGE_MAPPING:
        # 合并多张图片URL
        q['imageUrls'] = IMAGE_MAPPING[key]
        updated += 1

# 保存更新后的数据
output_file = Path('/Users/moji/Desktop/tmua/tmua_questions_with_images.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f"✓ 更新 {updated} 题含图片")
print(f"✓ 保存至: {output_file}")
print(f"\n需手动检查图片并补充IMAGE_MAPPING")
