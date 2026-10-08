with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\ai\page.tsx', 'r') as f:
    content = f.read()

# Fix the ternary true branch to wrap in a fragment
old = """                {selectedConversationId && messages ? (
                  messages.map((message, index) => {
                    return (
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
                        <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`px-4 py-2 rounded-2xl ${message.role === 'user' ? 'bg-primary-500 text-white' : message.role === 'assistant' ? 'bg-primary-100 dark:bg-primary-900/30 text-neutral-900 dark:text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{format(new Date(message.created_at), 'HH:mm')}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={setMessagesEndRef} />
                ) : ("""

new = """                {selectedConversationId && messages ? (
                  <>
                    {messages.map((message, index) => {
                      return (
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
                          <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`px-4 py-2 rounded-2xl ${message.role === 'user' ? 'bg-primary-500 text-white' : message.role === 'assistant' ? 'bg-primary-100 dark:bg-primary-900/30 text-neutral-900 dark:text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}>
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{format(new Date(message.created_at), 'HH:mm')}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={setMessagesEndRef} />
                  </>
                ) : ("""

if old in content:
    content = content.replace(old, new)
    with open(r'C:\Users\ps800\productivity-suite\apps\web\src\app\(dashboard)\ai\page.tsx', 'w') as f:
        f.write(content)
    print('Fixed ternary true branch with fragment')
else:
    print('Old pattern not found')
    # Try to find what's there
    idx = content.find('{selectedConversationId && messages ? (')
    if idx != -1:
        print('Found at:', idx)
        print(content[idx:idx+500])