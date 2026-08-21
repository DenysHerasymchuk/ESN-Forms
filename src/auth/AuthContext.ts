import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { ProfileRow } from '../lib/database.types'

export type AuthContextValue = {
  user: User | null
  profile: ProfileRow | null
  isLoading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
