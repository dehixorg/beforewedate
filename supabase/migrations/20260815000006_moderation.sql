-- Migration: 20260815000006_moderation.sql
-- Description: Revoke direct message insertion and create reports table

-- 1. Revoke client insert access to messages
-- The policy was named "Users can insert messages to their matches" in the init script
DROP POLICY IF EXISTS "Users can insert messages to their matches" ON messages;

-- We still allow the backend (which uses service_role key) to bypass RLS,
-- so no new policy is strictly needed for insertion, but if we wanted to be explicit:
-- CREATE POLICY "Service role can insert messages" ON messages FOR INSERT WITH CHECK (true);
-- But service_role bypasses RLS anyway.

-- 2. Create reports table
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be null for auto-flags
    reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    message_context TEXT,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 3. RLS for reports
-- Users can insert a report if they are the reporter
CREATE POLICY "Users can insert their own reports" 
ON reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- Admins (using service_role) bypass RLS automatically for reading and updating.
-- We do not allow users to read the reports table.
