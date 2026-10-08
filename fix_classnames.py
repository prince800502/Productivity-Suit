with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'r') as f:
    content = f.read()

# Fix the className concatenations using template literals
fixes = [
    # Line 175: notification card className
    ('className={(notification.is_read ? \'bg-white dark:bg-neutral-900\' : \'bg-primary-50 dark:bg-primary-900/20\') + " p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"}',
     'className={`${notification.is_read ? \'bg-white dark:bg-neutral-900\' : \'bg-primary-50 dark:bg-primary-900/20\'} p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800`}'),
    
    # Line 177: notification icon className
    ('className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center " + getNotificationColor(notification.priority)',
     'className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.priority)}`}'),
    
    # Line 183: h4 className (already using ternary, should be fine)
    
    # Other similar patterns
]

for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        print(f'Fixed: {old[:50]}...')
    else:
        print(f'NOT FOUND: {old[:50]}...')

with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'w') as f:
    f.write(content)

print('Done')