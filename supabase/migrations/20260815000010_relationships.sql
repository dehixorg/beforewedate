-- Migration: 20260815000010_relationships.sql
-- Description: Relationship state machine, tables, and off-market exclusion

-- 1. Users Status
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'dating' CHECK (status IN ('dating', 'official', 'paused'));

-- 2. Matches Updates
ALTER TABLE matches ADD COLUMN go_official_a BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE matches ADD COLUMN go_official_b BOOLEAN NOT NULL DEFAULT false;

-- 3. Relationships Table
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state TEXT NOT NULL DEFAULT 'official' CHECK (state IN ('official', 'paused', 'ended')),
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paused_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_a, user_b)
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own relationships" ON relationships FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
-- Backend handles all state changes via service_role to ensure strict rules.

-- 4. Trigger for Mutual Entry
CREATE OR REPLACE FUNCTION handle_go_official()
RETURNS TRIGGER AS $$
BEGIN
    -- If both just became true, create relationship and pull off market
    IF NEW.go_official_a = TRUE AND NEW.go_official_b = TRUE AND
       (OLD.go_official_a = FALSE OR OLD.go_official_b = FALSE) THEN
       
       -- Insert relationship
       INSERT INTO relationships (user_a, user_b, state)
       VALUES (NEW.user_a, NEW.user_b, 'official');
       
       -- Pull both off market
       UPDATE users SET status = 'official' WHERE id IN (NEW.user_a, NEW.user_b);
       
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_go_official ON matches;
CREATE TRIGGER trg_go_official
AFTER UPDATE OF go_official_a, go_official_b ON matches
FOR EACH ROW EXECUTE FUNCTION handle_go_official();

-- 5. Recommender Exclusion Update
-- (Re-defining get_deck_candidates from M2 to exclude non-dating users)
CREATE OR REPLACE FUNCTION get_deck_candidates(target_user_id UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    user_id UUID,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, postgis
AS $$
DECLARE
    target_embedding vector(1536);
    target_mode TEXT;
BEGIN
    SELECT embedding, mode INTO target_embedding, target_mode 
    FROM profiles WHERE profiles.user_id = target_user_id;

    RETURN QUERY
    SELECT p.user_id, 1 - (p.embedding <=> target_embedding) AS similarity
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE p.user_id != target_user_id
      AND p.mode = target_mode
      AND u.status = 'dating' -- EXCLUDE OFF-MARKET
      AND p.user_id NOT IN (
          SELECT to_user_id FROM interactions WHERE from_user_id = target_user_id
      )
    ORDER BY p.embedding <=> target_embedding ASC
    LIMIT limit_count;
END;
$$;
