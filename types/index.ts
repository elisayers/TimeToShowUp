export interface Profile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  workspaces?: Workspace | Workspace[]
}

export interface WorkspaceMembership {
  role: 'owner' | 'member'
  workspaces?: Workspace | Workspace[] | null
}

export interface WorkspaceMemberWithProfile {
  workspace_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at?: string
  profiles?: Profile | null
}

export interface AccountabilityPeriod {
  id: string
  workspace_id: string
  name: string
  start_date: string
  end_date?: string | null
  status: 'active' | 'closed'
  created_at: string
}

export interface Commitment {
  id: string
  period_id: string
  user_id: string
  description: string
  status: 'active' | 'completed' | 'dropped'
  created_at: string
  completed_at?: string | null
  profiles?: Profile | null
}

export interface WorkSession {
  id: string
  workspace_id: string
  user_id: string
  commitment_id?: string | null
  duration_seconds: number
  description?: string | null
  started_at: string
  ended_at?: string | null
  created_at: string
  profiles?: Profile | null
  commitments?: Commitment | null
}

export interface Meeting {
  id: string
  workspace_id: string
  title: string
  scheduled_at: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string | null
  daily_room_url?: string | null
  period_id?: string | null
  created_at: string
  updated_at: string
  workspaces?: Workspace | null
}
