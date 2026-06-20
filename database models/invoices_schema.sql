-- ══════════════════════════════════════════════════
--  SAFARI ASAP — Invoices Schema Extension
--  Run this in Supabase > SQL Editor
-- ══════════════════════════════════════════════════

-- ── INVOICES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number   TEXT NOT NULL UNIQUE,          -- e.g. INV-001311
  invoice_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  -- Bill-to (client)
  client_name      TEXT NOT NULL,
  client_email     TEXT,
  -- Status
  status           TEXT CHECK (status IN ('draft','sent','paid','overdue','cancelled')) DEFAULT 'draft',
  -- Notes / Terms
  notes            TEXT,
  -- Line items stored as JSONB array
  -- Each item: { service, description, num_pax, price_per_person, supplement, total }
  line_items       JSONB DEFAULT '[]',
  -- Totals (computed and stored for quick queries)
  subtotal         NUMERIC(14,2) DEFAULT 0,
  discount         NUMERIC(14,2) DEFAULT 0,    -- entered manually
  tax              NUMERIC(14,2) DEFAULT 0,    -- entered manually
  total_amount     NUMERIC(14,2) DEFAULT 0,    -- subtotal - discount + tax
  amount_paid      NUMERIC(14,2) DEFAULT 0,    -- entered manually
  balance_due      NUMERIC(14,2) DEFAULT 0,    -- total_amount - amount_paid
  currency         TEXT DEFAULT 'USD',
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── MIGRATION: add manual fields to an existing invoices table ──
-- Safe to run repeatedly; only adds columns if missing.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount    NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax         NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(14,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due NUMERIC(14,2) DEFAULT 0;

-- ── ROW LEVEL SECURITY ────────────────────────────
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_invoices" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── AUTO-UPDATE updated_at ────────────────────────
CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── INVOICE NUMBER SEQUENCE GENERATOR ────────────
-- Auto-generate invoice numbers like INV-001001
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
