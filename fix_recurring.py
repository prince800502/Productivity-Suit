with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'r') as f:
    content = f.read()

# Remove trailing comma from line 39
old = "auto_create_expense: z.boolean().default(true),\n);"
new = "auto_create_expense: z.boolean().default(true)\n);"

if old in content:
    content = content.replace(old, new)
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'w') as f:
        f.write(content)
    print('Fixed trailing comma')
else:
    print('Pattern not found')
    # Debug: show lines 38-41
    lines = content.split('\n')
    for i in range(37, 42):
        print(f'Line {i+1}: {repr(lines[i])}')