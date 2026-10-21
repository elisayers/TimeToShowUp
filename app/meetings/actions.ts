'use server'

import { revalidatePath } from 'next/cache'
import { parseMeetingNotes, serializeMeetingNotes, upsertSaidDidOutcome } from '@/lib/meeting-notes'
import { getDailyTranscript, startDailyTranscription, stopDailyTranscription } from '@/utils/daily'
import { createClient } from '@/utils/supabase/server'

async function getAuthorizedMeeting(meetingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('id, workspace_id, period_id, daily_room_url, notes, status')
    .eq('id', meetingId)
    .single()

  if (error || !meeting) return { error: 'Meeting not found or access denied.' as const }
  return { supabase, user, meeting }
}

export async function updateMeetingNotes({ meeting_id, notes }: { meeting_id: string; notes: string }) {
  const context = await getAuthorizedMeeting(meeting_id)
  if ('error' in context) return { error: context.error }

  const document = parseMeetingNotes(context.meeting.notes)
  document.shared_notes = notes.trim()

  const { error } = await context.supabase
    .from('meetings')
    .update({ notes: serializeMeetingNotes(document), updated_at: new Date().toISOString() })
    .eq('id', meeting_id)

  if (error) return { error: error.message }
  revalidatePath(`/meetings/${meeting_id}`)
  return { success: true }
}

export async function startMeetingWithTranscript({ meeting_id }: { meeting_id: string }) {
  const context = await getAuthorizedMeeting(meeting_id)
  if ('error' in context) return { error: context.error }
  if (!context.meeting.daily_room_url) return { error: 'This meeting has no video room.' }

  try {
    await startDailyTranscription(context.meeting.daily_room_url)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `${error.message} Join the video room first, then try again.`
          : 'Could not start Daily transcription.',
    }
  }

  const { error } = await context.supabase
    .from('meetings')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', meeting_id)

  if (error) return { error: error.message }
  revalidatePath(`/meetings/${meeting_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeMeetingWithTranscript({ meeting_id }: { meeting_id: string }) {
  const context = await getAuthorizedMeeting(meeting_id)
  if ('error' in context) return { error: context.error }
  if (!context.meeting.daily_room_url) return { error: 'This meeting has no video room.' }

  try {
    await stopDailyTranscription(context.meeting.daily_room_url)
  } catch (error) {
    const transcript = await getDailyTranscript(context.meeting.daily_room_url)
    if (transcript.state === 'not_started' || transcript.state === 'failed' || transcript.state === 'unavailable') {
      return {
        error:
          error instanceof Error
            ? `${error.message} The review was not completed because no usable transcript was found.`
            : 'The review was not completed because transcription could not be confirmed.',
      }
    }
  }

  const { error } = await context.supabase
    .from('meetings')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', meeting_id)

  if (error) return { error: error.message }
  revalidatePath(`/meetings/${meeting_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function saveSaidDidOutcome({
  meeting_id,
  commitment_id,
  did,
  status,
}: {
  meeting_id: string
  commitment_id: string
  did: string
  status: 'active' | 'completed' | 'dropped'
}) {
  const trimmedDid = did.trim()
  if (!trimmedDid) return { error: 'Record what happened before saving Did.' }

  const context = await getAuthorizedMeeting(meeting_id)
  if ('error' in context) return { error: context.error }

  const { data: commitment, error: commitmentError } = await context.supabase
    .from('commitments')
    .select('id, period_id, user_id, description')
    .eq('id', commitment_id)
    .single()

  if (commitmentError || !commitment) return { error: 'Commitment not found.' }
  if (commitment.user_id !== context.user.id) return { error: 'You can only record Did for your own Said.' }
  if (context.meeting.period_id && commitment.period_id !== context.meeting.period_id) {
    return { error: 'This commitment does not belong to the meeting period.' }
  }

  const { data: period } = await context.supabase
    .from('accountability_periods')
    .select('workspace_id')
    .eq('id', commitment.period_id)
    .single()
  if (!period || period.workspace_id !== context.meeting.workspace_id) {
    return { error: 'This commitment does not belong to the meeting workspace.' }
  }

  const { data: profile } = await context.supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', context.user.id)
    .single()

  const updatedAt = new Date().toISOString()
  const document = upsertSaidDidOutcome(parseMeetingNotes(context.meeting.notes), {
    commitment_id: commitment.id,
    user_id: context.user.id,
    period_id: commitment.period_id,
    user_label: profile?.full_name || profile?.email || context.user.email || 'Member',
    said: commitment.description,
    did: trimmedDid,
    status,
    updated_at: updatedAt,
  })

  const { error: statusError } = await context.supabase
    .from('commitments')
    .update({ status, completed_at: status === 'completed' ? updatedAt : null })
    .eq('id', commitment_id)
    .eq('user_id', context.user.id)

  if (statusError) return { error: statusError.message }

  const { error: notesError } = await context.supabase
    .from('meetings')
    .update({ notes: serializeMeetingNotes(document), updated_at: updatedAt })
    .eq('id', meeting_id)

  if (notesError) return { error: notesError.message }
  revalidatePath(`/meetings/${meeting_id}`)
  revalidatePath('/dashboard')
  return { success: true, outcome: document.said_did.find((item) => item.commitment_id === commitment_id) }
}
