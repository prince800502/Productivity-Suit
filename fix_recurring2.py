with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'r') as f:
    content = f.read()

# Replace the enum fields with string literals
old = """const recurringExpenseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.enum(['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string().date(),
  end_date: z.string().date().optional().nullable(),
  reminder_days_before: z.number().int().min(0).max(30).default(3),
  payment_method: z.string().max(50).optional(),
  auto_create_expense: z.boolean().default(true)
});"""

new = """const recurringExpenseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.string().refine(val => ['food', 'transport', 'shopping', 'entertainment', 'health', 'education', 'utilities', 'other'].includes(val), 'Invalid category'),
  frequency: z.string().refine(val => ['daily', 'weekly', 'monthly', 'yearly'].includes(val), 'Invalid frequency'),
  start_date: z.string().date(),
  end_date: z.string().date().optional().nullable(),
  reminder_days_before: z.number().int().min(0).max(30).default(3),
  payment_method: z.string().max(50).optional(),
  auto_create_expense: z.boolean().default(true)
});"""

if old in content:
    content = content.replace(old, new)
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'w') as f:
        f.write(content)
    print('Fixed enums')
else:
    print('Old schema not found')
    # Show current schema
    idx = content.find('const recurringExpenseSchema')
    if idx != -1:
        print(content[idx:idx+800])