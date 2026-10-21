CREATE OR REPLACE FUNCTION public.is_period_workspace_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accountability_periods ap
    JOIN public.workspace_members wm ON ap.workspace_id = wm.workspace_id
    WHERE ap.id = p_id AND wm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
