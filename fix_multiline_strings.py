#!/usr/bin/env python3
"""Fix multiline strings in complete-questions.ts"""

import re

with open('/Users/moji/Desktop/tmua/tmua-exam/lib/complete-questions.ts', 'r') as f:
    content = f.read()

# Find all stemLatex fields that span multiple lines and fix them
# Pattern: "stemLatex": "...\n..."
def fix_multiline_stem(match):
    full_match = match.group(0)
    # Replace actual newlines with \n escape sequences
    # But be careful not to break the JSON structure
    
    # Extract the content between quotes
    quote_start = full_match.find('"') + 1
    quote_end = full_match.rfind('"')
    
    if quote_start >= 0 and quote_end > quote_start:
        prefix = full_match[:quote_start]
        content_str = full_match[quote_start:quote_end]
        suffix = full_match[quote_end:]
        
        # Escape newlines within the content
        content_str = content_str.replace('\n', '\\n')
        
        return prefix + content_str + suffix
    
    return full_match

# Pattern to match stemLatex with multiline content
# This matches "stemLatex": "..." where ... can contain newlines
pattern = r'"stemLatex":\s*"([^"]*(?:\n[^"]*)*)"'

# Find all matches and fix them
matches = list(re.finditer(pattern, content))
print(f"Found {len(matches)} potential multiline stemLatex fields")

# Process from end to start to preserve positions
for match in reversed(matches):
    full_match = match.group(0)
    if '\n' in full_match:
        # This is a multiline string, fix it
        fixed = fix_multiline_stem(match)
        content = content[:match.start()] + fixed + content[match.end():]

# Also fix any explanationLatex fields
matches = list(re.finditer(pattern.replace('stemLatex', 'explanationLatex'), content))
print(f"Found {len(matches)} potential multiline explanationLatex fields")

for match in reversed(matches):
    full_match = match.group(0)
    if '\n' in full_match:
        fixed = fix_multiline_stem(match)
        content = content[:match.start()] + fixed + content[match.end():]

# Write back
with open('/Users/moji/Desktop/tmua/tmua-exam/lib/complete-questions.ts', 'w') as f:
    f.write(content)

print("Fixed multiline strings")
