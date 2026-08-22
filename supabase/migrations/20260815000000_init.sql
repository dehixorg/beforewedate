-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==========================================
-- 1. ENUMS
-- ==========================================
CREATE TYPE user_status AS ENUM ('dating', 'official', 'paused');
CREATE TYPE profile_mode AS ENUM ('dating', 'bff');
CREATE TYPE interaction_action AS ENUM ('like', 'pass');
CREATE TYPE relationship_state AS ENUM ('dating', 'official', 'paused', 'ended');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE coach_memory_scope AS ENUM ('user', 'couple');
CREATE TYPE coach_memory_kind AS ENUM ('profile', 'resolution', 'session');

-- ==========================================
-- 2. TABLES
-- ==========================================

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    face_verified BOOLEAN DEFAULT FALSE,
    trust_score INTEGER DEFAULT 50,
    status user_status DEFAULT 'dating'
);

-- PROFILES
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    mode profile_mode DEFAULT 'dating',
    location geometry(Point, 4326),
    embedding vector(1536),
    photos TEXT[] DEFAULT '{}',
    prompts JSONB DEFAULT '[]',
    bio TEXT
);

-- INTERACTIONS
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action interaction_action NOT NULL,
    ts TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- MATCHES
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_initiated BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_a, user_b)
);

-- MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_ai BOOLEAN DEFAULT FALSE,
    moderation_flags JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RELATIONSHIPS
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    state relationship_state DEFAULT 'dating',
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    paused_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_a, user_b)
);

-- VENUES
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location geometry(Point, 4326),
    partner_tier TEXT DEFAULT 'standard',
    offers_dates BOOLEAN DEFAULT FALSE
);

-- EVENTS
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    geofence geometry(Polygon, 4326),
    beacon_id TEXT
);

-- EVENT_ATTENDEES
CREATE TABLE event_attendees (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discovery_opt_in BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (event_id, user_id)
);

-- BOOKINGS (Date-Market)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    date_time TIMESTAMPTZ NOT NULL,
    status booking_status DEFAULT 'pending'
);

-- COACH_MEMORY
CREATE TABLE coach_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope coach_memory_scope NOT NULL,
    ref_id UUID NOT NULL, -- Either a user_id or relationship_id depending on scope
    kind coach_memory_kind NOT NULL,
    summary TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PULSE
CREATE TABLE pulse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    note TEXT,
    ts TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. INDEXES
-- ==========================================
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_venues_location ON venues USING GIST (location);
CREATE INDEX idx_events_geofence ON events USING GIST (geofence);

-- Vector indexes (HNSW)
CREATE INDEX idx_profiles_embedding ON profiles USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_coach_memory_embedding ON coach_memory USING hnsw (embedding vector_cosine_ops);

-- ==========================================
-- 4. RLS HELPER FUNCTIONS
-- ==========================================
-- These functions use SECURITY DEFINER to bypass RLS internally so we can check
-- relationships without causing infinite recursion in RLS policies.

CREATE OR REPLACE FUNCTION is_mutual_connection(my_uid UUID, target_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- True if there is a match
    SELECT EXISTS (
        SELECT 1 FROM matches 
        WHERE (user_a = my_uid AND user_b = target_uid) 
           OR (user_a = target_uid AND user_b = my_uid)
    )
    -- Or if there is a relationship
    OR EXISTS (
        SELECT 1 FROM relationships 
        WHERE (user_a = my_uid AND user_b = target_uid) 
           OR (user_a = target_uid AND user_b = my_uid)
    );
$$;

CREATE OR REPLACE FUNCTION is_in_match(my_uid UUID, m_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM matches 
        WHERE id = m_id AND (user_a = my_uid OR user_b = my_uid)
    );
$$;

CREATE OR REPLACE FUNCTION is_in_relationship(my_uid UUID, r_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM relationships 
        WHERE id = r_id AND (user_a = my_uid OR user_b = my_uid)
    );
$$;

-- ==========================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on ALL tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- USERS
-- ------------------------------------------
-- Users can read their own profile, or the profile of someone they are connected to.
CREATE POLICY "Users can read own row and mutual connections" 
ON users FOR SELECT 
USING (
    auth.uid() = id OR is_mutual_connection(auth.uid(), id)
);

-- Users can only update their own row.
CREATE POLICY "Users can update own row" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- ------------------------------------------
-- PROFILES
-- ------------------------------------------
-- Profiles have the exact same visibility rules as users.
CREATE POLICY "Profiles can be read by owner and mutual connections" 
ON profiles FOR SELECT 
USING (
    auth.uid() = user_id OR is_mutual_connection(auth.uid(), user_id)
);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------
-- INTERACTIONS
-- ------------------------------------------
-- Users can only insert and read their OWN interactions (who they liked/passed).
-- They cannot read who liked them directly via RLS (backend service key handles discovery).
CREATE POLICY "Users can insert their own interactions" 
ON interactions FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can read their own interactions" 
ON interactions FOR SELECT 
USING (auth.uid() = from_user_id);

-- ------------------------------------------
-- MATCHES
-- ------------------------------------------
-- Users can read matches they are a part of.
CREATE POLICY "Users can read their own matches" 
ON matches FOR SELECT 
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- ------------------------------------------
-- MESSAGES
-- ------------------------------------------
-- Users can read and insert messages for a match they belong to.
CREATE POLICY "Users can read messages of their matches" 
ON messages FOR SELECT 
USING (is_in_match(auth.uid(), match_id));

CREATE POLICY "Users can insert messages to their matches" 
ON messages FOR INSERT 
WITH CHECK (is_in_match(auth.uid(), match_id) AND auth.uid() = sender_id);

-- ------------------------------------------
-- RELATIONSHIPS
-- ------------------------------------------
-- Users can read relationships they are a part of.
CREATE POLICY "Users can read their own relationships" 
ON relationships FOR SELECT 
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Users can update their own relationship (e.g. state changes to 'paused' or 'ended').
CREATE POLICY "Users can update their own relationships" 
ON relationships FOR UPDATE 
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- ------------------------------------------
-- VENUES & EVENTS
-- ------------------------------------------
-- Venues and Events are public read. Only admin (service role) can insert/update.
CREATE POLICY "Venues are readable by everyone" 
ON venues FOR SELECT USING (true);

CREATE POLICY "Events are readable by everyone" 
ON events FOR SELECT USING (true);

-- ------------------------------------------
-- EVENT ATTENDEES
-- ------------------------------------------
-- Users can RSVP to events.
CREATE POLICY "Users can insert their own attendance" 
ON event_attendees FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view attendees for events they are attending (in-zone discovery).
CREATE POLICY "Users can see attendees of their events" 
ON event_attendees FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM event_attendees ea 
        WHERE ea.event_id = event_attendees.event_id AND ea.user_id = auth.uid()
    )
);

-- ------------------------------------------
-- BOOKINGS
-- ------------------------------------------
-- Users can see bookings for their relationships.
CREATE POLICY "Users can read bookings for their relationships" 
ON bookings FOR SELECT 
USING (is_in_relationship(auth.uid(), relationship_id));

-- Users can create bookings for their relationships.
CREATE POLICY "Users can insert bookings for their relationships" 
ON bookings FOR INSERT 
WITH CHECK (is_in_relationship(auth.uid(), relationship_id));

-- ------------------------------------------
-- COACH MEMORY
-- ------------------------------------------
-- Coach memory is highly sensitive. 
-- If scope = 'user', ref_id is the user's UUID.
-- If scope = 'couple', ref_id is the relationship UUID.
CREATE POLICY "Users can read own or couple coach memory" 
ON coach_memory FOR SELECT 
USING (
    (scope = 'user' AND auth.uid() = ref_id)
    OR
    (scope = 'couple' AND is_in_relationship(auth.uid(), ref_id))
);

-- ------------------------------------------
-- PULSE (Check-ins)
-- ------------------------------------------
-- Users can insert their own pulse check-ins.
CREATE POLICY "Users can insert own pulse" 
ON pulse FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_in_relationship(auth.uid(), relationship_id));

-- Users can read pulse check-ins for their relationship.
CREATE POLICY "Users can read pulse of their relationship" 
ON pulse FOR SELECT 
USING (is_in_relationship(auth.uid(), relationship_id));
