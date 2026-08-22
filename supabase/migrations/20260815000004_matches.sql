-- Migration: 20260815000004_matches.sql
-- Description: Match creation triggers, gender column, cron job for expiry, and updated deck RPC

-- 1. Add gender to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
-- Set default for existing test data
UPDATE profiles SET gender = 'F' WHERE gender IS NULL;

-- 2. Trigger for Match Creation
CREATE OR REPLACE FUNCTION handle_new_interaction()
RETURNS TRIGGER AS $$
DECLARE
    reciprocal_like_exists BOOLEAN;
    user_a_gender TEXT;
    user_b_gender TEXT;
    match_initiator UUID;
BEGIN
    -- Only process 'like'
    IF NEW.action != 'like' THEN
        RETURN NEW;
    END IF;

    -- Check for reciprocal like
    SELECT EXISTS (
        SELECT 1 FROM interactions 
        WHERE from_user_id = NEW.to_user_id 
          AND to_user_id = NEW.from_user_id 
          AND action = 'like'
    ) INTO reciprocal_like_exists;

    IF reciprocal_like_exists THEN
        -- Fetch genders to determine initiator
        SELECT gender INTO user_a_gender FROM profiles WHERE user_id = NEW.from_user_id;
        SELECT gender INTO user_b_gender FROM profiles WHERE user_id = NEW.to_user_id;
        
        -- Logic: Women speak first in M/F matches. Else random.
        IF (user_a_gender = 'F' AND user_b_gender = 'M') THEN
            match_initiator := NEW.from_user_id;
        ELSIF (user_b_gender = 'F' AND user_a_gender = 'M') THEN
            match_initiator := NEW.to_user_id;
        ELSE
            -- Randomize initiator
            IF random() < 0.5 THEN
                match_initiator := NEW.from_user_id;
            ELSE
                match_initiator := NEW.to_user_id;
            END IF;
        END IF;

        -- Create match
        INSERT INTO matches (
            user_a, 
            user_b, 
            initiator_id, 
            expires_at
        ) VALUES (
            LEAST(NEW.from_user_id, NEW.to_user_id),
            GREATEST(NEW.from_user_id, NEW.to_user_id),
            match_initiator,
            NOW() + INTERVAL '24 hours'
        ) ON CONFLICT (user_a, user_b) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_new_interaction ON interactions;
CREATE TRIGGER trg_handle_new_interaction
AFTER INSERT ON interactions
FOR EACH ROW EXECUTE FUNCTION handle_new_interaction();


-- 3. Cron Job to expire matches
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Schedule to run every hour at minute 0
SELECT cron.schedule('expire-matches', '0 * * * *', $$
    DELETE FROM matches 
    WHERE is_initiated = FALSE 
      AND expires_at <= NOW()
$$);


-- 4. Update get_candidate_deck to include incoming_likes
DROP FUNCTION IF EXISTS get_candidate_deck(UUID, FLOAT, INT);
CREATE OR REPLACE FUNCTION get_candidate_deck(
  viewer_id UUID,
  max_distance_meters FLOAT,
  match_limit INT DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  mode TEXT,
  bio TEXT,
  prompts JSONB,
  photos TEXT[],
  distance_meters FLOAT,
  similarity FLOAT,
  trust_score INT,
  verified BOOLEAN,
  face_verified BOOLEAN,
  incoming_likes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_location geometry(Point, 4326);
  viewer_embedding vector(1536);
  viewer_mode TEXT;
BEGIN
  -- Fetch viewer data
  SELECT location, embedding, mode 
  INTO viewer_location, viewer_embedding, viewer_mode
  FROM profiles 
  WHERE profiles.user_id = viewer_id;

  IF viewer_location IS NULL OR viewer_mode IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.mode,
    p.bio,
    p.prompts,
    p.photos,
    ST_DistanceSphere(p.location::geometry, viewer_location::geometry) AS distance_meters,
    (1 - (p.embedding <=> viewer_embedding)) AS similarity,
    u.trust_score,
    u.verified,
    u.face_verified,
    (SELECT COUNT(*) FROM interactions i WHERE i.to_user_id = p.user_id AND i.action = 'like') AS incoming_likes
  FROM profiles p
  JOIN users u ON u.id = p.user_id
  WHERE 
    p.user_id != viewer_id
    AND p.mode = viewer_mode
    AND u.status = 'dating'
    AND ST_DWithin(p.location, viewer_location, max_distance_meters)
    AND p.embedding IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM interactions i
      WHERE i.from_user_id = viewer_id AND i.to_user_id = p.user_id
    )
  ORDER BY 
    p.embedding <=> viewer_embedding ASC
  LIMIT match_limit;
END;
$$;
