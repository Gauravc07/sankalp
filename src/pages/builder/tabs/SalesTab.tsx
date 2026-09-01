import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Copy, CheckCircle2, Clock, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { uploadVaultFile, getVaultFileUrl } from '../../../lib/vault'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'

type UnitOption = { id: string; unit_number: string; status: string; tower: { name: string } }
type Booking = {
  id: string
  booking_code: string
  customer_profile_id: string | null
  unit_id: string
  unit: { unit_number: string; status: string; tower: { name: string } }
}

function randomCode() {
  return `SLAB-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function SalesTab({ projectId }: { projectId: string }) {
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedUnit, setSelectedUnit] = useState('')
  const [code, setCode] = useState(randomCode())
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    if (!supabase) return
    const { data: towers } = await supabase.from('towers').select('id, name').eq('project_id', projectId)
    const towerIds = (towers ?? []).map((t) => t.id)
    const towerNameById = new Map((towers ?? []).map((t) => [t.id, t.name]))

    if (!towerIds.length) {
      setUnitOptions([])
      setBookings([])
      return
    }

    const { data: units } = await supabase
      .from('units')
      .select('id, unit_number, status, tower_id')
      .in('tower_id', towerIds)
      .order('unit_number')
    const opts = (units ?? []).map((u) => ({
      id: u.id,
      unit_number: u.unit_number,
      status: u.status,
      tower: { name: towerNameById.get(u.tower_id) ?? '' },
    }))
    setUnitOptions(opts)
    if (opts.length && !selectedUnit) setSelectedUnit(opts.find((u) => u.status === 'available')?.id ?? opts[0].id)

    const unitIds = opts.map((u) => u.id)
    if (unitIds.length) {
      const { data: b } = await supabase
        .from('bookings')
        .select('id, booking_code, customer_profile_id, unit_id')
        .in('unit_id', unitIds)
        .order('booked_at', { ascending: false })
      const unitById = new Map(opts.map((u) => [u.id, u]))
      setBookings(
        (b ?? []).map((row) => ({
          id: row.id,
          booking_code: row.booking_code,
          customer_profile_id: row.customer_profile_id,
          unit_id: row.unit_id,
          unit: {
            unit_number: unitById.get(row.unit_id)?.unit_number ?? '',
            status: unitById.get(row.unit_id)?.status ?? '',
            tower: unitById.get(row.unit_id)?.tower ?? { name: '' },
          },
        })),
      )
    } else {
      setBookings([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !selectedUnit) return
    setSaving(true)
    await supabase.from('bookings').insert({ unit_id: selectedUnit, booking_code: code })
    setSaving(false)
    setCode(randomCode())
    load()
  }

  function copyCode(c: string) {
    navigator.clipboard.writeText(c)
    setCopied(c)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
        Sale booking form
      </h2>
      <p className="mt-1 text-footnote text-neutral-400">
        Booking a unit generates a code the buyer uses once to link their account — it also marks the unit as booked in inventory.
      </p>
      <form onSubmit={handleCreate} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4">
        <label className="block">
          <span className="mb-1 block text-footnote font-medium text-neutral-600">Unit</span>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-52 rounded-lg border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
          >
            {unitOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.tower.name} · {u.unit_number} ({u.status})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-footnote font-medium text-neutral-600">Booking code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-40 rounded-lg border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
          />
        </label>
        <SmallButton disabled={saving || !selectedUnit} type="submit">
          {saving ? 'Creating…' : 'Create booking'}
        </SmallButton>
      </form>

      <h2 className="mt-8 text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Bookings</h2>
      <div className="mt-3 space-y-2">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border border-neutral-200">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-3 text-callout">
              <button
                onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                className="flex flex-1 items-center gap-2 text-left text-neutral-900"
              >
                {expanded === b.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {b.unit.tower.name} &middot; {b.unit.unit_number}
              </button>
              <button
                onClick={() => copyCode(b.booking_code)}
                className="flex items-center gap-1.5 font-mono text-footnote text-neutral-600 hover:text-neutral-900"
              >
                {b.booking_code}
                <Copy size={12} />
                {copied === b.booking_code && <span className="text-status-on-track">Copied</span>}
              </button>
              {b.customer_profile_id ? (
                <span className="flex items-center gap-1.5 text-footnote text-status-on-track">
                  <CheckCircle2 size={13} /> Claimed
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-footnote text-status-attention">
                  <Clock size={13} /> Unclaimed
                </span>
              )}
            </div>
            {expanded === b.id && <BookingSalesDetail bookingId={b.id} projectId={projectId} />}
          </div>
        ))}
        {bookings.length === 0 && <p className="text-callout text-neutral-400">No bookings yet.</p>}
      </div>
    </div>
  )
}

type Schedule = { id: string; sale_price: number | null }
type Slab = { id: string; label: string; base_amount: number; gst_percent: number; tds_percent: number; due_date: string | null; status: string }
type Txn = { id: string; amount: number; payment_date: string; mode: string; reference_number: string | null }
type Doc = { id: string; category: string; title: string; storage_path: string | null; status: string }

function BookingSalesDetail({ bookingId, projectId }: { bookingId: string; projectId: string }) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [salePrice, setSalePrice] = useState('')
  const [slabs, setSlabs] = useState<Slab[]>([])
  const [txnsBySlab, setTxnsBySlab] = useState<Record<string, Txn[]>>({})
  const [docs, setDocs] = useState<Doc[]>([])
  const [expandedSlab, setExpandedSlab] = useState<string | null>(null)

  const [slabLabel, setSlabLabel] = useState('')
  const [slabAmount, setSlabAmount] = useState('')
  const [slabGst, setSlabGst] = useState('5')
  const [slabTds, setSlabTds] = useState('0')
  const [slabDue, setSlabDue] = useState('')

  const [txnAmount, setTxnAmount] = useState('')
  const [txnMode, setTxnMode] = useState('bank_transfer')
  const [txnRef, setTxnRef] = useState('')

  const [docCategory, setDocCategory] = useState('allotment_letter')
  const [docTitle, setDocTitle] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docStatus, setDocStatus] = useState('generated')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [opening, setOpening] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)

  async function load() {
    if (!supabase) return
    const { data: sched } = await supabase.from('payment_schedules').select('id, sale_price').eq('booking_id', bookingId).maybeSingle()
    setSchedule(sched as Schedule | null)
    if (sched) {
      setSalePrice(sched.sale_price != null ? String(sched.sale_price) : '')
      const { data: slabRows } = await supabase
        .from('payment_slabs')
        .select('id, label, base_amount, gst_percent, tds_percent, due_date, status')
        .eq('payment_schedule_id', sched.id)
        .order('sort_order')
      setSlabs((slabRows as Slab[]) ?? [])

      const slabIds = (slabRows ?? []).map((s) => s.id)
      if (slabIds.length) {
        const { data: txns } = await supabase
          .from('payment_transactions')
          .select('id, payment_slab_id, amount, payment_date, mode, reference_number')
          .in('payment_slab_id', slabIds)
        const grouped: Record<string, Txn[]> = {}
        for (const t of txns ?? []) {
          grouped[t.payment_slab_id] ??= []
          grouped[t.payment_slab_id].push(t)
        }
        setTxnsBySlab(grouped)
      }
    }

    const { data: docRows } = await supabase.from('documents').select('id, category, title, storage_path, status').eq('booking_id', bookingId)
    setDocs((docRows as Doc[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  async function createSchedule(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('payment_schedules').insert({ booking_id: bookingId, sale_price: salePrice ? Number(salePrice) : null })
    load()
  }

  async function updateSalePrice(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !schedule) return
    await supabase.from('payment_schedules').update({ sale_price: salePrice ? Number(salePrice) : null }).eq('id', schedule.id)
    load()
  }

  async function addSlab(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !schedule) return
    await supabase.from('payment_slabs').insert({
      payment_schedule_id: schedule.id,
      label: slabLabel,
      base_amount: Number(slabAmount),
      gst_percent: Number(slabGst),
      tds_percent: Number(slabTds),
      due_date: slabDue || null,
      sort_order: slabs.length,
    })
    setSlabLabel('')
    setSlabAmount('')
    setSlabDue('')
    load()
  }

  async function markSlabStatus(id: string, status: string) {
    if (!supabase) return
    await supabase.from('payment_slabs').update({ status }).eq('id', id)
    load()
  }

  async function addTransaction(slabId: string, e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('payment_transactions').insert({
      payment_slab_id: slabId,
      amount: Number(txnAmount),
      mode: txnMode,
      reference_number: txnRef || null,
    })
    setTxnAmount('')
    setTxnRef('')
    load()
  }

  async function addDocument(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !docFile) return
    setUploading(true)
    setUploadError('')

    const { path, error: uploadErr } = await uploadVaultFile({ projectId, bookingId, file: docFile })
    if (uploadErr || !path) {
      setUploadError('Upload failed — the file was not stored in the vault. Please try again.')
      setUploading(false)
      return
    }

    const { error: insertErr } = await supabase.from('documents').insert({
      project_id: projectId,
      booking_id: bookingId,
      category: docCategory,
      title: docTitle,
      storage_path: path,
      status: docStatus,
    })
    setUploading(false)
    if (insertErr) {
      setUploadError('Could not save the document record. Please try again.')
      return
    }
    setDocTitle('')
    setDocFile(null)
    setFileInputKey((k) => k + 1)
    load()
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setDocFile(e.target.files?.[0] ?? null)
  }

  async function openDocument(d: Doc) {
    if (!d.storage_path || opening) return
    setOpening(d.id)
    const { url } = await getVaultFileUrl(d.storage_path)
    setOpening(null)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6 border-t border-neutral-200 bg-neutral-50 p-4">
      {!schedule ? (
        <form onSubmit={createSchedule} className="flex items-end gap-3">
          <Field label="Sale price (₹)" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="8500000" />
          <SmallButton type="submit">Generate payment schedule</SmallButton>
        </form>
      ) : (
        <>
          <form onSubmit={updateSalePrice} className="flex items-end gap-3">
            <Field label="Sale price (₹)" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            <SmallButton type="submit">Update</SmallButton>
          </form>

          <div>
            <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Payment slabs</p>
            <form onSubmit={addSlab} className="mt-2 flex flex-wrap items-end gap-2">
              <div className="w-40">
                <Field label="Label" required value={slabLabel} onChange={(e) => setSlabLabel(e.target.value)} placeholder="On booking" />
              </div>
              <div className="w-32">
                <Field label="Base amount" type="number" required value={slabAmount} onChange={(e) => setSlabAmount(e.target.value)} placeholder="850000" />
              </div>
              <div className="w-24">
                <Field label="GST %" type="number" value={slabGst} onChange={(e) => setSlabGst(e.target.value)} />
              </div>
              <div className="w-24">
                <Field label="TDS %" type="number" value={slabTds} onChange={(e) => setSlabTds(e.target.value)} />
              </div>
              <div className="w-36">
                <Field label="Due date" type="date" value={slabDue} onChange={(e) => setSlabDue(e.target.value)} />
              </div>
              <SmallButton type="submit">Add slab</SmallButton>
            </form>

            <div className="mt-3 space-y-2">
              {slabs.map((s) => {
                const gstAmt = (s.base_amount * s.gst_percent) / 100
                const tdsAmt = (s.base_amount * s.tds_percent) / 100
                const payable = s.base_amount + gstAmt - tdsAmt
                const paid = (txnsBySlab[s.id] ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
                return (
                  <div key={s.id} className="rounded-lg border border-neutral-200">
                    <div className="flex w-full items-center justify-between px-3 py-2.5 text-callout">
                      <button
                        onClick={() => setExpandedSlab(expandedSlab === s.id ? null : s.id)}
                        className="flex-1 text-left text-neutral-900"
                      >
                        {s.label}
                      </button>
                      <button
                        onClick={() => setExpandedSlab(expandedSlab === s.id ? null : s.id)}
                        className="text-footnote text-neutral-400"
                      >
                        ₹{payable.toLocaleString('en-IN')} &middot; paid ₹{paid.toLocaleString('en-IN')}
                      </button>
                      <select
                        value={s.status}
                        onChange={(e) => markSlabStatus(s.id, e.target.value)}
                        className="ml-3 rounded-md border border-neutral-200 bg-neutral-0 px-2 py-1 text-caption text-neutral-900 outline-none focus:border-accent-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    {expandedSlab === s.id && (
                      <div className="border-t border-neutral-200 p-3">
                        <p className="text-footnote text-neutral-400">
                          Base ₹{s.base_amount.toLocaleString('en-IN')} + GST {s.gst_percent}% (₹{gstAmt.toLocaleString('en-IN')}) − TDS{' '}
                          {s.tds_percent}% (₹{tdsAmt.toLocaleString('en-IN')})
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {(txnsBySlab[s.id] ?? []).map((t) => (
                            <div key={t.id} className="flex justify-between text-footnote text-neutral-600">
                              <span>
                                {t.mode} {t.reference_number && `· ${t.reference_number}`}
                              </span>
                              <span>
                                ₹{Number(t.amount).toLocaleString('en-IN')} &middot;{' '}
                                {new Date(t.payment_date).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={(e) => addTransaction(s.id, e)} className="mt-2 flex flex-wrap items-end gap-2">
                          <div className="w-28">
                            <Field label="Amount" type="number" required value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} />
                          </div>
                          <SelectField label="Mode" value={txnMode} onChange={(e) => setTxnMode(e.target.value)}>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                          </SelectField>
                          <div className="w-32">
                            <Field label="Reference" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} />
                          </div>
                          <SmallButton type="submit">Record payment</SmallButton>
                        </form>
                      </div>
                    )}
                  </div>
                )
              })}
              {slabs.length === 0 && <p className="text-footnote text-neutral-400">No slabs yet.</p>}
            </div>
          </div>
        </>
      )}

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Documents</p>
        <p className="mt-1 text-footnote text-neutral-400">
          Files upload straight into the customer's private vault — encrypted at rest, never a public link, only this
          customer and this project's builder can ever open them.
        </p>
        <form onSubmit={addDocument} className="mt-2 flex flex-wrap items-end gap-2">
          <SelectField label="Category" value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>
            <option value="allotment_letter">Allotment letter</option>
            <option value="agreement">Agreement</option>
            <option value="other">Other</option>
          </SelectField>
          <div className="w-48">
            <Field label="Title" required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Allotment Letter - Unit 1204" />
          </div>
          <div className="w-48">
            <Field key={fileInputKey} label="File" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
          </div>
          <SelectField label="Status" value={docStatus} onChange={(e) => setDocStatus(e.target.value)}>
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="sent_for_signature">Sent for signature</option>
            <option value="signed">Signed</option>
          </SelectField>
          <SmallButton type="submit" disabled={uploading || !docFile || !docTitle}>
            {uploading ? 'Uploading…' : 'Add document'}
          </SmallButton>
        </form>
        {uploadError && <p className="mt-1.5 text-footnote text-status-attention">{uploadError}</p>}
        <div className="mt-3 space-y-1.5">
          {docs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => openDocument(d)}
              disabled={!d.storage_path || opening === d.id}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-left text-footnote text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60"
            >
              <span>
                {d.title} <span className="text-neutral-400">({d.category.replace(/_/g, ' ')})</span>
              </span>
              <span className="flex items-center gap-2 text-neutral-400">
                {d.status}
                {opening === d.id && <Loader2 size={12} className="animate-spin" />}
              </span>
            </button>
          ))}
          {docs.length === 0 && <p className="text-footnote text-neutral-400">No documents yet.</p>}
        </div>
      </div>
    </div>
  )
}
