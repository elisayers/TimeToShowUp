import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: workspaces } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)

  if (workspaces && workspaces.length > 0) {
    redirect('/dashboard')
  }

  async function createWorkspace(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    
    if (!name) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
    }

    // Create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({ name, created_by: user.id })
      .select()
      .single()

    if (workspaceError || !workspace) {
      console.error('Error creating workspace', workspaceError)
      return
    }

    // Add user as owner
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })

    if (memberError) {
      console.error('Error adding member', memberError)
      return
    }

    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] p-8 bg-white shadow rounded-xl border">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create a Workspace</h1>
          <p className="text-sm text-gray-500">
            Set up your accountability partnership space.
          </p>
        </div>
        
        <form action={createWorkspace} className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Workspace Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Eli & Shawn's Space"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>
          <Button type="submit" className="w-full">
            Continue to Dashboard
          </Button>
        </form>
      </div>
    </div>
  )
}
