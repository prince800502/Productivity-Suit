with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'r') as f:
    content = f.read()

# Fix all Switch components to include label and description
# Pattern 1: Switch with watch and register
old1 = """<Switch checked={watch('in_app_enabled')} onChange={(e) => register('in_app_enabled').onChange(e)} />"""
new1 = """<Switch checked={watch('in_app_enabled')} onChange={(e) => register('in_app_enabled').onChange(e)} label="" description="" />"""

if old1 in content:
    content = content.replace(old1, new1)
    print('Fixed Switch 1')
else:
    print('Switch 1 not found')

# Pattern 2: Switch in map with item.key
old2 = """<Switch checked={watch(item.key)} onChange={(e) => register(item.key).onChange(e)} />"""
new2 = """<Switch checked={watch(item.key)} onChange={(e) => register(item.key).onChange(e)} label={item.label} description={item.desc} />"""

if old2 in content:
    content = content.replace(old2, new2)
    print('Fixed Switch 2')
else:
    print('Switch 2 not found')

with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'w') as f:
    f.write(content)
print('Done')