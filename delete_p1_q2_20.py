#!/usr/bin/env python3
"""Delete 2016 Paper 1 Q2-Q20 from complete-questions.ts"""

with open('/Users/moji/Desktop/tmua/tmua-exam/lib/complete-questions.ts', 'r') as f:
    lines = f.readlines()

# Find start of Q2 (line containing "2016-P1-Q2")
start_line = None
for i, line in enumerate(lines):
    if '"id": "2016-P1-Q2"' in line:
        # Go back to find the opening brace
        for j in range(i-1, -1, -1):
            if lines[j].strip() == '{':
                start_line = j
                break
        break

# Find end of Q20 (line containing "2016-P1-Q20")
end_line = None
for i, line in enumerate(lines):
    if '"id": "2016-P1-Q20"' in line:
        # Go forward to find the closing brace
        brace_count = 0
        found_open = False
        for j in range(i, len(lines)):
            if '{' in lines[j]:
                found_open = True
            if found_open:
                brace_count += lines[j].count('{')
                brace_count -= lines[j].count('}')
                if brace_count == 0:
                    end_line = j
                    break
        break

print(f"Found Q2 at line {start_line+1}, Q20 ends at line {end_line+1}")

if start_line is not None and end_line is not None:
    # Keep lines before start_line and after end_line
    result = lines[:start_line]
    # Add a newline for clean separation
    result.append('\n')
    result.extend(lines[end_line+1:])
    
    with open('/Users/moji/Desktop/tmua/tmua-exam/lib/complete-questions.ts', 'w') as f:
        f.writelines(result)
    
    print(f"Deleted lines {start_line+1} to {end_line+1}")
    print("2016 Paper 1 Q2-Q20 have been removed, Q1 is preserved")
else:
    print("Could not find the range to delete")
