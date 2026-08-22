-- Migration: 20260815000014_date_market.sql
-- Description: Date-market bookings and commissions

-- 1. Date Bookings Table
CREATE TABLE date_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    booking_time TIMESTAMPTZ NOT NULL,
    commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE date_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own relationship bookings
CREATE POLICY "Users can view own relationship bookings" ON date_bookings
    FOR SELECT USING (
        relationship_id IN (
            SELECT id FROM relationships WHERE user_a = auth.uid() OR user_b = auth.uid()
        )
    );

-- Users can insert bookings for their own relationship
CREATE POLICY "Users can insert own relationship bookings" ON date_bookings
    FOR INSERT WITH CHECK (
        relationship_id IN (
            SELECT id FROM relationships WHERE user_a = auth.uid() OR user_b = auth.uid()
        )
    );
