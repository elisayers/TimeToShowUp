'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { scheduleMeeting } from '@/app/dashboard/actions'
import type { Meeting } from '@/types'

export function MeetingsWidget({
  meetings,
  workspaceId,
  periodId,
}: {
  meetings: Meeting[]
  workspaceId: string
  periodId?: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('Accountability Review')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduledAt) {
      setErrorMsg('Please select a date and time')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    const res = await scheduleMeeting({
      workspace_id: workspaceId,
      title,
      scheduled_at: scheduledAt,
      period_id: periodId,
    })

    setIsSubmitting(false)
    if (res?.error) {
      setErrorMsg(res.error)
    } else {
      setShowForm(false)
      setTitle('Accountability Review')
      setScheduledAt('')
    }
  }

  const formatScheduledTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upcoming Meetings</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs"
        >
          {showForm ? 'Cancel' : '+ Schedule Meeting'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSchedule} className="p-4 bg-gray-50 border rounded-lg space-y-3">
          <h3 className="text-sm font-medium">Schedule Next Review</h3>
          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{errorMsg}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full text-xs">
            {isSubmitting ? 'Creating Daily.co room...' : 'Schedule & Create Room'}
          </Button>
        </form>
      )}

      {meetings && meetings.length > 0 ? (
        <ul className="space-y-3">
          {meetings.map((m) => (
            <li
              key={m.id}
              className="p-3 bg-gray-50 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium text-sm text-gray-900">{m.title || 'Review Meeting'}</p>
                <p className="text-xs text-gray-500">
                  {formatScheduledTime(m.scheduled_at)} •{' '}
                  <span className="capitalize font-semibold text-gray-700">{m.status.replace('_', ' ')}</span>
                </p>
              </div>
              <Link href={`/meetings/${m.id}`}>
                <Button size="sm" className="text-xs w-full sm:w-auto">
                  Join Review
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No scheduled meetings. Schedule one to start a review.</p>
      )}
    </div>
  )
}
