-- Phase 2 Schema: Periods, Commitments, Work Sessions

CREATE TYPE period_status AS ENUM ('active', 'closed');
CREATE TYPE commitment_status AS ENUM ('active', 'completed', 'dropped');

-- ACCOUNTABILITY PERIODS
CREATE TABLE accountability_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status period_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE accountability_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view periods in their workspaces"
  ON accountability_periods FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Users can insert periods in their workspaces"
  ON accountability_periods FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Users can update periods in their workspaces"
  ON accountability_periods FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

-- COMMITMENTS
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES accountability_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status commitment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

-- We need a function to check period workspace membership easily
CREATE OR REPLACE FUNCTION public.is_period_workspace_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM accountability_periods ap
    JOIN workspace_members wm ON ap.workspace_id = wm.workspace_id
    WHERE ap.id = p_id AND wm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE POLICY "Users can view commitments in their workspaces"
  ON commitments FOR SELECT
  USING (public.is_period_workspace_member(period_id));

CREATE POLICY "Users can insert their own commitments"
  ON commitments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND 
    public.is_period_workspace_member(period_id)
  );

CREATE POLICY "Users can update their own commitments"
  ON commitments FOR UPDATE
  USING (
    user_id = auth.uid() AND 
    public.is_period_workspace_member(period_id)
  );

-- WORK SESSIONS
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES commitments(id) ON DELETE CASCADE,
  duration_seconds INTEGER,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work sessions in their workspaces"
  ON work_sessions FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Users can insert their own work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND 
    public.is_workspace_member(workspace_id)
  );

CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (
    user_id = auth.uid() AND 
    public.is_workspace_member(workspace_id)
  );
