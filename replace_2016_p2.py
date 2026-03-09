#!/usr/bin/env python3
"""Replace 2016 Paper 2 questions in complete-questions.ts"""

# Read the original file
with open('/Users/moji/Desktop/tmua/tmua-exam/lib/complete-questions.ts', 'r') as f:
    lines = f.readlines()

# Read the new content
with open('/Users/moji/Desktop/tmua/2016_p2_output.ts', 'r') as f:
    new_content = f.read()

# Find the start of 2016-P2-Q1 (line 736 in 1-indexed = 735 in 0-indexed)
# Find the end of 2016-P2-Q20 (line 1454 in 1-indexed = 1453 in 0-indexed)
start_line = 735  # 0-indexed, line 736 in file (contains 2016-P2-Q1)
end_line = 1453   # 0-indexed, line 1454 in file (closing brace of 2016-P2-Q20)

# Find the exact start - look for '"id": "2016-P2-Q1"'
for i, line in enumerate(lines):
    if '"id": "2016-P2-Q1"' in line:
        # Go back to find the opening brace
        for j in range(i-1, -1, -1):
            if lines[j].strip() == '{':
                start_line = j
                break
        break

# Find the exact end - look for '"id": "2017-P1-Q1"' and go back
for i, line in enumerate(lines):
    if '"id": "2017-P1-Q1"' in line:
        # Go back to find the closing brace of previous question
        for j in range(i-1, -1, -1):
            if lines[j].strip() == '},':
                end_line = j
                break
        break

print(f"Found range: lines {start_line+1} to {end_line+1} (1-indexed)")

# Build new file content
# Remove the comment line from new_content
new_lines = new_content.split('\n')
if new_lines[0].startswith('//'):
    new_lines = new_lines[1:]
new_content_clean = '\n'.join(new_lines)

# Ensure new content doesn't have trailing comma for the last item
new_content_clean = new_content_clean.rstrip().rstrip(',')

# Construct the new file
result = lines[:start_line]
result.append(new_content_clean + '\n')
result.extend(lines[end_line+1:])

# Write back
with open('/Users/moji/Desktop/tmua/tmua-exam/lib/complete-questions.ts', 'w') as f:
    f.writelines(result)

print("Replacement complete!")
print(f"Replaced {end_line - start_line + 1} lines with new content")
