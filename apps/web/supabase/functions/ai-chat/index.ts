import { createClient } from "supabase";
import { OpenAI } from "openai";
import { Anthropic } from "anthropic";
import { GoogleGenerativeAI } from "google-auth-library";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface AIProvider {
  id: string;
  provider: string;
  name: string;
  api_key_encrypted: string | null;
  base_url: string | null;
  model: string;
  temperature: number;
  max_tokens: number;
  capabilities: string[];
  rate_limit_rpm: number;
}

interface ChatRequest {
  conversation_id: string;
  messages: ChatMessage[];
}

interface ChatResponse {
  content: string;
  role: "assistant";
  tool_calls?: any[];
  tokens_used?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function generateResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getDefaultProvider(supabase: any, userId: string): Promise<AIProvider | null> {
  const { data, error } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AIProvider;
}

async function getConversationMessages(supabase: any, conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content, tool_calls, tool_call_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return (data as ChatMessage[]) || [];
}

async function callOpenAI(provider: AIProvider, messages: ChatMessage[]): Promise<ChatResponse> {
  const openai = new OpenAI({
    apiKey: provider.api_key_encrypted,
    baseURL: provider.base_url || undefined,
  });

  const completion = await openai.chat.completions.create({
    model: provider.model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
    })),
    temperature: provider.temperature,
    max_tokens: provider.max_tokens,
  });

  const choice = completion.choices[0];
  return {
    content: choice.message.content || "",
    role: "assistant",
    tool_calls: choice.message.tool_calls,
    tokens_used: completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        }
      : undefined,
  };
}

async function callAnthropic(provider: AIProvider, messages: ChatMessage[]): Promise<ChatResponse> {
  const anthropic = new Anthropic({
    apiKey: provider.api_key_encrypted,
    baseURL: provider.base_url || undefined,
  });

  // Convert messages to Anthropic format
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const completion = await anthropic.messages.create({
    model: provider.model,
    system: systemMessage?.content || "",
    messages: conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    temperature: provider.temperature,
    max_tokens: provider.max_tokens,
  });

  return {
    content: completion.content[0]?.type === "text" ? completion.content[0].text : "",
    role: "assistant",
    tokens_used: completion.usage
      ? {
          prompt_tokens: completion.usage.input_tokens,
          completion_tokens: completion.usage.output_tokens,
          total_tokens: completion.usage.input_tokens + completion.usage.output_tokens,
        }
      : undefined,
  };
}

async function callGoogle(provider: AIProvider, messages: ChatMessage[]): Promise<ChatResponse> {
  const genAI = new GoogleGenerativeAI(provider.api_key_encrypted || "");
  const model = genAI.getGenerativeModel({ model: provider.model });

  // Convert messages to Google format
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const chat = model.startChat({
    history: conversationMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }),
    generationConfig: {
      temperature: provider.temperature,
      maxOutputTokens: provider.max_tokens,
    },
  });

  const lastMessage = conversationMessages[conversationMessages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);

  return {
    content: result.response.text(),
    role: "assistant",
    tokens_used: result.response.usageMetadata
      ? {
          prompt_tokens: result.response.usageMetadata.promptTokenCount,
          completion_tokens: result.response.usageMetadata.candidatesTokenCount,
          total_tokens: result.response.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

async function callOllama(provider: AIProvider, messages: ChatMessage[]): Promise<ChatResponse> {
  const baseUrl = provider.base_url || "http://localhost:11434";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: provider.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
      options: {
        temperature: provider.temperature,
        num_predict: provider.max_tokens,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.message?.content || "",
    role: "assistant",
    tokens_used: data.prompt_eval_count && data.eval_count
      ? {
          prompt_tokens: data.prompt_eval_count,
          completion_tokens: data.eval_count,
          total_tokens: data.prompt_eval_count + data.eval_count,
        }
      : undefined,
  };
}

async function callCustom(provider: AIProvider, messages: ChatMessage[]): Promise<ChatResponse> {
  if (!provider.base_url) {
    throw new Error("Custom provider requires a base URL");
  }

  const response = await fetch(`${provider.base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.api_key_encrypted}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: provider.temperature,
      max_tokens: provider.max_tokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Custom provider API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    role: "assistant",
    tokens_used: data.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

async function callAIProvider(provider: AIProvider, messages: ChatMessage[]): Promise<ChatResponse> {
  switch (provider.provider) {
    case "openai":
      return callOpenAI(provider, messages);
    case "anthropic":
      return callAnthropic(provider, messages);
    case "google":
      return callGoogle(provider, messages);
    case "ollama":
      return callOllama(provider, messages);
    case "custom":
      return callCustom(provider, messages);
    default:
      throw new Error(`Unsupported provider: ${provider.provider}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return generateResponse(405, { error: "Method not allowed" });
  }

  try {
    // Create Supabase client with the user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return generateResponse(401, { error: "Missing authorization header" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return generateResponse(401, { error: "Unauthorized" });
    }

    const body = await req.json();
    const { conversation_id, messages: clientMessages } = body as ChatRequest;

    if (!conversation_id) {
      return generateResponse(400, { error: "Missing conversation_id" });
    }

    // Get the default AI provider for this user
    const provider = await getDefaultProvider(supabase, user.id);
    if (!provider) {
      return generateResponse(400, {
        error: "No AI provider configured. Please add an AI provider in settings.",
      });
    }

    // Fetch conversation messages from database
    const dbMessages = await getConversationMessages(supabase, conversation_id);

    // Combine database messages with client messages (client messages are the new ones)
    // The client sends the full message history, so we use that
    const messages = clientMessages.length > 0 ? clientMessages : dbMessages;

    if (messages.length === 0) {
      return generateResponse(400, { error: "No messages provided" });
    }

    // Call the AI provider
    const aiResponse = await callAIProvider(provider, messages);

    // Store the assistant message in the database
    const { error: insertError } = await supabase.from("ai_messages").insert({
      conversation_id,
      role: "assistant",
      content: aiResponse.content,
      tool_calls: aiResponse.tool_calls,
      tokens_used: aiResponse.tokens_used?.total_tokens || 0,
      metadata: {
        provider: provider.provider,
        model: provider.model,
        tokens_used: aiResponse.tokens_used,
      },
    });

    if (insertError) {
      console.error("Failed to store AI message:", insertError);
      // Don't fail the request, just log the error
    }

    // Update conversation token count
    if (aiResponse.tokens_used) {
      await supabase.rpc("increment_conversation_tokens", {
        conversation_id,
        tokens: aiResponse.tokens_used.total_tokens,
      });
    }

    return generateResponse(200, {
      content: aiResponse.content,
      role: "assistant",
      tool_calls: aiResponse.tool_calls,
      tokens_used: aiResponse.tokens_used,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return generateResponse(500, {
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});