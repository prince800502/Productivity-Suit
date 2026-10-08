with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'r') as f:
    content = f.read()

# Find the schema and replace it completely
idx_start = content.find('const recurringExpenseSchema')
idx_end = content.find(');\n\nfunction getFrequencyLabel')

if idx_start != -1 and idx_end != -1:
    # Include the );
    idx_end += 2
    
    new_schema = """const recurringExpenseSchema = z.object({
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
    
    content = content[:idx_start] + new_schema + content[idx_end:]
    
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'w') as f:
        f.write(content)
    print('Replaced schema successfully')
else:
    print(f'Start: {idx_start}, End: {idx_end}')