import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'

type Vendor = { id: string; name: string }
type PO = { id: string; po_number: string; vendor_id: string; description: string | null; amount: number; status: string; issued_date: string }
type Challan = { id: string; challan_number: string; quantity_received: string | null; received_date: string }
type Invoice = { id: string; invoice_number: string; invoice_url: string | null; amount: number }
type Payment = { id: string; amount: number; mode: string; payment_date: string; reference_number: string | null }

export function VendorPOsTab({ builderId, projectId }: { builderId: string; projectId: string }) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [pos, setPos] = useState<PO[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const [vendorId, setVendorId] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!supabase) return
    const { data: v } = await supabase.from('vendors').select('id, name').eq('builder_id', builderId).order('name')
    setVendors((v as Vendor[]) ?? [])
    if (v && v.length && !vendorId) setVendorId((v[0] as Vendor).id)

    const { data: p } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_id, description, amount, status, issued_date')
      .eq('project_id', projectId)
      .order('issued_date', { ascending: false })
    setPos((p as PO[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderId, projectId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !vendorId) return
    setSaving(true)
    await supabase.from('purchase_orders').insert({
      project_id: projectId,
      vendor_id: vendorId,
      po_number: poNumber,
      description: description || null,
      amount: Number(amount),
    })
    setSaving(false)
    setPoNumber('')
    setDescription('')
    setAmount('')
    load()
  }

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? '—'

  if (vendors.length === 0) {
    return (
      <p className="text-callout text-neutral-400">
        No vendors in your directory yet — add one from the <span className="text-neutral-600">Vendors</span> page first.
      </p>
    )
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Issue a purchase order</h2>
      <form onSubmit={handleCreate} className="mt-3 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-2">
        <SelectField label="Vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </SelectField>
        <Field label="PO number" required value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-2026-014" />
        <div className="sm:col-span-2">
          <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="500 bags OPC 53 cement" />
        </div>
        <Field label="Amount (₹)" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="225000" />
        <div className="flex items-end">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Issuing…' : 'Issue PO'}
          </SmallButton>
        </div>
      </form>

      <h2 className="mt-8 text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Purchase orders</h2>
      <div className="mt-3 space-y-2">
        {pos.map((po) => (
          <div key={po.id} className="rounded-lg border border-neutral-200">
            <button
              onClick={() => setExpanded(expanded === po.id ? null : po.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-callout"
            >
              <span className="flex items-center gap-2 text-neutral-900">
                {expanded === po.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {po.po_number} &middot; {vendorName(po.vendor_id)}
              </span>
              <span className="text-footnote text-neutral-400">₹{Number(po.amount).toLocaleString('en-IN')}</span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-600">{po.status}</span>
            </button>
            {expanded === po.id && <PODetail po={po} />}
          </div>
        ))}
        {pos.length === 0 && <p className="text-callout text-neutral-400">No purchase orders yet.</p>}
      </div>
    </div>
  )
}

function PODetail({ po }: { po: PO }) {
  const [challans, setChallans] = useState<Challan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [challanNumber, setChallanNumber] = useState('')
  const [qty, setQty] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('bank_transfer')
  const [paymentRef, setPaymentRef] = useState('')

  async function load() {
    if (!supabase) return
    const [{ data: c }, { data: i }, { data: p }] = await Promise.all([
      supabase.from('delivery_challans').select('id, challan_number, quantity_received, received_date').eq('purchase_order_id', po.id),
      supabase.from('vendor_invoices').select('id, invoice_number, invoice_url, amount').eq('purchase_order_id', po.id),
      supabase.from('vendor_payments').select('id, amount, mode, payment_date, reference_number').eq('purchase_order_id', po.id),
    ])
    setChallans((c as Challan[]) ?? [])
    setInvoices((i as Invoice[]) ?? [])
    setPayments((p as Payment[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [po.id])

  async function addChallan(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('delivery_challans').insert({ purchase_order_id: po.id, challan_number: challanNumber, quantity_received: qty || null })
    setChallanNumber('')
    setQty('')
    load()
  }

  async function addInvoice(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('vendor_invoices').insert({
      purchase_order_id: po.id,
      invoice_number: invoiceNumber,
      invoice_url: invoiceUrl || null,
      amount: Number(invoiceAmount),
    })
    setInvoiceNumber('')
    setInvoiceUrl('')
    setInvoiceAmount('')
    load()
  }

  async function addPayment(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('vendor_payments').insert({
      purchase_order_id: po.id,
      amount: Number(paymentAmount),
      mode: paymentMode,
      reference_number: paymentRef || null,
    })
    setPaymentAmount('')
    setPaymentRef('')
    load()
  }

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-5 border-t border-neutral-200 bg-neutral-50 p-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-neutral-200 bg-neutral-0 py-2">
          <p className="text-[11px] text-neutral-400">PO amount</p>
          <p className="text-callout font-semibold text-neutral-900">₹{Number(po.amount).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-0 py-2">
          <p className="text-[11px] text-neutral-400">Invoiced</p>
          <p className="text-callout font-semibold text-neutral-900">₹{totalInvoiced.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-0 py-2">
          <p className="text-[11px] text-neutral-400">Paid</p>
          <p className="text-callout font-semibold text-status-on-track">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Delivery challans</p>
        <form onSubmit={addChallan} className="mt-2 flex flex-wrap items-end gap-2">
          <div className="w-36">
            <Field label="Challan #" required value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} />
          </div>
          <div className="w-36">
            <Field label="Qty received" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="500 bags" />
          </div>
          <SmallButton type="submit">Add challan</SmallButton>
        </form>
        <div className="mt-2 space-y-1">
          {challans.map((c) => (
            <div key={c.id} className="flex justify-between text-footnote text-neutral-600">
              <span>{c.challan_number}</span>
              <span>{c.quantity_received}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Invoices</p>
        <form onSubmit={addInvoice} className="mt-2 flex flex-wrap items-end gap-2">
          <div className="w-32">
            <Field label="Invoice #" required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div className="w-40">
            <Field label="URL" value={invoiceUrl} onChange={(e) => setInvoiceUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="w-28">
            <Field label="Amount" type="number" required value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} />
          </div>
          <SmallButton type="submit">Upload invoice</SmallButton>
        </form>
        <div className="mt-2 space-y-1">
          {invoices.map((i) => (
            <div key={i.id} className="flex justify-between text-footnote text-neutral-600">
              <span>{i.invoice_number}</span>
              <span>₹{Number(i.amount).toLocaleString('en-IN')}</span>
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
