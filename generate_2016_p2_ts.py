#!/usr/bin/env python3
"""Generate TypeScript code for 2016 Paper 2 questions"""

import json

questions = json.load(open('/Users/moji/Desktop/tmua/2016_p2_parsed.json'))

# Answer keys from the original file (preserving them)
answer_keys = {
    1: "A", 2: "E", 3: "C", 4: "B", 5: "D",
    6: "C", 7: "H", 8: "F", 9: "C", 10: "E",
    11: "F", 12: "E", 13: "E", 14: "A", 15: "D",
    16: "C", 17: "H", 18: "B", 19: "B", 20: "D"
}

print("// 2016 Paper 2 Questions - Generated from Mathpix LaTeX")
print()

for q in questions:
    q_num = q['num']
    answer = answer_keys.get(q_num, "A")
    
    # Escape backslashes and quotes for TypeScript
    stem = q['stem'].replace('\\', '\\\\').replace('"', '\\"')
    
    # Build options array
    options_ts = []
    for opt in q['options']:
        latex = opt['latex'].replace('\\', '\\\\').replace('"', '\\"')
        options_ts.append(f'      {{\n        "key": "{opt["key"]}",\n        "latex": "{latex}"\n      }}')
    
    options_str = ',\n'.join(options_ts)
    
    # Build images array
    if q['images']:
        images_ts = ',\n        '.join([f'"{img}"' for img in q['images']])
        images_field = f'    "imageUrls": [\n        {images_ts}\n    ],\n'
    else:
        images_field = ''
    
    comma = "," if images_field else ""
    img_part = images_field.rstrip(',\n') if images_field else ""
    
    print("  {")
    print(f'    "id": "2016-P2-Q{q_num}",')
    print(f'    "paper": 2,')
    print(f'    "index": {q_num},')
    print(f'    "stemLatex": "{stem}",')
    print('    "options": [')
    print(options_str)
    print('    ],')
    print(f'    "answerKey": "{answer}",')
    print('    "explanationLatex": "",')
    print('    "tags": [')
    print('      "2016",')
    print('      "Paper2"')
    print('    ],')
    print(f'    "difficulty": 1{comma}')
    if img_part:
        print(img_part)
    print('  },')
