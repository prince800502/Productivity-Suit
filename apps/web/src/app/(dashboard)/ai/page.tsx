'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Send, Bot, Sparkles, Copy, Check, AlertCircle, Settings, X, ChevronLeft, ChevronRight, MessageSquare, Zap, Brain, Download, Upload } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Select, Badge, Modal, Tabs, Textarea, Switch
} from '@productivity-suite/ui';
import { useAIContext, useDefaultAIProvider, useAIConversations, useCreateAIConversation, useAIMessages, useSendAIMessage, useCreateAICommand, useAICommands, useGenerateWeeklyReport, useLatestAIWeeklyReport, AIProvider, AIConversation, AIMessage, AIContext } from '@productivity-suite/core';
import { useAIProviders, useCreateAIProvider, useUpdateAIProvider, useDeleteAIProvider, AIProviderForm } from '@productivity-suite/core';
import { formatCurrency } from '@productivity-suite/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const aiProviderSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'custom']),
  name: z.string().min(1).max(50),
  api_key: z.string().optional(),
  base_url: z.string().url().optional().or(z.literal('')),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().default(4000),
  capabilities: z.array(z.enum(['chat', 'completion', 'embedding', 'function_calling'])).default(['chat']),
  rate_limit_rpm: z.number().int().positive().default(60),
});

const aiConversationSchema = z.object({
  ai_provider_id: z.string().uuid().optional(),
  title: z.string().max(100).optional(),
  system_prompt: z.string().max(2000).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const aiMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  tool_calls: z.unknown().optional(),
  tool_call_id: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'conversations' | 'providers' | 'reports'>('chat');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<any>(null);
  const [messagesEndRef, setMessagesEndRef] = useRef<HTMLDivElement>(null);
  const [showConfigBanner, setShowConfigBanner] = useState(false);

  const { data: context } = useAIContext();
  const { data: defaultProvider } = useDefaultAIProvider();
  const { data: providers } = useAIProviders();
  const { data: conversations } = useAIConversations({ limit: 20 });
  const { data: messages } = useAIMessages(selectedConversationId || '');
  const { data: commands } = useAICommands({ limit: 10 });
  const { data: latestReport } = useLatestAIWeeklyReport();

  const createProvider = useCreateAIProvider();
  const updateProvider = useUpdateAIProvider();
  const deleteProvider = useDeleteAIProvider();
  const createConversation = useCreateAIConversation();
  const sendMessage = useSendAIMessage();
  const createCommand = useCreateAICommand();
  const generateReport = useGenerateWeeklyReport();

  const { register: regProvider, handleSubmit: handleSubmitProvider, reset: resetProvider, formState: { errors: providerErrors, isSubmitting: providerSubmitting } } = useForm<z.infer<typeof aiProviderSchema>>({
    resolver: zodResolver(aiProviderSchema),
    defaultValues: {
      provider: 'openai',
      temperature: 0.7,
      max_tokens: 4000,
      capabilities: ['chat'],
      rate_limit_rpm: 60,
    },
  });

  const { register: regConv, handleSubmit: handleSubmitConv, reset: resetConv, formState: { errors: convErrors, isSubmitting: convSubmitting } } = useForm<z.infer<typeof aiConversationSchema>>({
    resolver: zodResolver(aiConversationSchema),
    defaultValues: {},
  });

  useEffect(() => {
    setMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!defaultProvider && providers && providers.length === 0) {
      setShowConfigBanner(true);
    } else {
      setShowConfigBanner(false);
    }
  }, [defaultProvider, providers]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || isLoading) return;

    setIsLoading(true);
    try {
      // Send user message
      await sendMessage.mutateAsync({
        conversation_id: selectedConversationId,
        role: 'user',
        content: newMessage,
      });

      // Here you would call the AI provider API
      // For now, we'll add a placeholder response
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const data = await createConversation.mutateAsync({
        title: 'New Conversation',
        ai_provider_id: defaultProvider?.id,
      });
      setSelectedConversationId(data.id);
      setActiveTab('chat');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleCreateProvider = async (data: z.infer<typeof aiProviderSchema>) => {
    try {
      if (editingProvider) {
        await updateProvider.mutateAsync({ id: editingProvider.id, updates: data });
      } else {
        await createProvider.mutateAsync(data);
      }
      setIsProviderModalOpen(false);
      setEditingProvider(null);
      resetProvider();
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (confirm('Delete this AI provider?')) {
      await deleteProvider.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {showConfigBanner && (
        <Card className="mb-6 border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              <div>
                <p className="font-medium text-warning-800 dark:text-warning-200">AI Provider Not Configured</p>
                <p className="text-sm text-warning-700 dark:text-warning-300">Add an AI provider to enable the AI Assistant features.</p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => { setActiveTab('providers'); setIsProviderModalOpen(true); }}>
              Add Provider
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">AI Assistant</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Your productivity copilot powered by AI</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" }} onClick={() => {}}>
            Export Chat
          </Button>
          {activeTab === 'chat' && (
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleNewConversation}>
              New Chat
            </Button>
          )}
          {activeTab === 'providers' && (
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingProvider(null); resetProvider(); setIsProviderModalOpen(true); }}>
              Add Provider
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={[
        { value: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
        { value: 'conversations', label: 'History', icon: <MessageSquare className="w-4 h-4" /> },
        { value: 'providers', label: 'Providers', icon: <Zap className="w-4 h-4" /> },
        { value: 'reports', label: 'Reports', icon: <Brain className="w-4 h-4" /> },
      ]} fullWidth />

      {activeTab === 'chat' && (
        <div className="h-[calc(100vh-300px)] flex flex-col">
          <div className="flex-1 flex flex-col">
            {/* Conversation List Sidebar (collapsible on mobile) */}
            <div className="hidden lg:block w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations?.map(conv => (
                  <button
                    key={conv.id}
                    className={`w-full px-4 py-3 text-left transition-colors ${selectedConversationId === conv.id ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <p className="font-medium text-sm truncate text-neutral-900 dark:text-white">
                      {conv.title || 'Untitled Conversation'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1">
                      {conv.updated_at ? format(new Date(conv.updated_at), 'MMM d, HH:mm') : 'New'}
                    </p>
                  </button>
                ))}
                {(!conversations || conversations.length === 0) && (
                  <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                    No conversations yet
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversationId && messages ? (
                  messages.map((message, index) => (
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
                  ))}
                  <div ref={setMessagesEndRef} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Welcome to AI Assistant</h3>
                      <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md">
                        Start a new conversation to get help with tasks, planning, analysis, and more.
                      </p>
                      <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleNewConversation}>
                        Start New Conversation
                      </Button>
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-neutral-900 dark:text-white animate-pulse">
                      AI is thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={!defaultProvider ? 'Configure an AI provider first' : 'Type your message...'}
                    placeholderText={!defaultProvider ? 'Configure an AI provider first' : 'Type your message...'}
                    rows={1}
                    className="flex-1"
                    disabled={!defaultProvider || !selectedConversationId || isLoading}
                  />
                  <Button type="submit" icon={<Send className="w-4 h-4" />} disabled={!newMessage.trim() || !defaultProvider || !selectedConversationId || isLoading} />
                </form>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Conversation List */}
          <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-800">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold">Conversations</h3>
              <Button variant="ghost" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleNewConversation} />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {conversations?.map(conv => (
                <button
                  key={conv.id}
                  className={`w-full px-4 py-3 text-left transition-colors ${selectedConversationId === conv.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <p className="font-medium text-sm truncate">{conv.title || 'Untitled'}</p>
                  <p className="text-xs text-neutral-500 truncate">{conv.updated_at ? format(new Date(conv.updated_at), 'MMM d') : 'New'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conversations' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Conversation History</CardTitle>
              <CardDescription>Your past AI conversations</CardDescription>
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={handleNewConversation}>
              New Conversation
            </Button>
          </CardHeader>
          <CardContent>
            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map(conv => (
                  <div key={conv.id} className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{conv.title || 'Untitled Conversation'}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {conv.updated_at ? format(new Date(conv.updated_at), 'MMM d, yyyy HH:mm') : 'New'} • {conv.total_tokens || 0} tokens
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedConversationId(conv.id); setActiveTab('chat'); }}>
                        Continue
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => { if (confirm('Delete this conversation?')) { /* delete */ } }} />
                    </div>
                  </div>
                ))}
            </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">No conversations yet</p>
                <Button onClick={handleNewConversation} icon={<Plus className="w-4 h-4" />}>
                  Start your first conversation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'providers' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AI Providers</CardTitle>
                <CardDescription>Configure AI providers for the assistant</CardDescription>
              </div>
              <Button onClick={() => { setEditingProvider(null); resetProvider(); setIsProviderModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                Add Provider
              </Button>
            </CardHeader>
            <CardContent>
              {providers && providers.length > 0 ? (
                <div className="space-y-3">
                  {providers.map(provider => (
                    <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{provider.name}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {provider.provider} • {provider.model} • {provider.is_default ? 'Default' : 'Secondary'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.is_default && <Badge variant="success" size="sm">Default</Badge>}
                        <Button variant="ghost" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => { setEditingProvider(provider); setIsProviderModalOpen(true); }} />
                        <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => handleDeleteProvider(provider.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">No AI providers configured</p>
                  <Button onClick={() => { setEditingProvider(null); resetProvider(); setIsProviderModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
                    Add your first provider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Models</CardTitle>
              <CardDescription>Common models for each provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { provider: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
                  { provider: 'Anthropic', models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'] },
                  { provider: 'Google', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
                  { provider: 'Ollama (Local)', models: ['llama3', 'mistral', 'codellama', 'phi3'] },
                ].map(item => (
                  <Card key={item.provider} className="p-4">
                    <h4 className="font-medium text-neutral-900 dark:text-white mb-2">{item.provider}</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.models.map(model => (
                        <Badge key={model} variant="outline" size="sm">{model}</Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Weekly AI Reports</CardTitle>
                <CardDescription>AI-generated productivity summaries</CardDescription>
              </div>
              <Button icon={<Sparkles className="w-4 h-4" />} onClick={async () => { await generateReport.mutateAsync(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')); }}>
                Generate Report
              </Button>
            </CardHeader>
            <CardContent>
              {latestReport ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                    <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">
                      Week of {format(new Date(latestReport.week_start), 'MMM d')} - {format(new Date(latestReport.week_end), 'MMM d, yyyy')}
                    </h3>
                    <p className="text-primary-700 dark:text-primary-300">{latestReport.summary}</p>
                  </div>

                  {latestReport.insights && latestReport.insights.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Insights</h4>
                      <div className="space-y-2">
                        {latestReport.insights.map((insight: any, index: number) => (
                          <Card key={index} className="p-4">
                            <p className="text-neutral-700 dark:text-neutral-300">{insight}</p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestReport.recommendations && latestReport.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {latestReport.recommendations.map((rec: any, index: number) => (
                          <Card key={index} className="p-4 border-l-4 border-primary-500">
                            <p className="text-neutral-700 dark:text-neutral-300">{rec}</p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <span>Generated: {latestReport.created_at ? format(new Date(latestReport.created_at), 'MMM d, yyyy HH:mm') : 'Unknown'}</span>
                    <span>{latestReport.tokens_used || 0} tokens used</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">No weekly reports generated yet</p>
                  <Button onClick={async () => { await generateReport.mutateAsync(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')); }} icon={<Sparkles className="w-4 h-4" />}>
                    Generate your first report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {commands && commands.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Commands</CardTitle>
                <CardDescription>Track AI command executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commands.slice(0, 10).map(command => (
                    <div key={command.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-white truncate">{command.command_text}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{command.parsed_intent || 'Unknown intent'}</p>
                      </div>
                      <Badge variant={command.status === 'completed' ? 'success' : command.status === 'failed' ? 'danger' : command.status === 'executing' ? 'warning' : 'default'} size="sm">
                        {command.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Provider Modal */}
      <Modal isOpen={isProviderModalOpen} onClose={() => { setIsProviderModalOpen(false); setEditingProvider(null); resetProvider(); }} title={editingProvider ? 'Edit AI Provider' : 'Add AI Provider'} size="lg">
        <form onSubmit={handleSubmitProvider(handleCreateProvider)} className="space-y-4">
          <Select label="Provider" options={[
            { value: 'openai', label: 'OpenAI' },
            { value: 'anthropic', label: 'Anthropic' },
            { value: 'google', label: 'Google' },
            { value: 'ollama', label: 'Ollama (Local)' },
            { value: 'custom', label: 'Custom' },
          ]} error={providerErrors.provider?.message} {...regProvider('provider')} required />
          <Input label="Name" placeholder="My OpenAI" error={providerErrors.name?.message} {...regProvider('name')} required />
          <Input label="API Key" type="password" placeholder="sk-..." error={providerErrors.api_key?.message} {...regProvider('api_key')} />
          <Input label="Base URL (optional)" placeholder="https://api.openai.com/v1" {...regProvider('base_url')} />
          <Input label="Model" placeholder="gpt-4o" error={providerErrors.model?.message} {...regProvider('model')} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Temperature" type="number" min="0" max="2" step="0.1" error={providerErrors.temperature?.message} {...regProvider('temperature', { valueAsNumber: true })} />
            <Input label="Max Tokens" type="number" min="1" max="128000" step="1" error={providerErrors.max_tokens?.message} {...regProvider('max_tokens', { valueAsNumber: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rate Limit (RPM)" type="number" min="1" max="1000" step="1" error={providerErrors.rate_limit_rpm?.message} {...regProvider('rate_limit_rpm', { valueAsNumber: true })} />
            <Select label="Capabilities" options={[
              { value: 'chat', label: 'Chat' },
              { value: 'completion', label: 'Completion' },
              { value: 'embedding', label: 'Embedding' },
              { value: 'function_calling', label: 'Function Calling' },
            ]} error={providerErrors.capabilities?.message} {...regProvider('capabilities')} multiple />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsProviderModalOpen(false); setEditingProvider(null); resetProvider(); }}>Cancel</Button>
            <Button type="submit" loading={providerSubmitting}>{editingProvider ? 'Save Changes' : 'Add Provider'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const aiProviderSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'custom']),
  name: z.string().min(1).max(50),
  api_key: z.string().optional(),
  base_url: z.string().url().optional().or(z.literal('')),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().int().positive().default(4000),
  capabilities: z.array(z.enum(['chat', 'completion', 'embedding', 'function_calling'])).default(['chat']),
  rate_limit_rpm: z.number().int().positive().default(60),
});

const aiConversationSchema = z.object({
  ai_provider_id: z.string().uuid().optional(),
  title: z.string().max(100).optional(),
  system_prompt: z.string().max(2000).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const aiMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  tool_calls: z.unknown().optional(),
  tool_call_id: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});