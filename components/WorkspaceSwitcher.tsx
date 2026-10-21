'use client'

import type { Workspace } from '@/types'
import { useRouter } from 'next/navigation'

export function WorkspaceSwitcher({ workspaces, activeWorkspaceId }: { workspaces: Workspace[]; activeWorkspaceId: string }) {
  const router = useRouter()
  if (workspaces.length < 2) return null

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      Workspace
      <select
        value={activeWorkspaceId}
        onChange={(event) => {
          router.push(`/dashboard?workspace=${encodeURIComponent(event.target.value)}`)
        }}
        className="h-9 rounded-md border bg-white px-3 text-sm text-gray-900"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
        ))}
      </select>
    </label>
  )
}
