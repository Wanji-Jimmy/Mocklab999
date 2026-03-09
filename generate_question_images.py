#!/usr/bin/env python3
"""为指定题目生成题干和选项图片"""
import pdfplumber
from pathlib import Path
import json
from PIL import Image

def extract_question_image(pdf_path, question_num, output_dir):
    """从PDF提取题目区域为图片"""
    images = {
        'stem': None,
        'options': []
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # 查找题号在页面中的位置
            text = page.extract_text() or ""
            
            # 简单匹配题号行
            import re
            pattern = rf'\n\s*{question_num}\s+'
            match = re.search(pattern, text)
            
            if match:
                # 找到题目，截取整个页面或区域
                # 这里简化处理：直接保存整页
                img = page.to_image(resolution=200)
                
                stem_file = output_dir / f"stem.png"
                img.save(str(stem_file))
                
                images['stem'] = str(stem_file.relative_to(Path('/Users/moji/Desktop/tmua/tmua-exam/public')))
                
                # TODO: 分离选项需要更精确的坐标定位
                # 暂时使用同一张图
                for opt_key in ['A', 'B', 'C', 'D', 'E']:
                    opt_file = output_dir / f"option_{opt_key}.png"
                    img.save(str(opt_file))
                    images['options'].append({
                        'key': opt_key,
                        'image': str(opt_file.relative_to(Path('/Users/moji/Desktop/tmua/tmua-exam/public')))
                    })
                
                return images
    
    return None

# 加载需要转图片的题目列表
with open('/Users/moji/Desktop/tmua/questions_need_images.json') as f:
    need_images = json.load(f)

# 限制处理数量（测试）
need_images = need_images[:5]

pdf_dir = Path('/Users/moji/Desktop/tmua')
output_base = Path('/Users/moji/Desktop/tmua/tmua-exam/public/question_images')
output_base.mkdir(exist_ok=True)

results = []

for item in need_images:
    year = item['year']
    paper = item['paper']
    number = item['number']
    
    pdf_name = f"TMUA-{year}-paper-{paper}.pdf"
    pdf_path = pdf_dir / pdf_name
    
    if not pdf_path.exists():
        print(f"⚠ PDF不存在: {pdf_name}")
        continue
    
    print(f"处理: {year}-P{paper}-Q{number}...", end=' ')
    
    # 创建题目输出目录
    q_dir = output_base / f"{year}-P{paper}-Q{number}"
    q_dir.mkdir(exist_ok=True)
    
    images = extract_question_image(pdf_path, number, q_dir)
    
    if images:
        results.append({
            'year': year,
            'paper': paper,
            'number': number,
            'images': images
        })
        print("✓")
    else:
        print("✗")

# 保存映射
mapping_file = output_base / 'image_mapping.json'
with open(mapping_file, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n✓ 生成图片: {len(results)} 题")
print(f"✓ 映射文件: {mapping_file}")
