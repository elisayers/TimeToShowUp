'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { inviteMember } from '@/app/dashboard/actions'
import type { Workspace, WorkspaceMemberWithProfile } from '@/types'

export function WorkspaceMembersWidget({
  workspace,
  members,
  isOwner,
}: {
  workspace: Workspace
  members: WorkspaceMemberWithProfile[]
  isOwner: boolean
}) {
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setFeedback(null)

    const res = await inviteMember({
      workspace_id: workspace.id,
      email,
    })

    setIsSubmitting(false)
    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setFeedback({ type: 'success', text: `Added ${email} to workspace!` })
      setEmail('')
      setShowInvite(false)
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{workspace?.name || 'Workspace'}</h2>
          <p className="text-xs text-gray-500">Accountability Space</p>
        </div>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
            className="text-xs"
          >
            {showInvite ? 'Cancel' : '+ Add Partner'}
          </Button>
        )}
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="p-3 bg-gray-50 border rounded-lg space-y-2">
          <p className="text-xs font-medium text-gray-700">Add Accountability Partner</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com"
            className="w-full h-8 rounded-md border border-gray-300 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
            required
          />
          <Button type="submit" disabled={isSubmitting} size="sm" className="w-full text-xs h-8">
            {isSubmitting ? 'Adding...' : 'Add to Workspace'}
          </Button>
        </form>
      )}

      {feedback && (
        <p
          className={`text-xs p-2 rounded ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Members</h3>
        <ul className="space-y-2">
          {members.map((m) => {
            const profile = m.profiles
            return (
              <li
                key={m.user_id}
                className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-md border"
              >
                <div>
                  <p className="font-medium text-gray-900">{profile?.full_name || profile?.email || 'Member'}</p>
                  <p className="text-gray-500">{profile?.email}</p>
                </div>
                <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-gray-200 text-gray-700">
                  {m.role}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
