-- Allow creators to read their workspaces so that .select() works immediately after insert
CREATE POLICY "Users can view workspaces they created"
  ON public.workspaces FOR SELECT
  USING (created_by = auth.uid());
