with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'r') as f:
    content = f.read()

# Replace the entire schema with a simpler version
old = """const recurringExpenseSchema: z.ZodObject<any> = z.object({
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

new = """const recurringExpenseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  category: z.union([
    z.literal('food'),
    z.literal('transport'),
    z.literal('shopping'),
    z.literal('entertainment'),
    z.literal('health'),
    z.literal('education'),
    z.literal('utilities'),
    z.literal('other'),
  ]),
  frequency: z.union([
    z.literal('daily'),
    z.literal('weekly'),
    z.literal('monthly'),
    z.literal('yearly'),
  ]),
  start_date: z.string().date(),
  end_date: z.string().date().optional().nullable(),
  reminder_days_before: z.number().int().min(0).max(30).default(3),
  payment_method: z.string().max(50).optional(),
  auto_create_expense: z.boolean().default(true),
});"""

if old in content:
    content = content.replace(old, new)
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'w') as f:
        f.write(content)
    print('Replaced schema with union types')
else:
    print('Old schema not found')
    # Show what we have
    idx = content.find('const recurringExpenseSchema')
    if idx != -1:
        print(content[idx:idx+1000])