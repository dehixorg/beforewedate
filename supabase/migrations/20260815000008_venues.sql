-- Migration: 20260815000008_venues.sql
-- Description: Venues, Events, RSVPs, Check-ins, and PostGIS geofence logic

-- 1. Venues Table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT) NOT NULL, -- PostGIS point
    partner_tier TEXT NOT NULL DEFAULT 'standard',
    offers_dates BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    geofence_radius_meters INTEGER NOT NULL DEFAULT 100,
    beacon_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Event RSVPs Table
CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'attending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 4. Event Check-ins Table
CREATE TABLE event_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method TEXT NOT NULL DEFAULT 'gps',
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Venues & Events: Public read, Admin write (Admin via service_role bypassing RLS)
CREATE POLICY "Anyone can view venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);

-- RSVPs: Users can read/write their own
CREATE POLICY "Users can view own RSVPs" ON event_rsvps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own RSVPs" ON event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RSVPs" ON event_rsvps FOR UPDATE USING (auth.uid() = user_id);

-- Checkins: Users can view own. Inserts handled via RPC bypassing RLS, or directly if they are owner
CREATE POLICY "Users can view own checkins" ON event_checkins FOR SELECT USING (auth.uid() = user_id);
-- We won't allow direct insert to checkins, it must go through the RPC to verify location.

-- 5. Check-in RPC (Geofence Validation)
CREATE OR REPLACE FUNCTION checkin_to_event(target_event_id UUID, lat FLOAT, lng FLOAT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, postgis
AS $$
DECLARE
    event_record events%ROWTYPE;
    venue_record venues%ROWTYPE;
    user_location GEOGRAPHY(POINT);
    distance FLOAT;
BEGIN
    -- Get event and venue
    SELECT * INTO event_record FROM events WHERE id = target_event_id;
    IF event_record IS NULL THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    SELECT * INTO venue_record FROM venues WHERE id = event_record.venue_id;

    -- Construct user location point
    user_location := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY;

    -- Calculate distance in meters
    distance := ST_Distance(venue_record.location, user_location);

    -- Check geofence
    IF distance <= event_record.geofence_radius_meters THEN
        -- Insert checkin (ignoring if already checked in due to UNIQUE constraint)
        INSERT INTO event_checkins (event_id, user_id, method)
        VALUES (target_event_id, auth.uid(), 'gps')
        ON CONFLICT (event_id, user_id) DO NOTHING;
        
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Too far from venue. Distance: %m, Allowed: %m', ROUND(distance::numeric, 1), event_record.geofence_radius_meters;
    END IF;
END;
$$;
