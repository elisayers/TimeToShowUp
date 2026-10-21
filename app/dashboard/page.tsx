import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'
import { TimerWidget } from '@/components/TimerWidget'
import { ActivityStream } from '@/components/ActivityStream'
import { MeetingsWidget } from '@/components/MeetingsWidget'
import { ClosePeriodButton } from '@/components/ClosePeriodButton'
import { WorkspaceMembersWidget } from '@/components/WorkspaceMembersWidget'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import type { AccountabilityPeriod, Commitment, WorkSession, Meeting, Workspace, WorkspaceMemberWithProfile, WorkspaceMembership } from '@/types'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const { workspace: requestedWorkspaceId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch workspaces the user is a member of
  const { data: members } = await supabase
    .from('workspace_members')
    .select('role, workspaces(*)')
    .eq('user_id', user.id)

  const workspaceMemberships = (members || []) as unknown as WorkspaceMembership[]
  const workspaces = workspaceMemberships
    .map((membership) => Array.isArray(membership.workspaces) ? membership.workspaces[0] : membership.workspaces)
    .filter((workspace): workspace is Workspace => Boolean(workspace))
  const activeWorkspace = workspaces.find((workspace) => workspace.id === requestedWorkspaceId) || workspaces[0] || null

  // Fetch the active period for the active workspace
  let activePeriod: AccountabilityPeriod | null = null
  let commitments: Commitment[] = []
  let workSessions: WorkSession[] = []
  let meetings: Meeting[] = []
  let workspaceMembers: WorkspaceMemberWithProfile[] = []
  let isOwner = false

  if (activeWorkspace) {
    const userRole = workspaceMemberships.find(m => {
      const ws = Array.isArray(m.workspaces) ? m.workspaces[0] : m.workspaces
      return ws?.id === activeWorkspace.id
    })?.role
    isOwner = userRole === 'owner'

    const { data: fetchMembers } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, user_id, profiles(*)')
      .eq('workspace_id', activeWorkspace.id)

    workspaceMembers = (fetchMembers || []) as unknown as WorkspaceMemberWithProfile[]

    const { data: periods } = await supabase
      .from('accountability_periods')
      .select('*')
      .eq('workspace_id', activeWorkspace.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (periods && periods.length > 0) {
      const currentPeriod = periods[0] as AccountabilityPeriod
      activePeriod = currentPeriod

      const { data: fetchCommitments } = await supabase
        .from('commitments')
        .select(`
          id, period_id, user_id, description, status, created_at, completed_at,
          profiles(id, email, full_name, avatar_url, created_at, updated_at)
        `)
        .eq('period_id', currentPeriod.id)
        .order('created_at', { ascending: true })
      
      commitments = (fetchCommitments || []) as unknown as Commitment[]
    }

    const { data: fetchWorkSessions } = await supabase
      .from('work_sessions')
      .select(`
        id, workspace_id, user_id, duration_seconds, description, started_at, ended_at, created_at,
        profiles(id, email, full_name, avatar_url, created_at, updated_at),
        commitments(id, period_id, user_id, description, status, created_at)
      `)
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    workSessions = (fetchWorkSessions || []) as unknown as WorkSession[]

    const { data: fetchMeetings } = await supabase
      .from('meetings')
      .select('*')
      .eq('workspace_id', activeWorkspace.id)
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_at', { ascending: true })

    meetings = (fetchMeetings || []) as unknown as Meeting[]
  }

  async function createPeriod() {
    'use server'
    if (!activeWorkspace) return
    const supabase = await createClient()
    await supabase
      .from('accountability_periods')
      .insert({
        workspace_id: activeWorkspace.id,
        name: `Sprint ${new Date().toLocaleDateString()}`
      })
    revalidatePath('/dashboard')
  }

  async function addCommitment(formData: FormData) {
    'use server'
    const description = formData.get('description') as string
    if (!description || !activePeriod) return
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('commitments')
      .insert({
        period_id: activePeriod.id,
        user_id: user.id,
        description
      })
    
    if (error) {
      console.error('Error adding commitment:', error)
      return
    }
    
    revalidatePath('/dashboard')
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {activeWorkspace && <p className="mt-1 text-sm text-gray-500">{activeWorkspace.name}</p>}
        </div>
        {activeWorkspace && <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspace.id} />}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Core Loop Area */}
        <div className="rounded-xl border bg-white p-6 shadow-sm col-span-1 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">Current Accountability Period</h2>
            {!activePeriod && (
              <form action={createPeriod}>
                <Button type="submit">Start New Period</Button>
              </form>
            )}
          </div>
          
          {activePeriod ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Period Name: {activePeriod.name}</p>
                <ClosePeriodButton periodId={activePeriod.id} />
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Shared Commitments</h3>
                {commitments.length > 0 ? (
                  <ul className="space-y-3 mb-4">
                    {commitments.map((c) => (
                      <li key={c.id} className="p-3 bg-gray-50 rounded-md border flex items-center justify-between">
                        <div>
                          <p className="font-medium">{c.description}</p>
                          <p className="text-xs text-gray-500 capitalize">{c.profiles?.full_name || c.profiles?.email} • {c.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No commitments declared yet.</p>
                )}
                
                <form action={addCommitment} className="flex gap-2">
                  <input
                    name="description"
                    type="text"
                    required
                    placeholder="I will..."
                    className="flex-1 h-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  <Button type="submit">Declare</Button>
                </form>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No active period. Start one to declare commitments.</p>
          )}

          <ActivityStream workSessions={workSessions} />
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {activeWorkspace && (
            <>
              <MeetingsWidget
                meetings={meetings}
                workspaceId={activeWorkspace.id}
                periodId={activePeriod?.id}
              />
              <TimerWidget
                commitments={commitments.filter((commitment) => commitment.user_id === user.id && commitment.status === 'active')}
                workspaceId={activeWorkspace.id}
              />
            </>
          )}

          {activeWorkspace && (
            <WorkspaceMembersWidget
              workspace={activeWorkspace}
              members={workspaceMembers}
              isOwner={isOwner}
            />
          )}
        </div>
      </div>
    </div>
  )
}
