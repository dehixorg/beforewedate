-- Migration: 20260815000013_pulse.sql
-- Description: Feeling tracker / couple pulse

-- 1. Pulse Table
CREATE TABLE pulse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS Policies
ALTER TABLE pulse ENABLE ROW LEVEL SECURITY;

-- Users can only view and insert their OWN pulse entries.
-- They CANNOT see their partner's entries.
CREATE POLICY "Users can view own pulse" ON pulse 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pulse" ON pulse 
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        relationship_id IN (
            SELECT id FROM relationships WHERE user_a = auth.uid() OR user_b = auth.uid()
        )
    );
