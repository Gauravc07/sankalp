import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'

type Contractor = { id: string; name: string }
type WO = {
  id: string
  wo_number: string
  contractor_id: string
  scope_description: string | null
  estimated_amount: number | null
  status: string
  start_date: string | null
  end_date: string | null
}
type Progress = { id: string; percent_complete: number | null; remarks: string | null; update_date: string }
type Payment = { id: string; amount: number; mode: string; payment_date: string; reference_number: string | null }

export function ContractorWOsTab({ builderId, projectId }: { builderId: string; projectId: string }) {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [wos, setWos] = useState<WO[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const [contractorId, setContractorId] = useState('')
  const [woNumber, setWoNumber] = useState('')
  const [scope, setScope] = useState('')
  const [estimatedAmount, setEstimatedAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!supabase) return
    const { data: c } = await supabase.from('contractors').select('id, name').eq('builder_id', builderId).order('name')
    setContractors((c as Contractor[]) ?? [])
    if (c && c.length && !contractorId) setContractorId((c[0] as Contractor).id)

    const { data: w } = await supabase
      .from('work_orders')
      .select('id, wo_number, contractor_id, scope_description, estimated_amount, status, start_date, end_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setWos((w as WO[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderId, projectId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !contractorId) return
    setSaving(true)
    await supabase.from('work_orders').insert({
      project_id: projectId,
      contractor_id: contractorId,
      wo_number: woNumber,
      scope_description: scope || null,
      estimated_amount: estimatedAmount ? Number(estimatedAmount) : null,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    setSaving(false)
    setWoNumber('')
    setScope('')
    setEstimatedAmount('')
    setStartDate('')
    setEndDate('')
    load()
  }

  async function setWoStatus(id: string, status: string) {
    if (!supabase) return
    await supabase.from('work_orders').update({ status }).eq('id', id)
    load()
  }

  const contractorName = (id: string) => contractors.find((c) => c.id === id)?.name ?? '—'

  if (contractors.length === 0) {
    return (
      <p className="text-callout text-neutral-400">
        No contractors in your directory yet — add one from the <span className="text-neutral-600">Contractors</span> page first.
      </p>
    )
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Issue a work order</h2>
      <form onSubmit={handleCreate} className="mt-3 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-2">
        <SelectField label="Contractor" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <Field label="WO number" required value={woNumber} onChange={(e) => setWoNumber(e.target.value)} placeholder="WO-2026-009" />
        <div className="sm:col-span-2">
          <Field label="Scope of work" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="RCC work, floors 15-18" />
        </div>
        <Field label="Estimated amount (₹)" type="number" value={estimatedAmount} onChange={(e) => setEstimatedAmount(e.target.value)} placeholder="4500000" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Field label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-end sm:col-span-2">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Issuing…' : 'Issue work order'}
          </SmallButton>
        </div>
      </form>

      <h2 className="mt-8 text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Work orders</h2>
      <div className="mt-3 space-y-2">
        {wos.map((wo) => (
          <div key={wo.id} className="rounded-lg border border-neutral-200">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-3 text-callout">
              <button
                onClick={() => setExpanded(expanded === wo.id ? null : wo.id)}
                className="flex flex-1 items-center gap-2 text-left text-neutral-900"
              >
                {expanded === wo.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {wo.wo_number} &middot; {contractorName(wo.contractor_id)}
              </button>
              <span className="text-footnote text-neutral-400">
                {wo.estimated_amount != null ? `₹${Number(wo.estimated_amount).toLocaleString('en-IN')}` : '—'}
              </span>
              <select
                value={wo.status}
                onChange={(e) => setWoStatus(wo.id, e.target.value)}
                className="rounded-md border border-neutral-200 bg-neutral-0 px-2 py-1 text-caption text-neutral-900 outline-none focus:border-accent-500"
              >
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {expanded === wo.id && <WODetail wo={wo} />}
          </div>
        ))}
        {wos.length === 0 && <p className="text-callout text-neutral-400">No work orders yet.</p>}
      </div>
    </div>
  )
}

function WODetail({ wo }: { wo: WO }) {
  const [progress, setProgress] = useState<Progress[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [percentComplete, setPercentComplete] = useState('')
  const [remarks, setRemarks] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('bank_transfer')
  const [paymentRef, setPaymentRef] = useState('')

  async function load() {
    if (!supabase) return
    const [{ data: p }, { data: pay }] = await Promise.all([
      supabase
        .from('work_order_progress')
        .select('id, percent_complete, remarks, update_date')
        .eq('work_order_id', wo.id)
        .order('update_date', { ascending: false }),
      supabase
        .from('contractor_payments')
        .select('id, amount, mode, payment_date, reference_number')
        .eq('work_order_id', wo.id)
        .order('payment_date', { ascending: false }),
    ])
    setProgress((p as Progress[]) ?? [])
    setPayments((pay as Payment[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo.id])

  async function addProgress(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('work_order_progress').insert({
      work_order_id: wo.id,
      percent_complete: percentComplete ? Number(percentComplete) : null,
      remarks: remarks || null,
    })
    setPercentComplete('')
    setRemarks('')
    load()
  }

  async function addPayment(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('contractor_payments').insert({
      work_order_id: wo.id,
      amount: Number(paymentAmount),
      mode: paymentMode,
      reference_number: paymentRef || null,
    })
    setPaymentAmount('')
    setPaymentRef('')
    load()
  }

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-5 border-t border-neutral-200 bg-neutral-50 p-4">
      {wo.scope_description && <p className="text-footnote text-neutral-400">{wo.scope_description}</p>}

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-neutral-200 bg-neutral-0 py-2">
          <p className="text-[11px] text-neutral-400">Estimated</p>
          <p className="text-callout font-semibold text-neutral-900">
            {wo.estimated_amount != null ? `₹${Number(wo.estimated_amount).toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-0 py-2">
          <p className="text-[11px] text-neutral-400">Paid</p>
          <p className="text-callout font-semibold text-status-on-track">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Job progress</p>
        <form onSubmit={addProgress} className="mt-2 flex flex-wrap items-end gap-2">
          <div className="w-28">
            <Field label="% complete" type="number" value={percentComplete} onChange={(e) => setPercentComplete(e.target.value)} />
          </div>
          <div className="w-52">
            <Field label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Shuttering complete, pour next week" />
          </div>
          <SmallButton type="submit">Log progress</SmallButton>
        </form>
        <div className="mt-2 space-y-1">
          {progress.map((p) => (
            <div key={p.id} className="flex justify-between text-footnote text-neutral-600">
              <span>{p.remarks}</span>
              <span>
                {p.percent_complete}% &middot; {new Date(p.update_date).toLocaleDateString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Payments (reconciliation)</p>
        <form onSubmit={addPayment} className="mt-2 flex flex-wrap items-end gap-2">
          <div className="w-28">
            <Field label="Amount" type="number" required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          </div>
          <SelectField label="Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
          </SelectField>
          <div className="w-32">
            <Field label="Reference" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
          </div>
          <SmallButton type="submit">Record payment</SmallButton>
        </form>
        <div className="mt-2 space-y-1">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between text-footnote text-neutral-600">
              <span>
                {p.mode} {p.reference_number && `· ${p.reference_number}`}
              </span>
              <span>₹{Number(p.amount).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
