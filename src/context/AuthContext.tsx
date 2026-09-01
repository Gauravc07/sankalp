import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile } from '../lib/auth'
import { takePendingBookingCode, claimBooking, takePendingStaffInvite, claimStaffInvite } from '../lib/auth'

type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile((data as Profile) ?? null)
  }

  async function refreshProfile() {
    if (session?.user) await loadProfile(session.user.id)
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        await loadProfile(data.session.user.id)

        const email = data.session.user.email
        if (email) {
          const pendingCode = takePendingBookingCode(email)
          if (pendingCode) await claimBooking(pendingCode, data.session.user.id)

          const pendingStaffCode = takePendingStaffInvite(email)
          if (pendingStaffCode) await claimStaffInvite(pendingStaffCode, data.session.user.id)
        }
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
