-- Migration: 20260815000012_dark_room.sql
-- Description: Dark room ephemeral session tables and purge trigger

-- 1. Dark Room Sessions Table
CREATE TABLE dark_room_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_consent', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Dark Room Messages Table (Ephemeral)
CREATE TABLE dark_room_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES dark_room_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if AI
    is_ai BOOLEAN NOT NULL DEFAULT false,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS Policies
ALTER TABLE dark_room_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dark_room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own dark room sessions" ON dark_room_sessions 
    FOR ALL USING (
        relationship_id IN (SELECT id FROM relationships WHERE user_a = auth.uid() OR user_b = auth.uid())
    );

CREATE POLICY "Users can access own dark room messages" ON dark_room_messages 
    FOR ALL USING (
        session_id IN (
            SELECT id FROM dark_room_sessions WHERE relationship_id IN (
                SELECT id FROM relationships WHERE user_a = auth.uid() OR user_b = auth.uid()
            )
        )
    );

-- 4. Ephemeral Purge Trigger
-- Instantly deletes all raw messages when a session transitions to 'completed'
CREATE OR REPLACE FUNCTION purge_dark_room_messages()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        DELETE FROM dark_room_messages WHERE session_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_purge_dark_room
AFTER UPDATE OF status ON dark_room_sessions
FOR EACH ROW EXECUTE FUNCTION purge_dark_room_messages();
