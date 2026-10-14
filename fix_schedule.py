import re

with open('C:/Users/ps800/productivity-suite/apps/web/src/app/(dashboard)/schedule/page.tsx', 'r') as f:
    content = f.read()

# Find the CardContent section and replace it
# Using regex to match the ternary pattern
pattern = r'<CardContent>\s*\{(\(todaySchedule\?\.events && todaySchedule\.events\.length > 0\) \? \([\s\S]*?\)\)\s*</CardContent>'

# Let's use a more flexible approach - find the CardContent and replace everything until the closing </CardContent>
idx_start = content.find('<CardContent>')
if idx_start >= 0:
    # Find the matching </CardContent>
    idx_end = content.find('</CardContent>', idx_start)
    if idx_end >= 0:
        idx_end += len('</CardContent>')
        print(f"Found CardContent from {idx_start} to {idx_end}")
        print(f"Length: {idx_end - idx_start}")
        
        # Replace
        new_content = content[:idx_start] + '''<CardContent>
          {todayScheduleContent}
        </CardContent>''' + content[idx_end:]
        
        with open('C:/Users/ps800/productivity-suite/apps/web/src/app/(dashboard)/schedule/page.tsx', 'w') as f:
            f.write(new_content)
        print('Replacement successful!')
    else:
        print('Could not find closing </CardContent>')
else:
    print('Could not find <CardContent>')