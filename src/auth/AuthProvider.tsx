import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { getCurrentUserProfile } from '../lib/adminApi'
import type { ProfileRow } from '../lib/database.types'
import { AuthContext } from './AuthContext'

type Props = {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadProfile(currentUser: User | null) {
      if (!currentUser) {
        if (isMounted) setProfile(null)
        return
      }
      try {
        const currentProfile = await getCurrentUserProfile()
        if (isMounted) setProfile(currentProfile)
      } catch (error) {
        console.error('Failed to load user profile:', error)
        if (isMounted) setProfile(null)
      }
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!isMounted) return
      setUser(data.user)
      await loadProfile(data.user)
      if (isMounted) setIsLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      void loadProfile(nextUser)
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ user, profile, isLoading, signOut }}>{children}</AuthContext.Provider>
}
