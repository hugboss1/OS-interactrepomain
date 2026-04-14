-- Enable Row Level Security on all tables
-- RLS ensures the anon key cannot read/write data via PostgREST unless
-- an explicit policy grants access.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pledges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "genpoints_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_tenants" ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (prevents bypass via direct connection
-- with the postgres/owner role). service_role bypasses RLS by default
-- in Supabase because it uses the `postgres` role with BYPASSRLS.
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
ALTER TABLE "projects" FORCE ROW LEVEL SECURITY;
ALTER TABLE "pledges" FORCE ROW LEVEL SECURITY;
ALTER TABLE "rewards" FORCE ROW LEVEL SECURITY;
ALTER TABLE "waitlist" FORCE ROW LEVEL SECURITY;
ALTER TABLE "genpoints_ledger" FORCE ROW LEVEL SECURITY;
ALTER TABLE "agent_tenants" FORCE ROW LEVEL SECURITY;

-- =============================================================
-- Waitlist policies: read-only for anon, all ops via service_role only
-- =============================================================

-- Anon can read waitlist (public leaderboard / position lookup)
CREATE POLICY "waitlist_anon_select"
  ON "waitlist"
  FOR SELECT
  TO anon
  USING (true);

-- No INSERT/UPDATE/DELETE for anon on waitlist.
-- service_role bypasses RLS, so it can write without an explicit policy.

-- =============================================================
-- Users policies
-- =============================================================

-- Authenticated users can read their own row
CREATE POLICY "users_self_select"
  ON "users"
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- Authenticated users can update their own row
CREATE POLICY "users_self_update"
  ON "users"
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- =============================================================
-- Projects policies
-- =============================================================

-- Anyone can read active projects
CREATE POLICY "projects_public_select"
  ON "projects"
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Authenticated users can create projects
CREATE POLICY "projects_auth_insert"
  ON "projects"
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

-- Creators can update their own projects
CREATE POLICY "projects_creator_update"
  ON "projects"
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid()::text)
  WITH CHECK (creator_id = auth.uid()::text);

-- =============================================================
-- Pledges policies
-- =============================================================

-- Backers can read their own pledges
CREATE POLICY "pledges_backer_select"
  ON "pledges"
  FOR SELECT
  TO authenticated
  USING (backer_id = auth.uid()::text);

-- Authenticated users can create pledges (as themselves)
CREATE POLICY "pledges_auth_insert"
  ON "pledges"
  FOR INSERT
  TO authenticated
  WITH CHECK (backer_id = auth.uid()::text);

-- =============================================================
-- Rewards policies
-- =============================================================

-- Anyone can read rewards
CREATE POLICY "rewards_public_select"
  ON "rewards"
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Project creators can manage rewards (via service_role in practice,
-- but this policy supports direct authenticated access if needed)
CREATE POLICY "rewards_creator_insert"
  ON "rewards"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "projects"
      WHERE "projects".id = project_id
        AND "projects".creator_id = auth.uid()::text
    )
  );

-- =============================================================
-- GenPoints Ledger policies: read own, write via service_role only
-- =============================================================

CREATE POLICY "genpoints_self_select"
  ON "genpoints_ledger"
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- No INSERT/UPDATE/DELETE for authenticated or anon.
-- Only service_role (which bypasses RLS) can write ledger entries.

-- =============================================================
-- Agent Tenants: service_role only (no anon/authenticated access)
-- =============================================================

-- No policies for anon or authenticated — all access is via service_role.
