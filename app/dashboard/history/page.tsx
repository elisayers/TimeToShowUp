import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { AccountabilityPeriod, Commitment, WorkSession, Meeting } from '@/types'
import { parseMeetingNotes } from '@/lib/meeting-notes'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get active workspace for user
  const { data: members } = await supabase
    .from('workspace_members')
    .select('role, workspaces(*)')
    .eq('user_id', user.id)

  const activeWorkspace = members && members.length > 0
    ? (Array.isArray(members[0].workspaces) ? members[0].workspaces[0] : members[0].workspaces)
    : null

  if (!activeWorkspace) {
    redirect('/onboarding')
  }

  // Fetch closed periods
  const { data: fetchPeriods } = await supabase
    .from('accountability_periods')
    .select('*')
    .eq('workspace_id', activeWorkspace.id)
    .eq('status', 'closed')
    .order('start_date', { ascending: false })

  const periods = (fetchPeriods || []) as AccountabilityPeriod[]

  // For each closed period, fetch commitments, work sessions, and meetings
  const periodsData = await Promise.all(
    periods.map(async (period) => {
      const [commitmentsRes, sessionsRes, meetingsRes] = await Promise.all([
        supabase
          .from('commitments')
          .select('*, profiles(full_name, email)')
          .eq('period_id', period.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('work_sessions')
          .select('*, profiles(full_name, email), commitments(description)')
          .eq('workspace_id', activeWorkspace.id)
          .gte('started_at', period.start_date)
          .lte('started_at', period.end_date || new Date().toISOString()),
        supabase
          .from('meetings')
          .select('*')
          .eq('workspace_id', activeWorkspace.id)
          .eq('period_id', period.id)
          .order('scheduled_at', { ascending: true }),
      ])

      const periodCommitments = (commitmentsRes.data || []) as unknown as Commitment[]
      const periodSessions = (sessionsRes.data || []) as unknown as WorkSession[]
      const periodMeetings = (meetingsRes.data || []) as unknown as Meeting[]

      const totalSeconds = periodSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
      const totalMinutes = Math.round(totalSeconds / 60)

      return {
        period,
        commitments: periodCommitments,
        sessions: periodSessions,
        meetings: periodMeetings,
        totalMinutes,
      }
    })
  )

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Accountability History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Archived rounds, commitments declared, time logged, and review takeaways for {activeWorkspace.name}.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-medium text-gray-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {periodsData.length > 0 ? (
        <div className="space-y-6">
          {periodsData.map(({ period, commitments, meetings, totalMinutes }) => (
            <div key={period.id} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{period.name}</h2>
                  <p className="text-xs text-gray-500">
                    {formatDate(period.start_date)} — {formatDate(period.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                    {totalMinutes} mins total focus
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    Archived
                  </span>
                </div>
              </div>

              {/* Commitments & Outcomes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Declared Commitments & Outcomes</h3>
                {commitments.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {commitments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-gray-50 border rounded-lg flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className={`text-sm font-medium ${c.status === 'completed' ? 'text-gray-900' : 'text-gray-700'}`}>
                            {c.description}
                          </p>
                          <p className="text-xs text-gray-400 capitalize mt-0.5">
                            {c.profiles?.full_name || c.profiles?.email}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize shrink-0 ${
                            c.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : c.status === 'dropped'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No commitments were declared in this period.</p>
                )}
              </div>

              {/* Meeting Reviews & Shared Notes */}
              {meetings.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Review Meetings & Shared Notes</h3>
                  <div className="space-y-3">
                    {meetings.map((m) => (
                      <div key={m.id} className="p-3 bg-gray-50 border rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-900">{m.title || 'Review Meeting'}</p>
                          <span className="text-[11px] text-gray-500">{formatDate(m.scheduled_at)}</span>
                        </div>
                        <MeetingReviewNotes meeting={m} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center space-y-3">
          <p className="text-base font-semibold text-gray-900">No archived periods yet</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            When you complete a round on your Dashboard and click &ldquo;Close &amp; Archive Period&rdquo;,
            its commitments, logged work sessions, and review notes will be permanently preserved here.
          </p>
          <Link
            href="/dashboard"
            className="inline-block text-xs font-medium text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

function MeetingReviewNotes({ meeting }: { meeting: Meeting }) {
  const document = parseMeetingNotes(meeting.notes)

  if (!document.shared_notes && document.said_did.length === 0) {
    return <p className="text-xs text-gray-400 italic">No notes or Said/Did outcomes were saved for this meeting.</p>
  }

  return (
    <div className="space-y-2">
      {document.shared_notes && (
        <div className="whitespace-pre-wrap rounded border bg-white p-2.5 text-xs text-gray-700">
          {document.shared_notes}
        </div>
      )}
      {document.said_did.map((outcome) => (
        <div key={`${outcome.user_id}-${outcome.commitment_id}`} className="grid gap-2 rounded border bg-white p-2.5 text-xs sm:grid-cols-2">
          <div>
            <p className="font-semibold uppercase tracking-wide text-blue-700">{outcome.user_label} said</p>
            <p className="mt-1 text-gray-800">{outcome.said}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-green-700">Did · {outcome.status}</p>
            <p className="mt-1 text-gray-800">{outcome.did}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
