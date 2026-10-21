import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { MeetingRoom } from '@/components/MeetingRoom'
import { parseMeetingNotes } from '@/lib/meeting-notes'
import { getDailyTranscript } from '@/utils/daily'
import type { Commitment } from '@/types'

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*, workspaces(*)')
    .eq('id', id)
    .single()

  if (error || !meeting) {
    notFound()
  }

  let commitments: Commitment[] = []
  if (meeting.period_id) {
    const { data: fetched } = await supabase
      .from('commitments')
      .select('*, profiles(full_name, email)')
      .eq('period_id', meeting.period_id)
      .order('created_at', { ascending: true })
    commitments = (fetched || []) as unknown as Commitment[]
  } else {
    const { data: activePeriods } = await supabase
      .from('accountability_periods')
      .select('id')
      .eq('workspace_id', meeting.workspace_id)
      .eq('status', 'active')
      .limit(1)

    if (activePeriods && activePeriods.length > 0) {
      const { data: fetched } = await supabase
        .from('commitments')
        .select('*, profiles(full_name, email)')
        .eq('period_id', activePeriods[0].id)
        .order('created_at', { ascending: true })
      commitments = (fetched || []) as unknown as Commitment[]
    }
  }

  const notesDocument = parseMeetingNotes(meeting.notes)
  const transcript = await getDailyTranscript(meeting.daily_room_url)

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <MeetingRoom
        meeting={meeting as unknown as import('@/types').Meeting}
        commitments={commitments}
        currentUserId={user.id}
        initialNotes={notesDocument.shared_notes}
        initialOutcomes={notesDocument.said_did}
        transcript={transcript}
      />
    </div>
  )
}
