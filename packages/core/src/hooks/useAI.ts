import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { 
  AIProvider, AIConversation, AIMessage, AICommand, AIWeeklyReport,
  AIProviderForm, AIConversationForm, AIMessageForm, AICommandForm,
  AIProviderType, AIContext, ParsedCommand, AIAction 
} from '../types';

// Query keys
export const aiKeys = {
  all: ['ai'] as const,
  providers: () => [...aiKeys.all, 'providers'] as const,
  provider: (id: string) => [...aiKeys.providers(), id] as const,
  defaultProvider: () => [...aiKeys.all, 'default-provider'] as const,
  conversations: () => [...aiKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...aiKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) => [...aiKeys.all, 'messages', conversationId] as const,
  commands: () => [...aiKeys.all, 'commands'] as const,
  command: (id: string) => [...aiKeys.all, 'command', id] as const,
  weeklyReports: () => [...aiKeys.all, 'weekly-reports'] as const,
  weeklyReport: (id: string) => [...aiKeys.all, 'weekly-report', id] as const,
  latestWeeklyReport: () => [...aiKeys.all, 'latest-weekly-report'] as const,
  context: () => [...aiKeys.all, 'context'] as const,
};

// ============================================================
// AI PROVIDERS
// ============================================================

export function useAIProviders() {
  return useQuery({
    queryKey: aiKeys.providers(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AIProvider[];
    },
  });
}

export function useDefaultAIProvider() {
  return useQuery({
    queryKey: aiKeys.defaultProvider(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as AIProvider | null;
    },
  });
}

export function useAIProvider(id: string) {
  return useQuery({
    queryKey: aiKeys.provider(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as AIProvider;
    },
    enabled: !!id,
  });
}

export function useCreateAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: AIProviderForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If this is set as default, unset other defaults
      if (provider.is_default) {
        await supabase
          .from('ai_providers')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('ai_providers')
        .insert({ ...provider, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as AIProvider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.providers() });
      queryClient.invalidateQueries({ queryKey: aiKeys.defaultProvider() });
    },
  });
}

export function useUpdateAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIProviderForm> }) => {
      // If setting as default, unset other defaults
      if (updates.is_default) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('ai_providers')
            .update({ is_default: false })
            .eq('user_id', user.id)
            .neq('id', id);
        }
      }

      const { data, error } = await supabase
        .from('ai_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AIProvider;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.providers() });
      queryClient.invalidateQueries({ queryKey: aiKeys.provider(id) });
      queryClient.invalidateQueries({ queryKey: aiKeys.defaultProvider() });
    },
  });
}

export function useDeleteAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_providers').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.providers() });
      queryClient.invalidateQueries({ queryKey: aiKeys.defaultProvider() });
    },
  });
}

// ============================================================
// AI CONVERSATIONS
// ============================================================

export function useAIConversations(filters?: { is_archived?: boolean; limit?: number }) {
  return useQuery({
    queryKey: aiKeys.conversations(),
    queryFn: async () => {
      let query = supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.is_archived !== undefined) {
        query = query.eq('is_archived', filters.is_archived);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AIConversation[];
    },
  });
}

export function useAIConversation(id: string) {
  return useQuery({
    queryKey: aiKeys.conversation(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as AIConversation;
    },
    enabled: !!id,
  });
}

export function useAIMessages(conversationId: string) {
  return useQuery({
    queryKey: aiKeys.messages(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as AIMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useCreateAIConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversation: AIConversationForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ ...conversation, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as AIConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations() });
    },
  });
}

export function useUpdateAIConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIConversationForm> }) => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as AIConversation;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: aiKeys.conversation(id) });
    },
  });
}

export function useDeleteAIConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_conversations').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations() });
    },
  });
}

// ============================================================
// AI MESSAGES
// ============================================================

export function useSendAIMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: AIMessageForm) => {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert(message)
        .select()
        .single();
      if (error) throw error;
      return data as AIMessage;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: aiKeys.messages(vars.conversation_id) });
      queryClient.invalidateQueries({ queryKey: aiKeys.conversation(vars.conversation_id) });
    },
  });
}

export function useDeleteAIMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_messages').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.all });
    },
  });
}

// ============================================================
// AI COMMANDS
// ============================================================

export function useAICommands(filters?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: aiKeys.commands(),
    queryFn: async () => {
      let query = supabase
        .from('ai_commands')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AICommand[];
    },
  });
}

export function useAICommand(id: string) {
  return useQuery({
    queryKey: aiKeys.command(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_commands')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as AICommand;
    },
    enabled: !!id,
  });
}

export function useCreateAICommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: AICommandForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_commands')
        .insert({ ...command, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as AICommand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.commands() });
    },
  });
}

export function useExecuteAICommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commandId: string) => {
      // This would call an Edge Function to execute the command
      // For now, we just update the status
      const { data, error } = await supabase
        .from('ai_commands')
        .update({ 
          status: 'executing',
          executed_at: new Date().toISOString(),
        })
        .eq('id', commandId)
        .select()
        .single();
      if (error) throw error;
      return data as AICommand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.commands() });
    },
  });
}

// ============================================================
// AI WEEKLY REPORTS
// ============================================================

export function useAIWeeklyReports(filters?: { limit?: number }) {
  return useQuery({
    queryKey: aiKeys.weeklyReports(),
    queryFn: async () => {
      let query = supabase
        .from('ai_weekly_reports')
        .select('*')
        .order('week_start', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AIWeeklyReport[];
    },
  });
}

export function useLatestAIWeeklyReport() {
  return useQuery({
    queryKey: aiKeys.latestWeeklyReport(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_weekly_reports')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AIWeeklyReport | null;
    },
  });
}

export function useAIWeeklyReport(id: string) {
  return useQuery({
    queryKey: aiKeys.weeklyReport(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_weekly_reports')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as AIWeeklyReport;
    },
    enabled: !!id,
  });
}

export function useGenerateWeeklyReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weekStart: string) => {
      // This would call an Edge Function to generate the report using AI
      // For now, we create a placeholder
      const weekEnd = format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_weekly_reports')
        .insert({
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          report_data: { generated: true, timestamp: new Date().toISOString() },
          summary: 'Report generation in progress...',
          insights: [],
          recommendations: [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as AIWeeklyReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.weeklyReports() });
      queryClient.invalidateQueries({ queryKey: aiKeys.latestWeeklyReport() });
    },
  });
}

// ============================================================
// AI CONTEXT (For Assistant)
// ============================================================

export function useAIContext() {
  return useQuery({
    queryKey: aiKeys.context(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch all user data for AI context
      const [
        { data: tasks },
        { data: expenses },
        { data: goals },
        { data: habits },
        { data: pomodoro },
        { data: schedule },
        { data: routines },
        { data: budgets },
        { data: savingsGoals },
        { data: recurringExpenses },
        { data: profile },
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'archived'),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
        supabase.from('goals').select('*').eq('user_id', user.id).neq('status', 'archived'),
        supabase.from('habits').select('*').eq('user_id', user.id).is('archived_at', null),
        supabase.from('pomodoro_sessions').select('*').eq('user_id', user.id).eq('status', 'completed').order('started_at', { ascending: false }).limit(50),
        supabase.from('schedule_events').select('*').eq('user_id', user.id).eq('is_recurring', true),
        supabase.from('routines').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('budgets').select('*, category_budgets(*)').eq('user_id', user.id).order('month', { ascending: false }).limit(1),
        supabase.from('savings_goals').select('*').eq('user_id', user.id).eq('is_completed', false),
        supabase.from('recurring_expenses').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);

      return {
        user_id: user.id,
        tasks: tasks as any[] || [],
        expenses: expenses as any[] || [],
        goals: goals as any[] || [],
        habits: habits as any[] || [],
        pomodoro_sessions: pomodoro as any[] || [],
        schedule_events: schedule as any[] || [],
        routines: routines as any[] || [],
        budgets: budgets as any[] || [],
        savings_goals: savingsGoals as any[] || [],
        recurring_expenses: recurringExpenses as any[] || [],
        preferences: null, // Would fetch from notification_preferences
        profile: profile as any || null,
      } as AIContext;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================
// AI SERVICE FUNCTIONS (for Edge Functions)
// ============================================================

// These would be implemented as Supabase Edge Functions
// Here we define the interfaces for the AI service

export interface AIService {
  // Chat completion
  chatCompletion: (params: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: any[];
    toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  }) => Promise<{
    content: string;
    toolCalls?: any[];
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }>;

  // Generate embeddings
  generateEmbedding: (text: string) => Promise<number[]>;

  // Parse natural language command
  parseCommand: (command: string, context: AIContext) => Promise<ParsedCommand>;

  // Generate weekly report
  generateWeeklyReport: (context: AIContext, weekStart: string, weekEnd: string) => Promise<{
    summary: string;
    insights: any[];
    recommendations: any[];
    reportData: Record<string, any>;
  }>;

  // Smart scheduling
  generateSchedule: (params: {
    tasks: any[];
    habits: any[];
    events: any[];
    availableHours: { day: number; start: string; end: string }[];
    preferences: any;
  }) => Promise<any[]>;

  // Task breakdown
  breakDownTask: (taskTitle: string, taskDescription: string, context: AIContext) => Promise<{
    subtasks: Array<{ title: string; description?: string; estimatedMinutes: number; priority: string }>;
  }>;

  // Financial insights
  generateFinancialInsights: (expenses: any[], budgets: any[], recurringExpenses: any[]) => Promise<string[]>;

  // Productivity insights
  generateProductivityInsights: (context: AIContext) => Promise<string[]>;
}

// Mock AI service for development (replace with actual Edge Function calls)
export const mockAIService: AIService = {
  async chatCompletion({ messages, model = 'gpt-4', temperature = 0.7, maxTokens = 4000 }) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      content: 'This is a mock AI response. In production, this would call the actual AI provider.',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    };
  },

  async generateEmbedding(text: string) {
    // Return mock embedding (1536 dimensions for OpenAI)
    return Array(1536).fill(0).map(() => Math.random());
  },

  async parseCommand(command: string, context: AIContext) {
    // Simple keyword-based parsing for demo
    const lowerCommand = command.toLowerCase();
    let intent = 'unknown';
    const entities: Record<string, any> = {};
    const actions: AIAction[] = [];

    if (lowerCommand.includes('add expense') || lowerCommand.includes('spent')) {
      intent = 'add_expense';
      const amountMatch = command.match(/₹?(\d+(?:\.\d+)?)/);
      if (amountMatch) entities.amount = parseFloat(amountMatch[1]);
      actions.push({ type: 'create_expense', payload: entities, description: 'Create expense' });
    } else if (lowerCommand.includes('create task') || lowerCommand.includes('add task')) {
      intent = 'create_task';
      actions.push({ type: 'create_task', payload: { title: command.replace(/create task|add task/gi, '').trim() }, description: 'Create task' });
    } else if (lowerCommand.includes('schedule') || lowerCommand.includes('plan')) {
      intent = 'schedule_tasks';
      actions.push({ type: 'smart_schedule', payload: {}, description: 'Generate smart schedule' });
    } else if (lowerCommand.includes('break down') || lowerCommand.includes('break this')) {
      intent = 'breakdown_task';
      actions.push({ type: 'breakdown_task', payload: { description: command }, description: 'Break down task' });
    } else if (lowerCommand.includes('report') || lowerCommand.includes('summary')) {
      intent = 'generate_report';
      actions.push({ type: 'generate_report', payload: {}, description: 'Generate productivity report' });
    }

    return { intent, entities, confidence: intent !== 'unknown' ? 0.8 : 0.3, actions };
  },

  async generateWeeklyReport(context: AIContext, weekStart: string, weekEnd: string) {
    return {
      summary: `Weekly report for ${weekStart} to ${weekEnd}. You completed ${context.tasks?.filter(t => t.status === 'done').length || 0} tasks.`,
      insights: ['You spent more time on focus sessions this week', 'Your habit consistency improved'],
      recommendations: ['Try to maintain the current focus streak', 'Consider adding a new habit'],
      reportData: { tasksCompleted: context.tasks?.filter(t => t.status === 'done').length || 0 },
    };
  },

  async generateSchedule({ tasks, habits, events, availableHours }: { 
    tasks: any[]; 
    habits: any[]; 
    events: any[]; 
    availableHours: any[] 
  }) {
    // Simple scheduling algorithm
    const schedule: any[] = [];
    let currentTime = '09:00';
    
    const parseTime = (timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    
    const formatTime = (date: Date): string => {
      return date.toTimeString().slice(0, 5);
    };
    
    let currentDate = parseTime(currentTime);
    
    tasks.filter((t: any) => t.status !== 'done' && t.status !== 'archived')
      .sort((a: any, b: any) => (b.priority === 'urgent' ? 4 : b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) - 
                        (a.priority === 'urgent' ? 4 : a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1))
      .forEach((task: any) => {
        const duration = task.estimated_minutes || 60;
        const startTime = formatTime(currentDate);
        currentDate = addMinutes(currentDate, duration);
        const endTime = formatTime(currentDate);
        
        schedule.push({
          task_id: task.id,
          title: task.title,
          start_time: startTime,
          end_time: endTime,
          day_of_week: new Date().getDay().toString(),
        });
        currentDate = addMinutes(currentDate, 15); // 15 min buffer
      });
    
    return schedule;
  },

  async breakDownTask(taskTitle: string, taskDescription: string, context: AIContext) {
    return {
      subtasks: [
        { title: `Research: ${taskTitle}`, description: 'Gather information and resources', estimatedMinutes: 30, priority: 'high' },
        { title: `Plan: ${taskTitle}`, description: 'Create step-by-step plan', estimatedMinutes: 20, priority: 'high' },
        { title: `Execute: ${taskTitle}`, description: 'Complete the main work', estimatedMinutes: 60, priority: 'medium' },
        { title: `Review: ${taskTitle}`, description: 'Review and refine', estimatedMinutes: 15, priority: 'medium' },
      ],
    };
  },

  async generateFinancialInsights(expenses: any[], budgets: any[], recurringExpenses: any[]) {
    const insights = [];
    
    // Category spending analysis
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push(`Your highest spending category is ${topCategory[0]} at $${topCategory[1].toFixed(2)}`);
    }
    
    // Subscription analysis
    const subscriptionTotal = recurringExpenses.reduce((sum, r) => sum + r.amount, 0);
    if (subscriptionTotal > 0) {
      insights.push(`Your active subscriptions total $${subscriptionTotal.toFixed(2)}/month`);
    }
    
    // Budget adherence
    if (budgets.length > 0) {
      const budget = budgets[0];
      const spent = expenses.filter(e => new Date(e.date) >= new Date(budget.month)).reduce((sum, e) => sum + e.amount, 0);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      if (percentage > 80) {
        insights.push(`You've used ${percentage.toFixed(0)}% of your monthly budget`);
      }
    }
    
    return insights;
  },

  async generateProductivityInsights(context: AIContext) {
    const insights = [];
    
    const completedTasks = context.tasks?.filter(t => t.status === 'done').length || 0;
    const totalTasks = context.tasks?.length || 0;
    if (totalTasks > 0) {
      insights.push(`Task completion rate: ${Math.round((completedTasks / totalTasks) * 100)}%`);
    }
    
    const focusMinutes = context.pomodoro_sessions?.reduce((sum, s) => sum + s.completed_minutes, 0) || 0;
    insights.push(`Total focus time: ${Math.round(focusMinutes / 60)}h ${focusMinutes % 60}m`);
    
    const activeHabits = context.habits?.length || 0;
    insights.push(`Active habits: ${activeHabits}`);
    
    return insights;
  },
};

// Helper functions
import { format, addDays, addMinutes } from 'date-fns';

// Natural language command patterns for the command palette
export const AI_COMMAND_PATTERNS = [
  { pattern: /^add\s+(\d+(?:\.\d+)?)\s+(\w+)\s+expense$/i, intent: 'add_expense', example: 'Add 250 food expense' },
  { pattern: /^create\s+(?:a\s+)?task\s+(.+)$/i, intent: 'create_task', example: 'Create task to complete DBMS assignment tomorrow' },
  { pattern: /^schedule\s+(?:my\s+)?(?:pending\s+)?tasks?$/i, intent: 'schedule_tasks', example: 'Schedule my pending tasks' },
  { pattern: /^break\s+(?:down\s+)?(?:this\s+)?(?:project|task)\s+(.+)$/i, intent: 'breakdown_task', example: 'Break this project into smaller tasks' },
  { pattern: /^study\s+(\w+)\s+for\s+(\d+)\s+hours?$/i, intent: 'create_study_session', example: 'Study DSA for 2 hours tonight' },
  { pattern: /^set\s+(?:a\s+)?goal\s+to\s+(.+)$/i, intent: 'create_goal', example: 'Set a goal to save ₹50,000' },
  { pattern: /^what\s+(?:did\s+)?(?:i\s+)?accomplish\s+(?:this\s+)?week$/i, intent: 'weekly_summary', example: 'What did I accomplish this week?' },
  { pattern: /^why\s+am\s+i\s+spending\s+more\s+(?:money\s+)?(?:this\s+month)?$/i, intent: 'financial_insight', example: 'Why am I spending more money this month?' },
  { pattern: /^i\s+have\s+(\d+)\s+hours?\s+today\.?\s*schedule\s+my\s+work$/i, intent: 'smart_schedule', example: 'I have 4 hours today. Schedule my work.' },
  { pattern: /^create\s+(?:a\s+)?study\s+plan\s+for\s+(\w+)$/i, intent: 'create_study_plan', example: 'Create a study plan for DSA' },
  { pattern: /^add\s+habit\s+(.+)$/i, intent: 'create_habit', example: 'Add habit: Exercise for 30 minutes' },
  { pattern: /^start\s+pomodoro$/i, intent: 'start_pomodoro', example: 'Start Pomodoro' },
  { pattern: /^open\s+(\w+)$/i, intent: 'navigate', example: 'Open analytics' },
];

// Parse natural language command using patterns
export function parseNaturalLanguageCommand(command: string): { intent: string; entities: Record<string, any>; confidence: number } | null {
  for (const { pattern, intent } of AI_COMMAND_PATTERNS) {
    const match = command.match(pattern);
    if (match) {
      const entities: Record<string, any> = {};
      // Extract captured groups
      for (let i = 1; i < match.length; i++) {
        entities[`param${i}`] = match[i];
      }
      return { intent, entities, confidence: 0.9 };
    }
  }
  return null;
}