with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'r') as f:
    content = f.read()

old = """<Switch
                      checked={expense.is_active}
                      onChange={(e) => toggleActive.mutate({ id: expense.id, is_active: e.target.checked })}
                    />"""

new = """<Switch
                      checked={expense.is_active}
                      onChange={(e) => toggleActive.mutate({ id: expense.id, is_active: e.target.checked })}
                      label=""
                      description=""
                    />"""

if old in content:
    content = content.replace(old, new)
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\recurring-expenses\page.tsx', 'w') as f:
        f.write(content)
    print('Fixed Switch')
else:
    print('Switch not found')