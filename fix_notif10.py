with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'r') as f:
    content = f.read()

# Add a separate component for notification list before the main component
# Find the export default line and add the component before it

old_export = """export default NotificationsPage;"""

new_component = """// Separate component for notification list to avoid JSX parsing issues
function NotificationList({
  isLoading,
  notifications,
  getNotificationColor,
  getNotificationIcon,
  formatNotificationTime,
  handleMarkAsRead,
  handleArchive,
  handleDelete,
}: {
  isLoading: boolean;
  notifications: any[];
  getNotificationColor: (priority: any) => string;
  getNotificationIcon: (type: any) => React.ReactNode;
  formatNotificationTime: (dateString: string) => string;
  handleMarkAsRead: (id: string) => void;
  handleArchive: (id: string) => void;
  handleDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }
  if (notifications && notifications.length > 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {notifications.map(notification => (
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
              ))}
            </div>
          </CardContent>
        </Card>
    );
  }
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Bell className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">No notifications found</p>
      </CardContent>
    </Card>
  );
}

export default NotificationsPage;"""

if old_export in content:
    content = content.replace(old_export, new_component)
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'w') as f:
        f.write(content)
    print('Added NotificationList component')
else:
    print('Export not found')

# Also replace the ternary in the main component with the NotificationList component
old_jsx = """{isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />)}
          </CardContent>
        </Card>
      ) : notifications && notifications.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {notifications.map(notification => (
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
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">No notifications found</p>
          </CardContent>
        </Card>
      )}"""

new_jsx = """<NotificationList
        isLoading={isLoading}
        notifications={notifications}
        getNotificationColor={getNotificationColor}
        getNotificationIcon={getNotificationIcon}
        formatNotificationTime={formatNotificationTime}
        handleMarkAsRead={handleMarkAsRead}
        handleArchive={handleArchive}
        handleDelete={handleDelete}
      />"""

if old_jsx in content:
    content = content.replace(old_jsx, new_jsx)
    print('Replaced ternary with NotificationList component')
else:
    print('JSX ternary not found')

with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\notifications\page.tsx', 'w') as f:
    f.write(content)
print('Done')