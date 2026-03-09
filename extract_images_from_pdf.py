#!/usr/bin/env python3
"""提取PDF中的图片并关联到题目"""
import pdfplumber
from pathlib import Path
import json
from PIL import Image
import io

def extract_images_with_context(pdf_path, output_dir):
    """提取PDF图片并记录页面位置"""
    images_info = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # 提取页面文本用于识别题号
            text = page.extract_text() or ""
            
            # 提取图片
            if hasattr(page, 'images'):
                for img_idx, img in enumerate(page.images):
                    try:
                        # 保存图片
                        img_name = f"page{page_num}_img{img_idx}.png"
                        img_path = output_dir / img_name
                        
                        # 获取图片区域
                        x0, y0 = img['x0'], img['top']
                        x1, y1 = img['x1'], img['bottom']
                        
                        # 裁剪图片
                        im = page.within_bbox((x0, y0, x1, y1)).to_image(resolution=150)
                        im.save(str(img_path))
                        
                        # 查找附近的题号
                        nearby_text = page.within_bbox((0, max(0, y0-50), page.width, min(page.height, y1+50))).extract_text()
                        
                        images_info.append({
                            'file': img_name,
                            'page': page_num,
                            'position': {'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1},
                            'nearby_text': nearby_text[:200] if nearby_text else ""
                        })
                        
                        print(f"  提取图片: {img_name} (Page {page_num})")
                        
                    except Exception as e:
                        print(f"  图片提取失败: {e}")
    
    return images_info

# 处理所有PDF
pdf_dir = Path('/Users/moji/Desktop/tmua')
output_dir = pdf_dir / 'extracted_images'
output_dir.mkdir(exist_ok=True)

all_images = {}

for pdf_file in sorted(pdf_dir.glob('TMUA-*.pdf')):
    print(f"\n处理: {pdf_file.name}")
    
    pdf_output = output_dir / pdf_file.stem
    pdf_output.mkdir(exist_ok=True)
    
    images = extract_images_with_context(pdf_file, pdf_output)
    all_images[pdf_file.stem] = images

# 保存索引
index_file = output_dir / 'images_index.json'
with open(index_file, 'w', encoding='utf-8') as f:
    json.dump(all_images, f, indent=2, ensure_ascii=False)

print(f"\n✓ 图片索引: {index_file}")
print(f"✓ 图片目录: {output_dir}")
