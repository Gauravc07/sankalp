import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../../lib/supabase'
import { Field, SmallButton } from '../../../components/ui/Field'
import { StatusChip } from '../../../components/ui/StatusChip'

type Slot = { id: string; slot_date: string; slot_time: string; capacity: number }
type Booking = {
  id: string
  subject: string
  visit_purpose: string | null
  status: string
  site_visit_slot_id: string | null
  assigned_staff_id: string | null
}
type Staff = { id: string; full_name: string }

export function SiteVisitsTab({ projectId, builderId }: { projectId: string; builderId: string }) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [slotDate, setSlotDate] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [capacity, setCapacity] = useState('2')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!supabase) return
    const { data: s } = await supabase
      .from('site_visit_slots')
      .select('id, slot_date, slot_time, capacity')
      .eq('project_id', projectId)
      .order('slot_date')
    setSlots((s as Slot[]) ?? [])

    const slotIds = (s ?? []).map((row) => row.id)
    if (slotIds.length) {
      const { data: b } = await supabase
        .from('support_requests')
        .select('id, subject, visit_purpose, status, site_visit_slot_id, assigned_staff_id')
        .in('site_visit_slot_id', slotIds)
      setBookings((b as Booking[]) ?? [])
    } else {
      setBookings([])
    }

    const { data: staffRows } = await supabase
      .from('staff_members')
      .select('id, full_name')
      .eq('builder_id', builderId)
      .eq('is_active', true)
      .order('full_name')
    setStaff((staffRows as Staff[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, builderId])

  async function reassign(bookingId: string, staffId: string) {
    if (!supabase) return
    await supabase
      .from('support_requests')
      .update({ assigned_staff_id: staffId || null })
      .eq('id', bookingId)
    load()
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('site_visit_slots').insert({
      project_id: projectId,
      slot_date: slotDate,
      slot_time: slotTime,
      capacity: Number(capacity),
    })
    setSaving(false)
    setSlotDate('')
    setSlotTime('')
    load()
  }

  const bookedCount = (slotId: string) => bookings.filter((b) => b.site_visit_slot_id === slotId && b.status !== 'rejected' && b.status !== 'closed').length

  return (
    <div className="max-w-2xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
        Open a site visit slot
      </h2>
      <p className="mt-1 text-footnote text-neutral-400">
        Buyers can only book from slots you create here — capacity is enforced by you, not an open calendar.
      </p>
      <form onSubmit={handleCreate} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-0 p-4">
        <Field label="Date" type="date" required value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
        <Field label="Time" required value={slotTime} onChange={(e) => setSlotTime(e.target.value)} placeholder="10:00 AM – 11:00 AM" />
        <div className="w-24">
          <Field label="Capacity" type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        <SmallButton disabled={saving} type="submit">
          {saving ? 'Adding…' : 'Add slot'}
        </SmallButton>
      </form>

      <h2 className="mt-8 text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Slots &amp; bookings</h2>
      <div className="mt-3 space-y-2">
        {slots.map((s) => {
          const booked = bookedCount(s.id)
          const full = booked >= s.capacity
          return (
            <div key={s.id} className="rounded-lg border border-neutral-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-callout font-semibold text-neutral-900">
                  {new Date(s.slot_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &middot; {s.slot_time}
                </p>
                <StatusChip tone={full ? 'overdue' : 'onTrack'} label={`${booked}/${s.capacity} booked`} />
              </div>
              <div className="mt-2 space-y-1.5">
                {bookings
                  .filter((b) => b.site_visit_slot_id === s.id)
                  .map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2">
                      <p className="text-footnote text-neutral-600">
                        {b.subject} — <span className="text-neutral-400">{b.visit_purpose?.replace('_', ' ')}</span>
                      </p>
                      <select
                        value={b.assigned_staff_id ?? ''}
                        onChange={(e) => reassign(b.id, e.target.value)}
                        className="rounded-md border border-neutral-200 bg-neutral-0 px-2 py-1 text-caption text-neutral-900 outline-none"
                      >
                        <option value="">Unassigned</option>
                        {staff.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          )
        })}
        {slots.length === 0 && <p className="text-callout text-neutral-400">No slots opened yet.</p>}
      </div>
    </div>
  )
}
