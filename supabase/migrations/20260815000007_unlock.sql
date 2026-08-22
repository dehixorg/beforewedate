-- Migration: 20260815000007_unlock.sql
-- Description: RPC for toggling unlock state and trigger for mutual reveal

-- 1. RPC to toggle unlock state
CREATE OR REPLACE FUNCTION toggle_unlock(target_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    match_record matches%ROWTYPE;
    is_user_a BOOLEAN;
    new_state BOOLEAN;
BEGIN
    -- Fetch match and check authorization
    SELECT * INTO match_record FROM matches WHERE id = target_match_id;
    
    IF match_record IS NULL THEN
        RAISE EXCEPTION 'Match not found';
    END IF;

    IF match_record.user_a = auth.uid() THEN
        is_user_a := TRUE;
    ELSIF match_record.user_b = auth.uid() THEN
        is_user_a := FALSE;
    ELSE
        RAISE EXCEPTION 'Not authorized to unlock this match';
    END IF;

    -- Toggle the appropriate flag
    IF is_user_a THEN
        new_state := NOT match_record.unlocked_by_a;
        UPDATE matches SET unlocked_by_a = new_state WHERE id = target_match_id;
    ELSE
        new_state := NOT match_record.unlocked_by_b;
        UPDATE matches SET unlocked_by_b = new_state WHERE id = target_match_id;
    END IF;

    RETURN new_state;
END;
$$;

-- 2. Trigger for mutual unlock detection
CREATE OR REPLACE FUNCTION handle_mutual_unlock()
RETURNS TRIGGER AS $$
BEGIN
    -- If both just became true, insert system message
    IF NEW.unlocked_by_a = TRUE AND NEW.unlocked_by_b = TRUE AND
       (OLD.unlocked_by_a = FALSE OR OLD.unlocked_by_b = FALSE) THEN
       
       INSERT INTO messages (match_id, sender_id, is_ai, text)
       VALUES (NEW.id, NULL, TRUE, 'You have unlocked each other! 🔓 Full profiles are now visible.');
       
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_mutual_unlock ON matches;
CREATE TRIGGER trg_mutual_unlock
AFTER UPDATE OF unlocked_by_a, unlocked_by_b ON matches
FOR EACH ROW EXECUTE FUNCTION handle_mutual_unlock();
