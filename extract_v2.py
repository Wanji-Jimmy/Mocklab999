#!/usr/bin/env python3
"""
Improved TMUA question extractor - focus on getting exactly 20 questions per paper
"""
import re
import json
from pathlib import Path
import pdfplumber

def clean_text(text):
    """Clean up extracted text"""
    # Remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove page numbers
    text = re.sub(r'\n\d+\n', '\n', text)
    return text.strip()

def extract_questions_smart(pdf_path):
    """Extract exactly 20 questions per paper"""
    questions = []
    
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n"
        
        full_text = clean_text(full_text)
        
        # Parse metadata
        filename = Path(pdf_path).stem
        parts = filename.split('-')
        year = parts[1]
        paper = int(parts[3])
        
        # Find questions 1-20 more carefully
        # Look for "\n1 " to "\n20 " or "\n1." to "\n20."
        found_questions = []
        
        for q_num in range(1, 21):
            # Try multiple patterns
            patterns = [
                rf'\n{q_num}\s+([A-Z\u222b\(])',  # Number followed by capital/integral/bracket
                rf'\n{q_num}\.\s+',  # Number with dot
            ]
            
            for pattern in patterns:
                matches = list(re.finditer(pattern, full_text))
                if matches:
                    start_pos = matches[0].start() + 1  # After newline
                    
                    # Find end position (next question or end)
                    if q_num < 20:
                        # Find next question
                        next_pattern = rf'\n{q_num+1}\s+'
                        next_matches = list(re.finditer(next_pattern, full_text[start_pos:]))
                        if next_matches:
                            end_pos = start_pos + next_matches[0].start()
                        else:
                            end_pos = len(full_text)
                    else:
                        end_pos = len(full_text)
                    
                    q_text = full_text[start_pos:end_pos].strip()
                    
                    # Remove question number from start
                    q_text = re.sub(rf'^{q_num}[\.\s]+', '', q_text)
                    
                    # Extract options
                    option_pattern = r'\n([A-G])\s+'
                    parts = re.split(option_pattern, q_text)
                    
                    stem = parts[0].strip()
                    options = []
                    
                    for i in range(1, len(parts), 2):
                        if i + 1 < len(parts):
                            key = parts[i]
                            text = parts[i + 1].strip()
                            # Remove next option letter at end
                            text = re.sub(r'\n[A-G]\s*$', '', text)
                            if text:
                                options.append({'key': key, 'text': text})
                    
                    found_questions.append({
                        'year': year,
                        'paper': paper,
                        'number': q_num,
                        'stem': stem,
                        'options': options
                    })
                    break
        
        return found_questions

def main():
    pdf_dir = Path('/Users/moji/Desktop/tmua')
    pdf_files = sorted(pdf_dir.glob('TMUA-*.pdf'))
    
    all_questions = []
    stats = {}
    
    for pdf_path in pdf_files:
        print(f"Processing {pdf_path.name}...")
        try:
            questions = extract_questions_smart(pdf_path)
            all_questions.extend(questions)
            
            key = f"{pdf_path.stem}"
            stats[key] = len(questions)
            
            if len(questions) == 20:
                print(f"  ✓ Extracted {len(questions)} questions")
            else:
                print(f"  ⚠ Extracted {len(questions)} questions (expected 20)")
        except Exception as e:
            print(f"  ✗ Error: {e}")
            stats[pdf_path.stem] = 0
    
    # Save
    output_file = pdf_dir / 'tmua_questions_v2.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Total: {len(all_questions)} questions")
    print(f"✓ Saved: {output_file}")
    
    # Summary
    print("\nSummary:")
    for name in sorted(stats.keys()):
        count = stats[name]
        status = "✓" if count == 20 else "⚠"
        print(f"  {status} {name}: {count}/20")

if __name__ == '__main__':
    main()
