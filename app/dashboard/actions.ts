'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logWorkSession({ 
  duration_seconds, 
  description, 
  commitment_id, 
  workspace_id 
}: { 
  duration_seconds: number, 
  description?: string, 
  commitment_id?: string, 
  workspace_id: string 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  if (!Number.isInteger(duration_seconds) || duration_seconds <= 0 || duration_seconds > 86_400) {
    return { error: 'Elapsed time must be between 1 second and 24 hours.' }
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return { error: 'Workspace access denied.' }

  if (commitment_id) {
    const { data: commitment } = await supabase
      .from('commitments')
      .select('id, user_id, accountability_periods(workspace_id)')
      .eq('id', commitment_id)
      .eq('user_id', user.id)
      .maybeSingle()

    const period = Array.isArray(commitment?.accountability_periods)
      ? commitment.accountability_periods[0]
      : commitment?.accountability_periods
    if (!commitment || !period || period.workspace_id !== workspace_id) {
      return { error: 'Select one of your own tasks in this workspace.' }
    }
  }

  const endedAt = new Date()
  const startedAt = new Date(endedAt.getTime() - duration_seconds * 1000)

  const { error } = await supabase
    .from('work_sessions')
    .insert({
      workspace_id,
      user_id: user.id,
      commitment_id: commitment_id || null,
      duration_seconds,
      description: description?.trim() || 'Focus Session',
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    })

  if (error) {
    console.error('Error logging work session:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function scheduleMeeting({
  workspace_id,
  title,
  scheduled_at,
  period_id,
}: {
  workspace_id: string
  title: string
  scheduled_at: string
  period_id?: string
}) {
  const { createDailyRoom } = await import('@/utils/daily')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  try {
    const roomName = `ttsu-${workspace_id.slice(0, 8)}-${Date.now().toString(36)}`
    const room = await createDailyRoom(roomName)

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        workspace_id,
        title: title || 'Accountability Review',
        scheduled_at: new Date(scheduled_at).toISOString(),
        status: 'scheduled',
        daily_room_url: room.url,
        period_id: period_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting meeting:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, meeting }
  } catch (err: unknown) {
    console.error('Error in scheduleMeeting:', err)
    return { error: err instanceof Error ? err.message : 'Failed to schedule meeting' }
  }
}

export async function closePeriod({
  period_id,
}: {
  period_id: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('accountability_periods')
    .update({
      status: 'closed',
      end_date: new Date().toISOString(),
    })
    .eq('id', period_id)

  if (error) {
    console.error('Error closing period:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/history')
  return { success: true }
}

export async function inviteMember({
  workspace_id,
  email,
}: {
  workspace_id: string
  email: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const trimmedEmail = email.trim().toLowerCase()

  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', trimmedEmail)
    .single()

  if (profileError || !targetProfile) {
    return {
      error: `No registered Time to Show Up user found with email "${trimmedEmail}". Ask your partner to sign in once, then you can add them immediately!`,
    }
  }

  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspace_id)
    .eq('user_id', targetProfile.id)
    .maybeSingle()

  if (existingMember) {
    return { error: 'This user is already a member of this workspace.' }
  }

  const { error: insertError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id,
      user_id: targetProfile.id,
      role: 'member',
    })

  if (insertError) {
    console.error('Error adding member:', insertError)
    return { error: insertError.message }
  }

  revalidatePath('/dashboard')
  return { success: true, member: targetProfile }
}
