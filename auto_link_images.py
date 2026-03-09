#!/usr/bin/env python3
"""自动识别图片所属题目并关联"""
import json
from pathlib import Path
import re

# 加载现有题目
questions_file = Path('/Users/moji/Desktop/tmua/tmua_questions_v2.json')
with open(questions_file) as f:
    questions = json.load(f)

# 加载图片索引
images_index_file = Path('/Users/moji/Desktop/tmua/extracted_images/images_index.json')
with open(images_index_file) as f:
    images_index = json.load(f)

# 自动识别图片对应的题号
def find_question_number(nearby_text):
    """从附近文本识别题号"""
    # 尝试匹配题号模式
    patterns = [
        r'(\d{1,2})\s*[\.:]',  # 数字+点/冒号
        r'Question\s+(\d{1,2})',  # Question X
        r'Q\s*(\d{1,2})',  # QX
    ]
    for pattern in patterns:
        match = re.search(pattern, nearby_text)
        if match:
            q_num = int(match.group(1))
            if 1 <= q_num <= 20:
                return q_num
    return None

# 处理图片映射
image_mapping = {}
for pdf_key, images in images_index.items():
    if not images:
        continue
    
    # 跳过封面图片
    for img in images:
        if img['page'] == 1:
            continue
        
        # 解析PDF文件名
        match = re.match(r'TMUA-(\d{4})-paper-(\d+)', pdf_key)
        if not match:
            continue
        
        year = match.group(1)
        paper = int(match.group(2))
        
        # 推断题号（第18页通常是最后几题，假设是Q19-Q20）
        # 2016-P2-page18 有3张图 → Q20有3张配图
        if pdf_key == 'TMUA-2016-paper-2' and img['page'] == 18:
            q_num = 20
        else:
            # 从附近文本推断
            q_num = find_question_number(img['nearby_text'])
            if not q_num:
                print(f"⚠ 无法识别题号: {pdf_key}/{img['file']}")
                continue
        
        key = f"{year}-{paper}-{q_num}"
        if key not in image_mapping:
            image_mapping[key] = []
        
        image_mapping[key].append(f"extracted_images/{pdf_key}/{img['file']}")

# 更新题目数据
updated = 0
for q in questions:
    key = f"{q['year']}-{q['paper']}-{q['number']}"
    if key in image_mapping:
        # 单张图用imageUrl，多张图用imageUrls数组
        if len(image_mapping[key]) == 1:
            q['imageUrl'] = image_mapping[key][0]
        else:
            q['imageUrls'] = image_mapping[key]
        updated += 1

# 保存更新后的数据
output_file = Path('/Users/moji/Desktop/tmua/tmua_questions_with_images.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f"✓ 找到图片: {len(image_mapping)} 题")
print(f"✓ 更新数据: {updated} 题")
print(f"✓ 保存至: {output_file}")
print(f"\n图片映射:")
for key, imgs in sorted(image_mapping.items()):
    print(f"  {key}: {len(imgs)} 张图")
