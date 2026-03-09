#!/usr/bin/env python3
"""
提取题目为独立部分：题干图片 + 每个选项图片
"""
import pdfplumber
from pathlib import Path
from PIL import Image
import json

def extract_question_parts(pdf_path, question_num, output_dir):
    """
    从PDF中提取单个题目，分离题干和选项
    返回: {
        'stem_image': '/path/to/stem.png',
        'options': [
            {'key': 'A', 'image': '/path/to/A.png'},
            ...
        ]
    }
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    with pdfplumber.open(pdf_path) as pdf:
        # 假设每题占一页，从第3页开始（page index 2）
        page_num = 2 + question_num - 1
        
        if page_num >= len(pdf.pages):
            return None
        
        page = pdf.pages[page_num]
        
        # 获取高分辨率页面图像
        im = page.to_image(resolution=200)
        width = im.original.width
        height = im.original.height
        
        # 策略：上60%是题干，下40%是选项
        # 题干部分
        stem_bbox = (0, 0, width, int(height * 0.6))
        stem_img = im.original.crop(stem_bbox)
        stem_path = output_dir / f'Q{question_num}_stem.png'
        stem_img.save(stem_path)
        
        # 选项部分（假设5个选项ABCDE）
        options_start_y = int(height * 0.6)
        options_height = height - options_start_y
        option_height = options_height // 5
        
        options = []
        for i, key in enumerate(['A', 'B', 'C', 'D', 'E']):
            y1 = options_start_y + i * option_height
            y2 = min(y1 + option_height, height)
            option_bbox = (0, y1, width, y2)
            option_img = im.original.crop(option_bbox)
            option_path = output_dir / f'Q{question_num}_option_{key}.png'
            option_img.save(option_path)
            options.append({
                'key': key,
                'image': str(option_path.relative_to(Path('tmua-exam/public')))
            })
        
        return {
            'stem_image': str(stem_path.relative_to(Path('tmua-exam/public'))),
            'options': options
        }

def main():
    # 处理2016-P1的20题
    pdf_path = Path('TMUA-2016-paper-1.pdf')
    output_base = Path('tmua-exam/public/question_parts/2016-P1')
    
    results = []
    
    print('开始提取 2016 Paper 1 (20题)...')
    print('='*70)
    
    for q_num in range(1, 21):
        print(f'提取 Q{q_num}...', end=' ')
        try:
            result = extract_question_parts(pdf_path, q_num, output_base)
            if result:
                results.append({
                    'year': '2016',
                    'paper': 1,
                    'number': q_num,
                    **result
                })
                print('✓')
            else:
                print('✗ (页面不存在)')
        except Exception as e:
            print(f'✗ (错误: {e})')
    
    # 保存映射文件
    mapping_file = Path('question_parts_2016_p1.json')
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f'\n✓ 完成！提取了 {len(results)}/20 题')
    print(f'✓ 映射文件: {mapping_file}')

if __name__ == '__main__':
    main()
