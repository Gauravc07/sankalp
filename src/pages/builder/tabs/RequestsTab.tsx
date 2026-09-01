import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'
import { StatusChip, statusTone } from '../../../components/ui/StatusChip'

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
  booking: { unit: { unit_number: string; tower: { name: string } } }
}

const CATEGORY_LABEL: Record<string, string> = {
  general_query: 'General query',
  noc_request: 'NOC request',
  addon_request: 'Add-on request',
  site_visit: 'Site visit',
}

export function RequestsTab({ projectId }: { projectId: string }) {
  const [requests, setRequests] = useState<Request[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('support_requests')
      .select(
        'id, category, subject, description, status, noc_type, quoted_amount, quote_status, visit_purpose, created_at, booking:bookings(unit:units(unit_number, tower:towers(name, project_id)))',
      )
      .order('created_at', { ascending: false })
    const filtered = ((data as unknown as Request[]) ?? []).filter(
      (r: any) => r.booking?.unit?.tower?.project_id === projectId,
    )
    setRequests(filtered)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const visible = filter === 'all' ? requests : requests.filter((r) => r.category === filter)

  return (
    <div className="max-w-3xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Requests</h2>
      <p className="mt-1 text-footnote text-neutral-400">
        One queue for general queries, NOC requests, add-on requests, and site visits.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {['all', 'general_query', 'noc_request', 'addon_request', 'site_visit'].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3.5 py-1.5 text-caption font-medium transition ${
              filter === c ? 'border-accent-500/40 bg-accent-100 text-accent-600' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {visible.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
              <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="flex flex-1 items-center gap-2 text-left">
                {expanded === r.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-callout font-semibold text-neutral-900">{r.subject}</span>
                <span className="text-footnote text-neutral-400">
                  {r.booking.unit.tower.name} &middot; {r.booking.unit.unit_number}
                </span>
              </button>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">{CATEGORY_LABEL[r.category]}</span>
              <StatusChip tone={statusTone(r.status)} label={r.status.replace('_', ' ')} />
            </div>
            {expanded === r.id && <RequestDetail request={r} onChanged={load} />}
          </div>
        ))}
        {visible.length === 0 && <p className="text-callout text-neutral-400">No requests in this category.</p>}
      </div>
    </div>
  )
}

type Message = { id: string; sender_role: string; message: string; created_at: string }

function RequestDetail({ request, onChanged }: { request: Request; onChanged: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState(request.status)
  const [quoteAmount, setQuoteAmount] = useState(request.quoted_amount != null ? String(request.quoted_amount) : '')

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
    await supabase.from('support_request_messages').insert({ support_request_id: request.id, sender_role: 'builder', message: reply })
    setReply('')
    load()
  }

  async function updateStatus(newStatus: string) {
    if (!supabase) return
    setStatus(newStatus)
    await supabase
      .from('support_requests')
      .update({ status: newStatus, resolved_at: newStatus === 'resolved' || newStatus === 'closed' ? new Date().toISOString() : null })
      .eq('id', request.id)
    onChanged()
  }

  async function sendQuote() {
    if (!supabase || !quoteAmount) return
    await supabase
      .from('support_requests')
      .update({ quoted_amount: Number(quoteAmount), quote_status: 'quoted', status: 'in_progress' })
      .eq('id', request.id)
    onChanged()
    load()
  }

  return (
    <div className="space-y-4 border-t border-neutral-200 bg-neutral-50 p-4">
      {request.description && <p className="text-callout text-neutral-600">{request.description}</p>}

      {request.category === 'noc_request' && (
        <div className="rounded-md border border-neutral-200 bg-neutral-0 p-3">
          <p className="text-footnote text-neutral-600">NOC type: {request.noc_type?.replace('_', ' ')}</p>
        </div>
      )}

      {request.category === 'addon_request' && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-neutral-200 bg-neutral-0 p-3">
          <div className="w-40">
            <Field label="Quote amount (₹)" type="number" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
          </div>
          <SmallButton onClick={sendQuote}>Send quote</SmallButton>
          {request.quote_status && <span className="text-footnote text-neutral-400">Buyer status: {request.quote_status}</span>}
        </div>
      )}

      <div className="flex items-center gap-3">
        <SelectField label="Status" value={status} onChange={(e) => updateStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </SelectField>
      </div>

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Thread</p>
        <div className="mt-2 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`rounded-md p-2.5 text-footnote ${m.sender_role === 'builder' ? 'bg-accent-100 text-accent-600' : 'bg-neutral-100 text-neutral-900'}`}>
              <span className="font-semibold">{m.sender_role === 'builder' ? 'You' : 'Buyer'}:</span> {m.message}
            </div>
          ))}
          {messages.length === 0 && <p className="text-footnote text-neutral-400">No messages yet.</p>}
        </div>
        <form onSubmit={sendReply} className="mt-2 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to buyer…"
            className="flex-1 rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout outline-none focus:border-accent-500"
          />
          <SmallButton type="submit">Send</SmallButton>
        </form>
      </div>
    </div>
  )
}
