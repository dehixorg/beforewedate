-- Migration: 20260815000009_discovery.sql
-- Description: In-zone discovery, ghost mode presence, event interactions and matches

-- 1. Updates to existing tables
ALTER TABLE venues ADD COLUMN meetup_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE event_checkins ADD COLUMN discovery_opt_in BOOLEAN NOT NULL DEFAULT false;

-- 2. Event Interactions Table
CREATE TABLE event_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, from_user_id, to_user_id)
);

-- 3. Event Matches Table
CREATE TABLE event_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meetup_point TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_a, user_b)
);

ALTER TABLE event_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own event interactions" ON event_interactions FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can read own event matches" ON event_matches FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 4. Get Anonymous Candidates RPC
-- Returns opted-in attendees at the event, excluding self and previous interactions
-- Alias is "Guest " + last 4 chars of user_id
CREATE OR REPLACE FUNCTION get_discovery_candidates(target_event_id UUID)
RETURNS TABLE (
    user_id UUID,
    alias TEXT,
    bio_snippet TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.user_id,
        'Guest ' || UPPER(RIGHT(c.user_id::text, 4)) AS alias,
        SUBSTRING(p.bio FROM 1 FOR 50) AS bio_snippet
    FROM event_checkins c
    JOIN profiles p ON p.user_id = c.user_id
    WHERE c.event_id = target_event_id
      AND c.discovery_opt_in = TRUE
      AND c.user_id != auth.uid()
      AND c.user_id NOT IN (
          SELECT to_user_id FROM event_interactions 
          WHERE event_id = target_event_id AND from_user_id = auth.uid()
      );
END;
$$;
