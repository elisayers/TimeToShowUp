'use client'

import { useState } from 'react'
import type { WorkSession } from '@/types'

export function ActivityStream({ workSessions }: { workSessions: WorkSession[] }) {
  const [showExact, setShowExact] = useState(false)

  const formatDuration = (seconds: number) => {
    if (showExact) {
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      if (m === 0) return `${s}s`
      return `${m}m ${s}s`
    }
    return `${Math.round(seconds / 60)}m`
  }

  return (
    <div className="pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Recent Activity</h3>
        <button 
          onClick={() => setShowExact(!showExact)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showExact ? 'Show rounded minutes' : 'Show exact seconds'}
        </button>
      </div>
      
      {workSessions.length > 0 ? (
        <ul className="space-y-3">
          {workSessions.map((s) => (
            <li key={s.id} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="font-medium text-gray-900">
                {s.profiles?.full_name || s.profiles?.email}
              </span>
              <span>logged {formatDuration(s.duration_seconds)} on</span>
              <span className="italic">
                {s.commitments?.description || s.description || 'Unplanned work'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No work logged yet.</p>
      )}
    </div>
  )
}
