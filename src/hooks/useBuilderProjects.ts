import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type ProjectOption = { id: string; name: string; city: string | null }

export function useBuilderProjects(builderId: string | undefined) {
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!builderId || !supabase) {
      setLoading(false)
      return
    }
    supabase
      .from('projects')
      .select('id, name, city')
      .eq('builder_id', builderId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows = (data as ProjectOption[]) ?? []
        setProjects(rows)
        if (rows.length) setSelected((prev) => prev || rows[0].id)
        setLoading(false)
      })
  }, [builderId])

  return { projects, selected, setSelected, loading }
}
