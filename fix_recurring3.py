with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'r') as f:
    content = f.read()

# Replace the enum fields with string literals - using the exact current content
old = """  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),"""

new = """  category: z.string().refine(val => ['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other'].includes(val), 'Invalid category'),
  frequency: z.string().refine(val => ['daily', 'weekly', 'monthly', 'yearly'].includes(val), 'Invalid frequency'),"""

if old in content:
    content = content.replace(old, new)
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'w') as f:
        f.write(content)
    print('Fixed enums')
else:
    print('Old enum lines not found')
EOF