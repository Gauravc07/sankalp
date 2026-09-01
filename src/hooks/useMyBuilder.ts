import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export type MyBuilder = { id: string; name: string }

export function useMyBuilder() {
  const { profile } = useAuth()
  const [builder, setBuilder] = useState<MyBuilder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile || !supabase) {
      setLoading(false)
      return
    }
    supabase
      .from('builders')
      .select('id, name')
      .eq('owner_profile_id', profile.id)
      .single()
      .then(({ data }) => {
        setBuilder(data as MyBuilder | null)
        setLoading(false)
      })
  }, [profile])

  return { builder, loading }
}
