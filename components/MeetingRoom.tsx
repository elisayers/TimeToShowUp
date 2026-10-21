'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  completeMeetingWithTranscript,
  saveSaidDidOutcome,
  startMeetingWithTranscript,
  updateMeetingNotes,
} from '@/app/meetings/actions'
import type { SaidDidOutcome } from '@/lib/meeting-notes'
import type { DailyTranscriptResult } from '@/utils/daily'
import type { Meeting, Commitment } from '@/types'

const transcriptStyles: Record<DailyTranscriptResult['state'], string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-800',
  processing: 'bg-amber-100 text-amber-800',
  available: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  unavailable: 'bg-red-100 text-red-800',
}

export function MeetingRoom({
  meeting,
  commitments,
  currentUserId,
  initialNotes,
  initialOutcomes,
  transcript,
}: {
  meeting: Meeting
  commitments: Commitment[]
  currentUserId: string
  initialNotes: string
  initialOutcomes: SaidDidOutcome[]
  transcript: DailyTranscriptResult
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [meetingStatus, setMeetingStatus] = useState(meeting.status)
  const [meetingActionStatus, setMeetingActionStatus] = useState('')
  const [outcomes, setOutcomes] = useState(initialOutcomes)
  const [didDrafts, setDidDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialOutcomes.map((outcome) => [outcome.commitment_id, outcome.did])),
  )
  const [outcomeStatuses, setOutcomeStatuses] = useState<Record<string, Commitment['status']>>(
    Object.fromEntries(commitments.map((commitment) => [commitment.id, commitment.status])),
  )
  const [savingOutcomeId, setSavingOutcomeId] = useState('')
  const [outcomeFeedback, setOutcomeFeedback] = useState<Record<string, string>>({})

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    setSaveStatus('Saving...')
    const result = await updateMeetingNotes({ meeting_id: meeting.id, notes })
    setIsSavingNotes(false)
    setSaveStatus(result?.success ? 'Saved' : result?.error || 'Failed to save')
  }

  const handleStartMeeting = async () => {
    setMeetingActionStatus('Starting transcription...')
    const result = await startMeetingWithTranscript({ meeting_id: meeting.id })
    if (result?.success) {
      setMeetingStatus('in_progress')
      setMeetingActionStatus('Meeting and transcript started.')
      router.refresh()
    } else {
      setMeetingActionStatus(result?.error || 'Could not start the meeting.')
    }
  }

  const handleCompleteMeeting = async () => {
    setMeetingActionStatus('Stopping transcription...')
    const result = await completeMeetingWithTranscript({ meeting_id: meeting.id })
    if (result?.success) {
      setMeetingStatus('completed')
      setMeetingActionStatus('Review completed. Daily is finalizing the transcript.')
      router.refresh()
    } else {
      setMeetingActionStatus(result?.error || 'Could not complete the meeting.')
    }
  }

  const handleSaveOutcome = async (commitment: Commitment) => {
    setSavingOutcomeId(commitment.id)
    setOutcomeFeedback((previous) => ({ ...previous, [commitment.id]: 'Saving...' }))
    const result = await saveSaidDidOutcome({
      meeting_id: meeting.id,
      commitment_id: commitment.id,
      did: didDrafts[commitment.id] || '',
      status: outcomeStatuses[commitment.id] || commitment.status,
    })
    setSavingOutcomeId('')

    if (result?.success && result.outcome) {
      const savedOutcome = result.outcome
      setOutcomes((previous) => [
        ...previous.filter((outcome) => outcome.commitment_id !== commitment.id),
        savedOutcome,
      ])
      setOutcomeFeedback((previous) => ({ ...previous, [commitment.id]: 'Did saved.' }))
    } else {
      setOutcomeFeedback((previous) => ({
        ...previous,
        [commitment.id]: result?.error || 'Could not save Did.',
      }))
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">{meeting.title || 'Review Meeting'}</h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-800">
              {meetingStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex gap-2">
            {meetingStatus === 'scheduled' && (
              <Button size="sm" onClick={handleStartMeeting} className="text-xs">
                Start Meeting + Transcript
              </Button>
            )}
            {meetingStatus === 'in_progress' && (
              <Button size="sm" onClick={handleCompleteMeeting} className="text-xs">
                Complete Review
              </Button>
            )}
          </div>
          {meetingActionStatus && <p className="max-w-lg text-xs text-gray-600">{meetingActionStatus}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
        <strong>Join flow:</strong> use the video panel&apos;s Join button and allow camera/microphone. Once you are in the room,
        click <strong>Start Meeting + Transcript</strong>. Both partners use this same page.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="min-h-[440px] overflow-hidden rounded-xl border bg-gray-900 shadow-sm lg:col-span-7 xl:col-span-8">
          {meeting.daily_room_url ? (
            <iframe
              src={meeting.daily_room_url}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="h-[70vh] min-h-[440px] w-full border-0"
              title="Daily video meeting"
            />
          ) : (
            <div className="flex min-h-[440px] flex-col items-center justify-center p-6 text-white">
              <p className="font-semibold">Video room not available</p>
              <p className="text-sm text-gray-400">No Daily room is associated with this meeting.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-5 xl:col-span-4">
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Transcript</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${transcriptStyles[transcript.state]}`}>
                {transcript.state.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600">{transcript.message}</p>
            {transcript.content && (
              <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-gray-50 p-3 text-xs text-gray-800">
                {transcript.content}
              </pre>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => router.refresh()} className="mt-3 h-7 text-xs">
              Refresh Transcript Status
            </Button>
          </section>

          <section className="flex min-h-[220px] flex-col space-y-2 rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Shared Review Notes</h2>
              <div className="flex items-center gap-2">
                {saveStatus && <span className="text-xs text-gray-500">{saveStatus}</span>}
                <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={isSavingNotes} className="h-7 px-2 text-xs">
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Blockers, takeaways, and next steps..."
              className="min-h-[150px] w-full flex-1 resize-y rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </section>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-900">Said / Did Review</h2>
          <p className="text-xs text-gray-500">Each person records the outcome for their own declaration. Said remains unchanged.</p>
        </div>
        {commitments.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {commitments.map((commitment) => {
              const isOwner = commitment.user_id === currentUserId
              const savedOutcome = outcomes.find((outcome) => outcome.commitment_id === commitment.id)
              const userLabel = savedOutcome?.user_label || commitment.profiles?.full_name || commitment.profiles?.email || 'Member'

              return (
                <article key={commitment.id} className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{userLabel}</p>
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                      {savedOutcome?.status || commitment.status}
                    </span>
                  </div>
                  <div className="mt-3 border-l-4 border-blue-500 pl-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Said</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{savedOutcome?.said || commitment.description}</p>
                  </div>
                  <div className="mt-3 border-l-4 border-green-500 pl-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-green-700">Did</p>
                    {isOwner ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          value={didDrafts[commitment.id] || ''}
                          onChange={(event) => setDidDrafts((previous) => ({ ...previous, [commitment.id]: event.target.value }))}
                          placeholder="What actually happened?"
                          className="min-h-20 w-full rounded-md border bg-white p-2 text-sm"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={outcomeStatuses[commitment.id] || commitment.status}
                            onChange={(event) => setOutcomeStatuses((previous) => ({
                              ...previous,
                              [commitment.id]: event.target.value as Commitment['status'],
                            }))}
                            className="h-8 rounded-md border bg-white px-2 text-xs"
                          >
                            <option value="active">Still active</option>
                            <option value="completed">Completed</option>
                            <option value="dropped">Reconsidered</option>
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleSaveOutcome(commitment)}
                            disabled={savingOutcomeId === commitment.id}
                            className="h-8 text-xs"
                          >
                            {savingOutcomeId === commitment.id ? 'Saving...' : 'Save Did'}
                          </Button>
                          {outcomeFeedback[commitment.id] && (
                            <span className="text-xs text-gray-600">{outcomeFeedback[commitment.id]}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-800">{savedOutcome?.did || 'No outcome recorded yet.'}</p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No commitments are associated with this review period.</p>
        )}
      </section>
    </div>
  )
}
