with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'r') as f:
    content = f.read()

# Change map with implicit return to explicit return
old_map = """            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={notification.is_read ? 'bg-white dark:bg-neutral-900 p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800' : 'bg-primary-50 dark:bg-primary-900/20 p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800'}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.priority)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={notification.is_read ? 'font-medium text-neutral-900 dark:text-white' : 'font-semibold text-neutral-900 dark:text-white'}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{notification.message}</p>
                    </div>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                      {formatNotificationTime(notification.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.action_url && notification.action_label && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = notification.action_url}>
                        {notification.action_label}
                      </Button>
                    )}
                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleMarkAsRead(notification.id)} />
                    )}
                    <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => handleArchive(notification.id)} />
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} />
                      }
                      items={[
                        { label: 'Delete', value: 'delete', icon: Trash2 as any, danger: true },
                      ]}
                      onSelect={(value) => value === 'delete' && handleDelete(notification.id)}
                      align="right"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>"""

new_map = """            {notifications.map(notification => {
              return (
                <div 
                  key={notification.id} 
                  className={notification.is_read ? 'bg-white dark:bg-neutral-900 p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800' : 'bg-primary-50 dark:bg-primary-900/20 p-4 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={notification.is_read ? 'font-medium text-neutral-900 dark:text-white' : 'font-semibold text-neutral-900 dark:text-white'}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                        {formatNotificationTime(notification.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.action_url && notification.action_label && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = notification.action_url}>
                          {notification.action_label}
                        </Button>
                      )}
                      {!notification.is_read && (
                        <Button variant="ghost" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleMarkAsRead(notification.id)} />
                      )}
                      <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => handleArchive(notification.id)} />
                      <Dropdown
                        trigger={
                          <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} />
                        }
                        items={[
                          { label: 'Delete', value: 'delete', icon: Trash2 as any, danger: true },
                        ]}
                        onSelect={(value) => value === 'delete' && handleDelete(notification.id)}
                        align="right"
                      />
                    </div>
                  </div>
                </div>
              );
            })}"""

if old_map in content:
    content = content.replace(old_map, new_map)
    print('Changed map to explicit return')
else:
    print('Map block not found')

with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'w') as f:
    f.write(content)
print('Done')