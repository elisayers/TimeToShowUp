'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const [errorMessage, setErrorMessage] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleGoogleSignIn = async () => {
    setErrorMessage('')
    setIsRedirecting(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setIsRedirecting(false)
      setErrorMessage(error.message)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Time to Show Up</h1>
          <p className="text-sm text-gray-500">Sign in to your accountability workspace</p>
        </div>
        <div className="grid gap-6">
          <Button onClick={handleGoogleSignIn} disabled={isRedirecting} variant="outline" className="w-full">
            {isRedirecting ? 'Opening Google...' : 'Sign in with Google'}
          </Button>
          {errorMessage && <p className="text-center text-sm text-red-600" role="alert">{errorMessage}</p>}
        </div>
      </div>
    </div>
  )
}
