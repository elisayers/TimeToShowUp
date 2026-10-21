import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LogOut } from 'lucide-react'

import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check if user has any workspace
  const { data: workspaces } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!workspaces || workspaces.length === 0) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg text-gray-900 tracking-tight">
            Time to Show Up
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-black transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              className="text-gray-500 hover:text-black transition-colors"
            >
              History
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{profile?.full_name || user.email}</span>
          <form action="/auth/signout" method="post">
            <button className="text-gray-500 hover:text-gray-900 flex items-center p-1 rounded-md" title="Sign Out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
