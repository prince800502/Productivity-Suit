with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'r') as f:
    content = f.read()

# Fix 1: Line 237 - string concatenation in className
old1 = """                  <div className={'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ' + getNotificationColor(notification.priority)}>"""
new1 = """                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.priority)}`}>"""

if old1 in content:
    content = content.replace(old1, new1)
    print('Fixed line 237')
else:
    print('Line 237 not found')

# Fix 2: Simplify the ternary for className - use a variable
# The ternary at lines 235-236 is too long. Let's see if we can extract it
# Actually, the ternary is already on one line but very long. Let's just leave it but ensure it's valid JSX.

# Fix 3: The Switch component at line 296 uses register().onChange() which might be causing issues
# Actually, the Switch component expects label and description props

with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'w') as f:
    f.write(content)

print('Done')