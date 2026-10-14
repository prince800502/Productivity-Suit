-- AI Chat Functions
-- This migration adds helper functions for AI chat functionality

-- Function to increment conversation token count
CREATE OR REPLACE FUNCTION public.increment_conversation_tokens(
    conversation_id UUID,
    tokens INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.ai_conversations
    SET total_tokens = total_tokens + tokens,
        updated_at = NOW()
    WHERE id = conversation_id;
END;
$$;

-- Function to decrypt API key (placeholder - implement proper encryption in production)
-- For now, we assume the key is stored as-is or implement pgcrypto functions
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In production, implement proper decryption using pgcrypto
    -- For now, return as-is (assuming not encrypted in development)
    RETURN encrypted_key;
END;
$$;

-- Function to get AI provider with decrypted API key
CREATE OR REPLACE FUNCTION public.get_ai_provider_with_key(provider_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    provider TEXT,
    name TEXT,
    api_key TEXT,
    base_url TEXT,
    model TEXT,
    temperature DECIMAL(3,2),
    max_tokens INTEGER,
    capabilities TEXT[],
    rate_limit_rpm INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.id,
        ap.user_id,
        ap.provider,
        ap.name,
        public.decrypt_api_key(ap.api_key_encrypted) as api_key,
        ap.base_url,
        ap.model,
        ap.temperature,
        ap.max_tokens,
        ap.capabilities,
        ap.rate_limit_rpm
    FROM public.ai_providers ap
    WHERE ap.id = provider_id
    AND ap.is_active = true;
END;
$$;