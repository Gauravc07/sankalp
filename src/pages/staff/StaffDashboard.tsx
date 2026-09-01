import { useEffect, useState } from 'react'
import { CalendarDays, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { SmallButton } from '../../components/ui/Field'

type Visit = {
  request_id: string
  status: string
  slot_date: string
  slot_time: string
  visit_purpose: string | null
  subject: string
  unit_number: string
  tower_name: string
  customer_name: string | null
  customer_phone: string | null
  visit_completed_by: string | null
  visit_completed_at: string | null
  visit_confirmed_at: string | null
}

export function StaffDashboard() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  async function load() {
    if (!supabase) return
    const { data } = await supabase.rpc('staff_my_assigned_visits')
    setVisits((data as Visit[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function markCompleted(requestId: string) {
    if (!supabase) return
    setMarking(requestId)
    await supabase
      .from('support_requests')
      .update({ visit_completed_by: 'staff', visit_completed_at: new Date().toISOString() })
      .eq('id', requestId)
    setMarking(null)
    load()
  }

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2">
        <CalendarDays size={18} className="text-neutral-400" />
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Today&rsquo;s visits</h1>
      </div>
      <p className="mt-1 text-callout text-neutral-600">
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div className="mt-6 space-y-3">
        {visits.map((v) => (
          <div key={v.request_id} className="rounded-lg border border-neutral-200 bg-neutral-0 p-4">
            <div className="flex items-center justify-between">
              <p className="text-callout font-semibold text-neutral-900">{v.slot_time}</p>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">
                {v.visit_purpose?.replace('_', ' ') ?? 'Site visit'}
              </span>
            </div>
            <p className="mt-1 text-callout text-neutral-900">
              {v.tower_name} &middot; {v.unit_number}
            </p>
            {(v.customer_name || v.customer_phone) && (
              <p className="mt-0.5 flex items-center gap-1.5 text-footnote text-neutral-600">
                {v.customer_name}
                {v.customer_phone && (
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Phone size={11} /> {v.customer_phone}
                  </span>
                )}
              </p>
            )}

            <div className="mt-3">
              {!v.visit_completed_at && (
                <SmallButton disabled={marking === v.request_id} onClick={() => markCompleted(v.request_id)}>
                  {marking === v.request_id ? 'Marking…' : 'Mark completed'}
                </SmallButton>
              )}
              {v.visit_completed_by === 'staff' && !v.visit_confirmed_at && (
                <p className="text-footnote text-status-attention">Awaiting buyer confirmation</p>
              )}
              {v.visit_confirmed_at && <p className="text-footnote text-status-on-track">Confirmed complete</p>}
            </div>
          </div>
        ))}
        {visits.length === 0 && <p className="text-callout text-neutral-400">No visits assigned to you today.</p>}
      </div>
    </div>
  )
}
