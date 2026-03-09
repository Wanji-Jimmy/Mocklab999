#!/usr/bin/env python3
"""
Extract TMUA questions from PDF files and convert to JSON format
"""
import re
import json
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'pdfplumber'])
    import pdfplumber


def extract_questions_from_pdf(pdf_path):
    """Extract questions from a TMUA PDF file"""
    questions = []
    
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            full_text += page.extract_text() + "\n"
        
        # Parse year and paper from filename
        filename = Path(pdf_path).stem  # e.g., "TMUA-2023-paper-1"
        parts = filename.split('-')
        year = parts[1]
        paper = int(parts[3])
        
        # Split by question numbers - try multiple patterns
        # Pattern 1: "\n1 " (space after number)
        question_pattern = r'\n(\d+)\s+(?=[A-Z]|∫|\w)'
        question_splits = re.split(question_pattern, full_text)
        
        # If that didn't work, try "\n1." pattern
        if len(question_splits) < 20:
            question_pattern = r'\n(\d+)\.\s+'
            question_splits = re.split(question_pattern, full_text)
        
        # Process questions
        for i in range(1, len(question_splits), 2):
            if i + 1 < len(question_splits):
                q_num = int(question_splits[i])
                q_content = question_splits[i + 1].strip()
                
                # Extract options - look for single letter followed by space/newline
                options = []
                # Match A-G (some questions have more options)
                option_pattern = r'\n([A-G])\s+'
                option_parts = re.split(option_pattern, q_content)
                
                stem = option_parts[0].strip()
                
                for j in range(1, len(option_parts), 2):
                    if j + 1 < len(option_parts):
                        opt_key = option_parts[j]
                        opt_text = option_parts[j + 1].strip()
                        # Take until next option or end
                        opt_text = re.split(r'\n(?=[A-G]\s)', opt_text)[0]
                        opt_text = opt_text.strip()
                        if opt_text:  # Only add non-empty options
                            options.append({
                                'key': opt_key,
                                'text': opt_text
                            })
                
                questions.append({
                    'year': year,
                    'paper': paper,
                    'number': q_num,
                    'stem': stem,
                    'options': options
                })
    
    return questions


def main():
    # Find all TMUA PDF files
    pdf_dir = Path('/Users/moji/Desktop/tmua')
    pdf_files = sorted(pdf_dir.glob('TMUA-*.pdf'))
    
    all_questions = []
    
    for pdf_path in pdf_files:
        print(f"Processing {pdf_path.name}...")
        try:
            questions = extract_questions_from_pdf(pdf_path)
            all_questions.extend(questions)
            print(f"  Extracted {len(questions)} questions")
        except Exception as e:
            print(f"  Error: {e}")
    
    # Save to JSON
    output_file = pdf_dir / 'tmua_questions.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Total questions extracted: {len(all_questions)}")
    print(f"✓ Saved to: {output_file}")
    
    # Print summary
    by_year = {}
    for q in all_questions:
        key = f"{q['year']}-P{q['paper']}"
        by_year[key] = by_year.get(key, 0) + 1
    
    print("\nSummary:")
    for key in sorted(by_year.keys()):
        print(f"  {key}: {by_year[key]} questions")


if __name__ == '__main__':
    main()
