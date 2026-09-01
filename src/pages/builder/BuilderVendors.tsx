import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useMyBuilder } from '../../hooks/useMyBuilder'
import { Field, SmallButton } from '../../components/ui/Field'

type Vendor = {
  id: string
  name: string
  trade: string | null
  contact_name: string | null
  contact_phone: string | null
  gstin: string | null
  application_status: string
}

export function BuilderVendors() {
  const { builder, loading: builderLoading } = useMyBuilder()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [name, setName] = useState('')
  const [trade, setTrade] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [gstin, setGstin] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!builder || !supabase) return
    const { data } = await supabase
      .from('vendors')
      .select('id, name, trade, contact_name, contact_phone, gstin, application_status')
      .eq('builder_id', builder.id)
      .order('created_at', { ascending: false })
    setVendors((data as Vendor[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!builder || !supabase) return
    setSaving(true)
    await supabase.from('vendors').insert({
      builder_id: builder.id,
      name,
      trade: trade || null,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      gstin: gstin || null,
      application_status: 'approved',
    })
    setSaving(false)
    setName('')
    setTrade('')
    setContactName('')
    setContactPhone('')
    setGstin('')
    load()
  }

  async function setStatus(id: string, application_status: string) {
    if (!supabase) return
    await supabase.from('vendors').update({ application_status }).eq('id', id)
    load()
  }

  if (builderLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">Vendors</h1>
      <p className="mt-1 text-callout text-neutral-600">
        Your supplier directory — issue purchase orders against these vendors from any project.
      </p>

      <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-5 sm:grid-cols-3">
        <Field label="Vendor name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ambuja Cements Dealer" />
        <Field label="Trade" value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="Cement supply" />
        <Field label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="27ABCDE1234F1Z5" />
        <Field label="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact person" />
        <Field label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91…" />
        <div className="flex items-end">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Adding…' : 'Add vendor'}
          </SmallButton>
        </div>
      </form>

      <div className="mt-6 space-y-2">
        {vendors.map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-callout font-semibold text-neutral-900">{v.name}</p>
              <p className="text-footnote text-neutral-400">
                {v.trade} {v.contact_phone && `· ${v.contact_phone}`} {v.gstin && `· ${v.gstin}`}
              </p>
            </div>
            <select
              value={v.application_status}
              onChange={(e) => setStatus(v.id, e.target.value)}
              className="rounded-md border border-neutral-200 bg-neutral-0 px-2.5 py-1.5 text-caption text-neutral-900 outline-none focus:border-accent-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        ))}
        {vendors.length === 0 && <p className="text-callout text-neutral-400">No vendors yet.</p>}
      </div>
    </div>
  )
}
