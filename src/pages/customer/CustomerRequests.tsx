import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'
import { Field, SelectField, SmallButton } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { SlotPicker } from '../../components/ui/SlotPicker'
import { StatusChip, statusTone } from '../../components/ui/StatusChip'

type Request = {
  id: string
  category: string
  subject: string
  description: string | null
  status: string
  noc_type: string | null
  quoted_amount: number | null
  quote_status: string | null
  visit_purpose: string | null
  created_at: string
  assigned_staff_id: string | null
  visit_completed_by: string | null
  visit_completed_at: string | null
  visit_confirmed_at: string | null
}
type Slot = { id: string; slot_date: string; slot_time: string; capacity: number }
type Message = { id: string; sender_role: string; message: string; created_at: string }

const CATEGORY_LABEL: Record<string, string> = {
  general_query: 'General query',
  noc_request: 'NOC request',
  addon_request: 'Add-on request',
  site_visit: 'Site visit',
}

export function CustomerRequests() {
  const { profile } = useAuth()
  const { booking, loading } = useMyBooking()
  const [requests, setRequests] = useState<Request[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    if (!booking || !supabase) return
    const { data } = await supabase
      .from('support_requests')
      .select(
        'id, category, subject, description, status, noc_type, quoted_amount, quote_status, visit_purpose, created_at, assigned_staff_id, visit_completed_by, visit_completed_at, visit_confirmed_at',
      )
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: false })
    setRequests((data as Request[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking])

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!booking || !profile) return <NoBookingState />

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-title-1 font-bold text-neutral-900">Requests</h1>
          <p className="mt-1 text-callout text-neutral-600">Queries, NOCs, add-ons, and site visits — one place to ask for anything.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} /> New request
        </Button>
      </div>

      {showForm && (
        <NewRequestForm
          bookingId={booking.id}
          customerProfileId={profile.id}
          projectId={booking.unit.tower.project.id}
          onCreated={() => {
            setShowForm(false)
            load()
          }}
        />
      )}

      <div className="mt-6 space-y-2">
        {requests.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200">
            <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
              <span className="flex flex-1 items-center gap-2">
                {expanded === r.id ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
                <span className="text-callout font-semibold text-neutral-900">{r.subject}</span>
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">{CATEGORY_LABEL[r.category]}</span>
              <StatusChip tone={statusTone(r.status)} label={r.status.replace('_', ' ')} />
            </button>
            {expanded === r.id && <RequestDetail request={r} onChanged={load} />}
          </div>
        ))}
        {requests.length === 0 && !showForm && <p className="text-callout text-neutral-400">No requests yet.</p>}
      </div>
    </div>
  )
}

function NewRequestForm({
  bookingId,
  customerProfileId,
  projectId,
  onCreated,
}: {
  bookingId: string
  customerProfileId: string
  projectId: string
  onCreated: () => void
}) {
  const [category, setCategory] = useState('general_query')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [nocType, setNocType] = useState('resale')
  const [visitPurpose, setVisitPurpose] = useState('progress_check')
  const [slotId, setSlotId] = useState('')
  const [slots, setSlots] = useState<(Slot & { booked: number })[]>([])
  const [eligible, setEligible] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supabase) return
    if (category === 'noc_request') {
      supabase
        .from('payment_schedules')
        .select('id, payment_slabs(status)')
        .eq('booking_id', bookingId)
        .maybeSingle()
        .then(({ data }) => {
          const slabs = (data as { payment_slabs: { status: string }[] } | null)?.payment_slabs ?? []
          setEligible(slabs.length > 0 && slabs.every((s) => s.status === 'paid'))
        })
    }
    if (category === 'site_visit') {
      supabase.rpc('available_slots_for_project', { p_project_id: projectId }).then(({ data }) => {
        const withCounts = (data as (Slot & { booked: number })[]) ?? []
        setSlots(withCounts)
        const firstAvailable = withCounts.find((s) => s.booked < s.capacity)
        if (firstAvailable) setSlotId(firstAvailable.id)
      })
    }
  }, [category, bookingId, projectId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('support_requests').insert({
      booking_id: bookingId,
      customer_profile_id: customerProfileId,
      category,
      subject,
      description: description || null,
      noc_type: category === 'noc_request' ? nocType : null,
      visit_purpose: category === 'site_visit' ? visitPurpose : null,
      site_visit_slot_id: category === 'site_visit' ? slotId || null : null,
      quote_status: category === 'addon_request' ? 'pending' : null,
    })
    setSaving(false)
    onCreated()
  }

  const blockedForNoc = category === 'noc_request' && eligible === false

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-0 p-5">
      <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="general_query">General query / complaint</option>
        <option value="noc_request">NOC request</option>
        <option value="addon_request">Add-on / change request</option>
        <option value="site_visit">Site visit</option>
      </SelectField>

      <Field label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" />

      {category === 'noc_request' && (
        <>
          <SelectField label="NOC type" value={nocType} onChange={(e) => setNocType(e.target.value)}>
            <option value="loan_disbursement">Loan disbursement</option>
            <option value="resale">Resale</option>
            <option value="rental">Rental</option>
            <option value="other">Other</option>
          </SelectField>
          {eligible === false && (
            <p className="rounded-md bg-status-overdue/12 px-3 py-2 text-footnote text-status-overdue">
              All payment slabs must be fully paid before an NOC can be requested. Clear your dues in Payments first.
            </p>
          )}
        </>
      )}

      {category === 'site_visit' && (
        <>
          <SelectField label="Purpose" value={visitPurpose} onChange={(e) => setVisitPurpose(e.target.value)}>
            <option value="progress_check">Progress check</option>
            <option value="snagging">Pre-handover snagging inspection</option>
            <option value="general">General</option>
          </SelectField>
          <div>
            <span className="mb-1 block text-footnote font-medium text-neutral-600">Select a date and time</span>
            <SlotPicker slots={slots} value={slotId} onChange={setSlotId} />
          </div>
        </>
      )}

      <label className="block">
        <span className="mb-1 block text-footnote font-medium text-neutral-600">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
        />
      </label>

      <SmallButton disabled={saving || blockedForNoc || (category === 'site_visit' && !slotId)} type="submit">
        {saving ? 'Submitting…' : 'Submit request'}
      </SmallButton>
    </form>
  )
}

function RequestDetail({ request, onChanged }: { request: Request; onChanged: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [staffMember, setStaffMember] = useState<{ full_name: string; phone: string | null } | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!supabase || !request.assigned_staff_id) {
      setStaffMember(null)
      return
    }
    supabase
      .from('staff_members')
      .select('full_name, phone')
      .eq('id', request.assigned_staff_id)
      .single()
      .then(({ data }) => setStaffMember(data as { full_name: string; phone: string | null } | null))
  }, [request.assigned_staff_id])

  async function markVisitCompleted() {
    if (!supabase) return
    setUpdating(true)
    const now = new Date().toISOString()
    await supabase
      .from('support_requests')
      .update({ visit_completed_by: 'customer', visit_completed_at: now, visit_confirmed_at: now, status: 'resolved', resolved_at: now })
      .eq('id', request.id)
    setUpdating(false)
    onChanged()
  }

  async function confirmStaffCompletion() {
    if (!supabase) return
    setUpdating(true)
    const now = new Date().toISOString()
    await supabase
      .from('support_requests')
      .update({ visit_confirmed_at: now, status: 'resolved', resolved_at: now })
      .eq('id', request.id)
    setUpdating(false)
    onChanged()
  }

  async function rejectStaffCompletion() {
    if (!supabase) return
    setUpdating(true)
    await supabase
      .from('support_requests')
      .update({ visit_completed_by: null, visit_completed_at: null })
      .eq('id', request.id)
    setUpdating(false)
    onChanged()
  }

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('support_request_messages')
      .select('id, sender_role, message, created_at')
      .eq('support_request_id', request.id)
      .order('created_at')
    setMessages((data as Message[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id])

  async function sendReply(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !reply.trim()) return
    await supabase.from('support_request_messages').insert({ support_request_id: request.id, sender_role: 'customer', message: reply })
    setReply('')
    load()
  }

  async function respondToQuote(decision: 'accepted' | 'declined') {
    if (!supabase) return
    await supabase.from('support_requests').update({ quote_status: decision }).eq('id', request.id)
    onChanged()
  }

  return (
    <div className="space-y-4 border-t border-neutral-200 bg-neutral-50 p-4">
      {request.description && <p className="text-callout text-neutral-600">{request.description}</p>}

      {request.category === 'site_visit' && (
        <div className="rounded-md border border-neutral-200 bg-neutral-0 p-3">
          <p className="text-footnote text-neutral-600">
            Assigned to: <span className="font-medium text-neutral-900">{staffMember?.full_name ?? 'Not yet assigned'}</span>
            {staffMember?.phone && <span className="text-neutral-400"> · {staffMember.phone}</span>}
          </p>

          {!request.visit_completed_at && (
            <div className="mt-2">
              <SmallButton disabled={updating} onClick={markVisitCompleted}>
                {updating ? 'Saving…' : 'Mark visit completed'}
              </SmallButton>
            </div>
          )}

          {request.visit_completed_by === 'staff' && !request.visit_confirmed_at && (
            <div className="mt-2">
              <p className="text-footnote text-status-attention">
                {staffMember?.full_name ?? 'Staff'} marked this visit complete — please confirm it happened.
              </p>
              <div className="mt-2 flex gap-2">
                <SmallButton disabled={updating} onClick={confirmStaffCompletion}>
                  Confirm
                </SmallButton>
                <button
                  onClick={rejectStaffCompletion}
                  disabled={updating}
                  className="rounded-full border border-neutral-200 px-4 py-2 text-caption font-semibold text-neutral-600 hover:border-neutral-400 disabled:opacity-50"
                >
                  Not yet — add a message below
                </button>
              </div>
            </div>
          )}

          {request.visit_confirmed_at && <p className="mt-2 text-footnote text-status-on-track">Visit completed</p>}
        </div>
      )}

      {request.category === 'addon_request' && request.quote_status === 'quoted' && (
        <div className="rounded-md border border-neutral-200 bg-neutral-0 p-3">
          <p className="text-footnote text-neutral-600">Quoted amount</p>
          <p className="text-title-3 font-bold text-neutral-900 tabular-nums">₹{Number(request.quoted_amount).toLocaleString('en-IN')}</p>
          <div className="mt-2 flex gap-2">
            <SmallButton onClick={() => respondToQuote('accepted')}>Accept</SmallButton>
            <button onClick={() => respondToQuote('declined')} className="rounded-full border border-neutral-200 px-4 py-2 text-caption font-semibold text-neutral-600 hover:border-neutral-400">
              Decline
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Thread</p>
        <div className="mt-2 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`rounded-md p-2.5 text-footnote ${m.sender_role === 'customer' ? 'bg-accent-100 text-accent-600' : 'bg-neutral-100 text-neutral-900'}`}>
              <span className="font-semibold">{m.sender_role === 'customer' ? 'You' : 'Builder'}:</span> {m.message}
            </div>
          ))}
          {messages.length === 0 && <p className="text-footnote text-neutral-400">No messages yet.</p>}
        </div>
        <form onSubmit={sendReply} className="mt-2 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Add a message…"
            className="flex-1 rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout outline-none focus:border-accent-500"
          />
          <SmallButton type="submit">Send</SmallButton>
        </form>
      </div>
    </div>
  )
}
