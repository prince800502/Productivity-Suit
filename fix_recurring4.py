with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'r') as f:
    content = f.read()

# Add type annotation to the schema
old = """const recurringExpenseSchema = z.object({"""

new = """const recurringExpenseSchema = z.object({"""

if old in content:
    # Just add a type annotation after the const
    content = content.replace(
        'const recurringExpenseSchema = z.object({',
        'const recurringExpenseSchema: z.ZodObject<any> = z.object({'
    )
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'w') as f:
        f.write(content)
    print('Added type annotation')
else:
    print('Not found')