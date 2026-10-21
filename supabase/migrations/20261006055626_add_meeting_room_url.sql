-- Add daily_room_url and title to meetings
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS daily_room_url TEXT,
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Accountability Review',
ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES public.accountability_periods(id) ON DELETE SET NULL;
