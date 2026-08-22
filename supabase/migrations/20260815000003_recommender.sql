-- Migration: 20260815000003_recommender.sql
-- Description: Create the get_candidate_deck RPC for the recommender pipeline

-- Drop if exists to allow safe re-runs during development
DROP FUNCTION IF EXISTS get_candidate_deck(UUID, FLOAT, INT);

-- The function returns a table with profile and user data
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
  face_verified BOOLEAN
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
  -- 1. Fetch viewer data
  SELECT location, embedding, mode 
  INTO viewer_location, viewer_embedding, viewer_mode
  FROM profiles 
  WHERE profiles.user_id = viewer_id;

  -- Ensure viewer has a completed profile (at least a location and mode)
  IF viewer_location IS NULL OR viewer_mode IS NULL THEN
    RETURN;
  END IF;

  -- 2. Return matching candidates
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
    u.face_verified
  FROM profiles p
  JOIN users u ON u.id = p.user_id
  WHERE 
    p.user_id != viewer_id
    AND p.mode = viewer_mode
    AND u.status = 'dating'
    AND ST_DWithin(p.location, viewer_location, max_distance_meters)
    -- Must have an embedding to be compared
    AND p.embedding IS NOT NULL
    -- Exclude prior interactions (where viewer already swiped on them)
    AND NOT EXISTS (
      SELECT 1 FROM interactions i
      WHERE i.from_user_id = viewer_id AND i.to_user_id = p.user_id
    )
  ORDER BY 
    p.embedding <=> viewer_embedding ASC
  LIMIT match_limit;
END;
$$;
