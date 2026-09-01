import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export type Notification = {
  id: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export function useNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  async function load() {
    if (!profile || !supabase) return
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, link, read_at, created_at')
      .eq('customer_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifications((data as Notification[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function markRead(id: string) {
    if (!supabase) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return { notifications, unreadCount, markRead, refresh: load }
}
