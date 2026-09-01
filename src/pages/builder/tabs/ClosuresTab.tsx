import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField } from '../../../components/ui/Field'

type Closure = {
  id: string
  booking_id: string
  agreement_status: string
  registration_status: string
  registration_date: string | null
  handover_status: string
  booking: { booking_code: string; unit: { unit_number: string; tower: { name: string } } } | null
}

export function ClosuresTab({ projectId }: { projectId: string }) {
  const [closures, setClosures] = useState<Closure[]>([])

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('closures')
      .select(
        'id, booking_id, agreement_status, registration_status, registration_date, handover_status, booking:bookings(booking_code, unit:units(unit_number, tower:towers(name)))',
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setClosures((data as unknown as Closure[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function update(id: string, patch: Partial<Closure>) {
    if (!supabase) return
    await supabase.from('closures').update(patch).eq('id', id)
    load()
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Closures</h2>
      <p className="mt-1 text-footnote text-neutral-400">
        Post-booking checklist — agreement, registration, and handover status for every booking. Created automatically when a unit is booked.
      </p>

      <div className="mt-3 space-y-2">
        {closures.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutral-200 p-4">
            <p className="text-callout font-semibold text-neutral-900">
              {c.booking?.unit ? `${c.booking.unit.tower.name} · ${c.booking.unit.unit_number}` : '—'}
              <span className="ml-2 font-mono text-footnote font-normal text-neutral-400">{c.booking?.booking_code}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <SelectField label="Agreement" value={c.agreement_status} onChange={(e) => update(c.id, { agreement_status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="drafted">Drafted</option>
                <option value="sent_for_signature">Sent for signature</option>
                <option value="signed">Signed</option>
              </SelectField>
              <SelectField label="Registration" value={c.registration_status} onChange={(e) => update(c.id, { registration_status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </SelectField>
              <div className="w-40">
                <Field
                  label="Registration date"
                  type="date"
                  value={c.registration_date ?? ''}
                  onChange={(e) => update(c.id, { registration_date: e.target.value || null })}
                />
              </div>
              <SelectField label="Handover" value={c.handover_status} onChange={(e) => update(c.id, { handover_status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="ready">Ready</option>
                <option value="handed_over">Handed over</option>
              </SelectField>
            </div>
          </div>
        ))}
        {closures.length === 0 && <p className="text-callout text-neutral-400">No bookings yet — closures are created automatically once a unit is booked.</p>}
      </div>
    </div>
  )
}
