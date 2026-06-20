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
CREATE TABLE stops (
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
CREATE TABLE routes (
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
CREATE TABLE route_stops (
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
CREATE TABLE schedules (
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
CREATE TABLE live_reports (
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
CREATE TABLE feedback (
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
CREATE INDEX idx_live_reports_route_id ON live_reports(route_id);
CREATE INDEX idx_live_reports_created_at ON live_reports(created_at);
-- Optionally a composite index if often queried together
CREATE INDEX idx_live_reports_route_created ON live_reports(route_id, created_at);

-- Frequent lookups for routes and schedules
CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_schedules_route_id ON schedules(route_id);

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
CREATE POLICY "Allow public read on stops" ON stops FOR SELECT USING (true);
CREATE POLICY "Allow public read on routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Allow public read on route_stops" ON route_stops FOR SELECT USING (true);
CREATE POLICY "Allow public read on schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow public read on live_reports" ON live_reports FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- INSERT POLICIES (Public / Anon can insert specific things)
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public insert on live_reports" ON live_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on feedback" ON feedback FOR INSERT WITH CHECK (true);

-- Note: No UPDATE or DELETE policies are provided for the public/anon role.
-- Admin operations must be performed server-side using the Supabase Service Role key,
-- which bypasses Row Level Security entirely.
