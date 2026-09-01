import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { TeamRole } from '../lib/auth'

export type MyTeamMembership = { builderId: string; builderName: string; roleType: TeamRole }

export function useMyTeamMembership() {
  const { profile } = useAuth()
  const [membership, setMembership] = useState<MyTeamMembership | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile || !supabase) {
      setLoading(false)
      return
    }
    supabase
      .from('staff_members')
      .select('role_type, builder:builders(id, name)')
      .eq('profile_id', profile.id)
      .single()
      .then(({ data }) => {
        const row = data as { role_type: TeamRole; builder: { id: string; name: string } | null } | null
        setMembership(
          row?.builder ? { builderId: row.builder.id, builderName: row.builder.name, roleType: row.role_type } : null,
        )
        setLoading(false)
      })
  }, [profile])

  return { membership, loading }
}
