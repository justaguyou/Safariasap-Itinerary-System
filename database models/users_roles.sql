-- ══════════════════════════════════════════════════
--  SAFARI ASAP — Users, Roles & Ownership
--  Run this in Supabase > SQL Editor (after schema.sql,
--  invoices_schema.sql and costs_schema.sql).
--  Safe to run repeatedly (idempotent).
-- ══════════════════════════════════════════════════

-- ── 1. ADMIN PROFILES — add username ──────────────
-- (admin_profiles already exists in schema.sql)
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- ── 2. ROLE HELPER ────────────────────────────────
-- SECURITY DEFINER lets this read admin_profiles without
-- tripping the table's own RLS (avoids infinite recursion).
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = TRUE
  );
$$;

-- ── 3. OWNERSHIP DEFAULTS ─────────────────────────
-- New rows are automatically attributed to the creator.
ALTER TABLE itineraries ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE invoices    ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE costs       ALTER COLUMN created_by SET DEFAULT auth.uid();

-- ── 4. OWNERSHIP-BASED RLS ────────────────────────
-- Replace the old permissive "everyone sees everything"
-- policies with: you see your own rows, super-admin sees all.

-- ITINERARIES
DROP POLICY IF EXISTS "auth_all_itineraries" ON itineraries;
DROP POLICY IF EXISTS "own_or_admin_select_itineraries" ON itineraries;
DROP POLICY IF EXISTS "own_or_admin_write_itineraries"  ON itineraries;
CREATE POLICY "own_or_admin_select_itineraries" ON itineraries
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_super_admin());
CREATE POLICY "own_or_admin_write_itineraries" ON itineraries
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR is_super_admin())
  WITH CHECK (created_by = auth.uid() OR is_super_admin());

-- ITINERARY DAYS — follow the parent itinerary's visibility
DROP POLICY IF EXISTS "auth_all_itinerary_days" ON itinerary_days;
DROP POLICY IF EXISTS "own_or_admin_itinerary_days" ON itinerary_days;
CREATE POLICY "own_or_admin_itinerary_days" ON itinerary_days
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM itineraries i
            WHERE i.id = itinerary_days.itinerary_id
              AND (i.created_by = auth.uid() OR is_super_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM itineraries i
            WHERE i.id = itinerary_days.itinerary_id
              AND (i.created_by = auth.uid() OR is_super_admin()))
  );

-- INVOICES
DROP POLICY IF EXISTS "auth_all_invoices" ON invoices;
DROP POLICY IF EXISTS "own_or_admin_select_invoices" ON invoices;
DROP POLICY IF EXISTS "own_or_admin_write_invoices"  ON invoices;
CREATE POLICY "own_or_admin_select_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_super_admin());
CREATE POLICY "own_or_admin_write_invoices" ON invoices
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR is_super_admin())
  WITH CHECK (created_by = auth.uid() OR is_super_admin());

-- COSTS
DROP POLICY IF EXISTS "auth_all_costs" ON costs;
DROP POLICY IF EXISTS "own_or_admin_select_costs" ON costs;
DROP POLICY IF EXISTS "own_or_admin_write_costs"  ON costs;
CREATE POLICY "own_or_admin_select_costs" ON costs
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_super_admin());
CREATE POLICY "own_or_admin_write_costs" ON costs
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR is_super_admin())
  WITH CHECK (created_by = auth.uid() OR is_super_admin());

-- ── 5. SHARED CONTENT STAYS SHARED ────────────────
-- Destinations, accommodations and the gallery are reference
-- content every signed-in user needs, so they remain readable/
-- writable by all authenticated users (left as-is from schema.sql).

-- ── 6. ADMIN PROFILES RLS ─────────────────────────
-- A user may read their OWN profile (so the dashboard can tell
-- what role it has); a super-admin may read/manage ALL profiles.
DROP POLICY IF EXISTS "auth_all_admin_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "self_or_admin_select_profiles" ON admin_profiles;
DROP POLICY IF EXISTS "admin_manage_profiles" ON admin_profiles;
CREATE POLICY "self_or_admin_select_profiles" ON admin_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_super_admin());
-- Only super-admins may change roles / deactivate users from the app.
-- (The Edge Function uses the service_role key and bypasses RLS for inserts.)
CREATE POLICY "admin_manage_profiles" ON admin_profiles
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── 7. BOOTSTRAP THE SUPER-ADMIN ──────────────────
-- The auth account info@safariasap.com must already exist
-- (create it via Supabase > Authentication > Users, or by
--  signing up once). This promotes it to super_admin.
INSERT INTO admin_profiles (id, email, username, role, is_active)
SELECT id, email, 'admin', 'super_admin', TRUE
FROM auth.users
WHERE email = 'info@safariasap.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'super_admin',
      is_active = TRUE,
      username = COALESCE(admin_profiles.username, 'admin');
