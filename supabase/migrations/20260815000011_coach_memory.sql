-- Migration: 20260815000011_coach_memory.sql
-- Description: AI Coach Memory Architecture

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Coach Memory Table
CREATE TABLE coach_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope TEXT NOT NULL CHECK (scope IN ('user', 'couple')),
    ref_id UUID NOT NULL, -- Either user_id or relationship_id
    kind TEXT NOT NULL CHECK (kind IN ('profile', 'resolution', 'session')),
    summary TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for vector similarity
CREATE INDEX ON coach_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_coach_memory_ref_id ON coach_memory (ref_id);

-- 2. Enable RLS
ALTER TABLE coach_memory ENABLE ROW LEVEL SECURITY;

-- Users can select/delete if scope='user' and ref_id=their_id
CREATE POLICY "Users can manage own user memory" ON coach_memory 
    FOR ALL USING (scope = 'user' AND ref_id = auth.uid());

-- Users can select/delete if scope='couple' and ref_id in their relationships
CREATE POLICY "Users can manage own couple memory" ON coach_memory 
    FOR ALL USING (
        scope = 'couple' AND ref_id IN (
            SELECT id FROM relationships WHERE user_a = auth.uid() OR user_b = auth.uid()
        )
    );


-- 3. Search RPC
CREATE OR REPLACE FUNCTION search_coach_memory(
    p_query_embedding vector(1536),
    p_scope TEXT,
    p_ref_id UUID,
    p_match_threshold FLOAT DEFAULT 0.7,
    p_match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    summary TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, postgis
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.summary,
        1 - (c.embedding <=> p_query_embedding) AS similarity
    FROM coach_memory c
    WHERE c.scope = p_scope 
      AND c.ref_id = p_ref_id
      AND 1 - (c.embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY c.embedding <=> p_query_embedding ASC
    LIMIT p_match_count;
END;
$$;
