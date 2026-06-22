-- ==============================================================================
-- Vaniyambadi Bus Tracker - Supabase Schema
-- ==============================================================================
-- Note on Timezones:
-- This application exclusively serves Vaniyambadi, India (IST, UTC+5:30).
-- `departure_time` in schedules is stored as TIME WITHOUT TIME ZONE.
-- All date/time comparisons and display logic in the application code MUST 
-- explicitly handle conversions to/from IST, as the server (Vercel) runs in UTC.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. STOPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_local TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. ROUTES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_number TEXT NOT NULL,
    route_name TEXT NOT NULL,
    route_type TEXT NOT NULL CHECK (route_type IN ('local', 'intercity')),
    origin_stop_id UUID NOT NULL REFERENCES stops(id),
    destination_stop_id UUID NOT NULL REFERENCES stops(id),
    direction_group TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. ROUTE_STOPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES stops(id),
    sequence_order INTEGER NOT NULL,
    eta_minutes_from_origin INTEGER,
    UNIQUE (route_id, sequence_order) -- Ensures no duplicate sequence orders per route
);

-- ==============================================================================
-- 4. SCHEDULES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    departure_time TIME NOT NULL, -- Stored without timezone (treated as IST in app)
    days_of_week TEXT[] NOT NULL,
    operator_name TEXT,
    bus_category TEXT
);

-- ==============================================================================
-- 5. LIVE_REPORTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS live_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id),
    reported_stop_id UUID NOT NULL REFERENCES stops(id),
    note TEXT,
    reporter_session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. FEEDBACK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    contact_info TEXT,
    category TEXT CHECK (category IN ('wrong_schedule', 'bug', 'suggestion', 'other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
-- live_reports is queried frequently by route and recency
CREATE INDEX IF NOT EXISTS idx_live_reports_route_id ON live_reports(route_id);
CREATE INDEX IF NOT EXISTS idx_live_reports_created_at ON live_reports(created_at);
-- Optionally a composite index if often queried together
CREATE INDEX IF NOT EXISTS idx_live_reports_route_created ON live_reports(route_id, created_at);

-- Frequent lookups for routes and schedules
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_schedules_route_id ON schedules(route_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Enable RLS on all tables
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- SELECT POLICIES (Public / Anon can read)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on stops" ON stops;
CREATE POLICY "Allow public read on stops" ON stops FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read on routes" ON routes;
CREATE POLICY "Allow public read on routes" ON routes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read on route_stops" ON route_stops;
CREATE POLICY "Allow public read on route_stops" ON route_stops FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read on schedules" ON schedules;
CREATE POLICY "Allow public read on schedules" ON schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read on live_reports" ON live_reports;
CREATE POLICY "Allow public read on live_reports" ON live_reports FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- INSERT POLICIES (Public / Anon can insert specific things)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public insert on live_reports" ON live_reports;
CREATE POLICY "Allow public insert on live_reports" ON live_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert on feedback" ON feedback;
CREATE POLICY "Allow public insert on feedback" ON feedback FOR INSERT WITH CHECK (true);

-- Note: No UPDATE or DELETE policies are provided for the public/anon role.
-- Admin operations must be performed server-side using the Supabase Service Role key,
-- which bypasses Row Level Security entirely.

-- ==============================================================================
-- 7. POWER & WATER UPDATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS power_water_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('power_cut', 'water_supply')),
    area TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ADVERTISEMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_display_order ON advertisements(display_order);

ALTER TABLE power_water_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on power_water_updates" ON power_water_updates;
CREATE POLICY "Allow public read on power_water_updates" ON power_water_updates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read on advertisements" ON advertisements;
CREATE POLICY "Allow public read on advertisements" ON advertisements FOR SELECT USING (true);

-- ==============================================================================
-- 9. DIRECTORY LISTINGS (Service Providers + Local Shops)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS directory_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('electrician', 'plumber', 'carpenter', 'ac_repair', 'auto_taxi_driver', 'grocery', 'medical', 'hardware', 'tutor')),
    phone TEXT NOT NULL,
    area TEXT NOT NULL,
    photo_url TEXT,
    is_shop BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'active', 'flagged')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. LISTING FEEDBACK
-- ==============================================================================
CREATE TABLE IF NOT EXISTS listing_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
    was_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_directory_listings_category ON directory_listings(category);
CREATE INDEX IF NOT EXISTS idx_listing_feedback_listing_id ON listing_feedback(listing_id);

ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on directory_listings" ON directory_listings;
CREATE POLICY "Allow public read on directory_listings" ON directory_listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on directory_listings" ON directory_listings;
CREATE POLICY "Allow public insert on directory_listings" ON directory_listings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read on listing_feedback" ON listing_feedback;
CREATE POLICY "Allow public read on listing_feedback" ON listing_feedback FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on listing_feedback" ON listing_feedback;
CREATE POLICY "Allow public insert on listing_feedback" ON listing_feedback FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 11. EMERGENCY CONTACTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('national', 'hospital', 'police', 'fire', 'ambulance', 'electricity_board', 'water_board', 'other')),
    phone TEXT NOT NULL,
    address TEXT,
    is_24x7 BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_category ON emergency_contacts(category);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_display_order ON emergency_contacts(display_order);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on emergency_contacts" ON emergency_contacts;
CREATE POLICY "Allow public read on emergency_contacts" ON emergency_contacts FOR SELECT USING (true);

-- Admin-only insert/update/delete (service-role key bypasses RLS)

-- ==============================================================================
-- 12. EMERGENCY CONTACTS — SEED DATA
-- ==============================================================================
-- Nationally standardized India-wide numbers (verified, safe to display):
INSERT INTO emergency_contacts (name, category, phone, address, is_24x7, display_order)
VALUES
    ('National Emergency Helpline', 'national', '112', NULL, TRUE, 0),
    ('Ambulance', 'national', '108', NULL, TRUE, 1)
ON CONFLICT DO NOTHING;

-- VANIYAMBADI LOCAL PLACEHOLDERS
-- ⚠️  IMPORTANT: These rows have phone = ' ' (single space) as a placeholder.
--    They will NOT display a Call button until a real, verified phone number
--    is entered. Please obtain verified numbers from the actual local stations
--    before filling these in.
-- ⚠️  VERIFY AND FILL IN — do not display until phone number is confirmed real.
INSERT INTO emergency_contacts (name, category, phone, address, is_24x7, display_order)
VALUES
    ('Vaniyambadi Government Hospital', 'hospital', ' ', NULL, TRUE, 10),
    ('Vaniyambadi Police Station', 'police', ' ', NULL, TRUE, 20),
    ('Vaniyambadi Fire Station', 'fire', ' ', NULL, TRUE, 30),
    ('Electricity Board - Vaniyambadi', 'electricity_board', ' ', NULL, FALSE, 40),
    ('Water Board - Vaniyambadi', 'water_board', ' ', NULL, FALSE, 50)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 13. MOSQUES (Namaz Timings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS mosques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    contact_phone TEXT,
    fajr TEXT NOT NULL,
    dhuhr TEXT NOT NULL,
    asr TEXT NOT NULL,
    maghrib TEXT NOT NULL,
    isha TEXT NOT NULL,
    jumma TEXT,
    last_updated_by_mosque TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mosques_status ON mosques(status);

ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on mosques (verified only)" ON mosques;
CREATE POLICY "Allow public read on mosques (verified only)" ON mosques FOR SELECT USING (status = 'verified');
DROP POLICY IF EXISTS "Allow public insert on mosques" ON mosques;
CREATE POLICY "Allow public insert on mosques" ON mosques FOR INSERT WITH CHECK (true);
