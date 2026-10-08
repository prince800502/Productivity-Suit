with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'r') as f:
    content = f.read()

# Fix string concatenation in className to use template literals
old1 = "className={'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ' + getNotificationColor(notification.priority)}"
new1 = "className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.priority)}`}"

if old1 in content:
    content = content.replace(old1, new1)
    print('Fixed string concatenation in NotificationList')
else:
    print('String concatenation not found')

with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'w') as f:
    f.write(content)
print('Done')