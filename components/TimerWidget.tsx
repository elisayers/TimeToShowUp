'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { logWorkSession } from '@/app/dashboard/actions'
import type { Commitment } from '@/types'

export function TimerWidget({ commitments, workspaceId }: { commitments: Commitment[], workspaceId: string }) {
  const [isRunning, setIsRunning] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [selectedCommitment, setSelectedCommitment] = useState('')
  const [description, setDescription] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsElapsed(s => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStartStop = async () => {
    if (isRunning || secondsElapsed > 0) {
      if (isRunning) setIsRunning(false)
      if (secondsElapsed > 0) {
        setIsSaving(true)
        setFeedback('Saving elapsed time...')
        const result = await logWorkSession({
          duration_seconds: secondsElapsed,
          description: description || 'Focus Session',
          commitment_id: selectedCommitment || undefined,
          workspace_id: workspaceId
        })
        setIsSaving(false)
        if (result?.error) {
          setFeedback(result.error)
          return
        }
        setFeedback(`Saved ${formatTime(secondsElapsed)}.`)
      }
      setSecondsElapsed(0)
      setDescription('')
    } else {
      setIsRunning(true)
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Focus Timer</h2>
      
      <div className="text-4xl font-mono text-center mb-6">
        {formatTime(secondsElapsed)}
      </div>

      <div className="space-y-4">
        <select 
          className="w-full h-10 rounded-md border border-gray-300 bg-transparent px-3 text-sm"
          value={selectedCommitment}
          onChange={e => setSelectedCommitment(e.target.value)}
          disabled={isRunning || isSaving}
        >
          <option value="">-- General / Unplanned --</option>
          {commitments.map(c => (
            <option key={c.id} value={c.id}>{c.description}</option>
          ))}
        </select>

        <input 
          type="text" 
          placeholder="What are you working on?" 
          className="w-full h-10 rounded-md border border-gray-300 bg-transparent px-3 text-sm"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={isRunning || isSaving}
        />

        <Button 
          className="w-full"
          variant={isRunning ? 'destructive' : 'default'}
          onClick={handleStartStop}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : isRunning ? 'Stop & Log Time' : secondsElapsed > 0 ? 'Retry Save Time' : 'Start Focus'}
        </Button>
        {feedback && <p className="text-xs text-gray-600" role="status">{feedback}</p>}
      </div>
    </div>
  )
}
