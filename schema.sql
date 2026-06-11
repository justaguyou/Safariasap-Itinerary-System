-- ══════════════════════════════════════════════════
--  SAFARI ASAP — Supabase Database Schema
--  Run this in Supabase > SQL Editor
-- ══════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── DESTINATIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS destinations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  country       TEXT NOT NULL DEFAULT 'Tanzania',
  region        TEXT,
  description   TEXT,
  hero_image    TEXT,
  gallery       JSONB DEFAULT '[]',
  highlights    JSONB DEFAULT '[]',
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACCOMMODATIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS accommodations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  location      TEXT,
  level         TEXT CHECK (level IN ('budget','midrange','luxury')) DEFAULT 'midrange',
  description   TEXT,
  highlights    JSONB DEFAULT '[]',
  images        JSONB DEFAULT '[]',
  amenities     JSONB DEFAULT '[]',
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── DESTINATION GALLERY ───────────────────────────
CREATE TABLE IF NOT EXISTS destination_gallery (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_id  UUID REFERENCES destinations(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  caption         TEXT,
  alt_text        TEXT,
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ITINERARIES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS itineraries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  client_name     TEXT,
  client_email    TEXT,
  reference_code  TEXT UNIQUE,
  duration_days   INTEGER NOT NULL DEFAULT 1,
  duration_label  TEXT,
  group_size      INTEGER DEFAULT 2,
  start_date      DATE,
  end_date        DATE,
  overview        TEXT,
  highlights      JSONB DEFAULT '[]',
  inclusions      JSONB DEFAULT '[]',
  exclusions      JSONB DEFAULT '[]',
  notes           TEXT,
  total_price     NUMERIC(12,2),
  price_currency  TEXT DEFAULT 'USD',
  price_per       TEXT DEFAULT 'person',
  status          TEXT CHECK (status IN ('draft','confirmed','sent','archived')) DEFAULT 'draft',
  pdf_style       TEXT DEFAULT 'classic',
  hero_image      TEXT,
  days            JSONB DEFAULT '[]',
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ITINERARY DAYS (normalized for queries) ───────
CREATE TABLE IF NOT EXISTS itinerary_days (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id      UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number        INTEGER NOT NULL,
  title             TEXT,
  location          TEXT,
  route             TEXT,
  description       TEXT,
  activities        JSONB DEFAULT '[]',
  accommodation_id  UUID REFERENCES accommodations(id) ON DELETE SET NULL,
  accommodation_name TEXT,
  meal_plan         TEXT,
  distance_km       INTEGER,
  driving_hours     NUMERIC(4,1),
  hero_image        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── ADMIN PROFILES ────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT CHECK (role IN ('super_admin','editor')) DEFAULT 'editor',
  is_active   BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────
ALTER TABLE destinations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_gallery  ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles       ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write all tables
CREATE POLICY "auth_all_destinations"        ON destinations        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_accommodations"      ON accommodations      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_gallery"             ON destination_gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_itineraries"         ON itineraries         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_itinerary_days"      ON itinerary_days      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_admin_profiles"      ON admin_profiles      FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── STORAGE BUCKETS ───────────────────────────────
-- Run these in Supabase Dashboard > Storage (or via SQL):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('itinerary-images', 'itinerary-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('accommodation-images', 'accommodation-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('destination-images', 'destination-images', true);

-- Allow authenticated upload to storage
CREATE POLICY "auth_upload_itinerary"       ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'itinerary-images');
CREATE POLICY "auth_upload_accommodation"   ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'accommodation-images');
CREATE POLICY "auth_upload_destination"     ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'destination-images');
CREATE POLICY "public_read_storage"         ON storage.objects FOR SELECT TO public USING (bucket_id IN ('itinerary-images','accommodation-images','destination-images'));

-- ── AUTO-UPDATE updated_at ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_destinations_updated   BEFORE UPDATE ON destinations  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_accommodations_updated BEFORE UPDATE ON accommodations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_itineraries_updated    BEFORE UPDATE ON itineraries    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SAMPLE REFERENCE CODE GENERATOR ──────────────
CREATE OR REPLACE FUNCTION generate_reference_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SA-' || TO_CHAR(NOW(), 'YY') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
