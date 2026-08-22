-- Migration: 20260815000005_chat.sql
-- Description: Schema updates for blind chat timer and unlock states, plus initiation trigger

-- 1. Alter Matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS unlocked_by_a BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unlocked_by_b BOOLEAN DEFAULT FALSE;

-- 2. Trigger for Match Initiation
CREATE OR REPLACE FUNCTION handle_first_message()
RETURNS TRIGGER AS $$
DECLARE
    match_row matches%ROWTYPE;
BEGIN
    -- Fetch the parent match
    SELECT * INTO match_row FROM matches WHERE id = NEW.match_id;

    -- If not initiated, and the sender is the assigned initiator
    IF match_row.is_initiated = FALSE AND match_row.initiator_id = NEW.sender_id THEN
        UPDATE matches 
        SET 
            is_initiated = TRUE,
            initiated_at = NOW()
        WHERE id = NEW.match_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_first_message ON messages;
CREATE TRIGGER trg_handle_first_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION handle_first_message();
