with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\ai\page.tsx', 'r') as f:
    content = f.read()

# Fix the map return to use a fragment for the two sibling divs
old = """                      <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-primary-500' : message.role === 'assistant' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>

                        {message.role === 'user' ? (
                          <span className="text-sm font-medium text-white">You</span>
                        ) : message.role === 'assistant' ? (
                          <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        ) : (
                          <Settings className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>
                      <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>"""

new = """                      <>
                        <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-primary-500' : message.role === 'assistant' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>

                            {message.role === 'user' ? (
                              <span className="text-sm font-medium text-white">You</span>
                            ) : message.role === 'assistant' ? (
                              <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Settings className="w-4 h-4 text-neutral-500" />
                            )}
                          </div>
                          <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>"""

if old in content:
    content = content.replace(old, new)
    print('Fixed first part')
else:
    print('First part not found')

# Fix the closing of the map return
old2 = """                      </div>
                    );
                  })}
                  <div ref={setMessagesEndRef} />
                ) : ("""

new2 = """                      </div>
                      </>
                    );
                  })}
                  <div ref={setMessagesEndRef} />
                ) : ("""

if old2 in content:
    content = content.replace(old2, new2)
    print('Fixed second part')
else:
    print('Second part not found')

with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\ai\page.tsx', 'w') as f:
    f.write(content)
print('Done')