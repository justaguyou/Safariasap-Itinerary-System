-- ══════════════════════════════════════════════════
--  SAFARI ASAP — Costs Schema Extension
--  Run this in Supabase > SQL Editor
-- ══════════════════════════════════════════════════

-- ── COSTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS costs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code   TEXT NOT NULL UNIQUE,          -- e.g. CST-001001
  title            TEXT NOT NULL DEFAULT 'SAFARI ITINERARY & COSTS',
  client_name      TEXT,
  
  -- Settings
  margin_pct       NUMERIC(5,2) DEFAULT 10,
  
  -- JSON Arrays for dynamic content
  itin             JSONB DEFAULT '[]',
  sections         JSONB DEFAULT '{}',
  
  -- Totals
  grand_total      NUMERIC(14,2) DEFAULT 0,
  selling_price    NUMERIC(14,2) DEFAULT 0,
  cost_per_person  NUMERIC(14,2) DEFAULT 0,
  
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_costs" ON costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── AUTO-UPDATE updated_at ────────────────────────
CREATE TRIGGER trg_costs_updated
  BEFORE UPDATE ON costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── COST REFERENCE SEQUENCE GENERATOR ─────────────
CREATE SEQUENCE IF NOT EXISTS cost_reference_seq START 1001;

CREATE OR REPLACE FUNCTION generate_cost_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CST-' || LPAD(NEXTVAL('cost_reference_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
