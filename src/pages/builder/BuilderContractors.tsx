import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useMyBuilder } from '../../hooks/useMyBuilder'
import { Field, SmallButton } from '../../components/ui/Field'

type Contractor = {
  id: string
  name: string
  specialization: string | null
  contact_name: string | null
  contact_phone: string | null
  application_status: string
}

export function BuilderContractors() {
  const { builder, loading: builderLoading } = useMyBuilder()
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!builder || !supabase) return
    const { data } = await supabase
      .from('contractors')
      .select('id, name, specialization, contact_name, contact_phone, application_status')
      .eq('builder_id', builder.id)
      .order('created_at', { ascending: false })
    setContractors((data as Contractor[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!builder || !supabase) return
    setSaving(true)
    await supabase.from('contractors').insert({
      builder_id: builder.id,
      name,
      specialization: specialization || null,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      application_status: 'approved',
    })
    setSaving(false)
    setName('')
    setSpecialization('')
    setContactName('')
    setContactPhone('')
    load()
  }

  async function setStatus(id: string, application_status: string) {
    if (!supabase) return
    await supabase.from('contractors').update({ application_status }).eq('id', id)
    load()
  }

  if (builderLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">Contractors</h1>
      <p className="mt-1 text-callout text-neutral-600">
        Your contractor directory — issue work orders against these contractors from any project.
      </p>

      <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-5 sm:grid-cols-3">
        <Field label="Contractor name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Patil RCC Contractors" />
        <Field label="Specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="RCC & structural" />
        <Field label="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact person" />
        <Field label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91…" />
        <div className="flex items-end">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Adding…' : 'Add contractor'}
          </SmallButton>
        </div>
      </form>

      <div className="mt-6 space-y-2">
        {contractors.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-callout font-semibold text-neutral-900">{c.name}</p>
              <p className="text-footnote text-neutral-400">
                {c.specialization} {c.contact_phone && `· ${c.contact_phone}`}
              </p>
            </div>
            <select
              value={c.application_status}
              onChange={(e) => setStatus(c.id, e.target.value)}
              className="rounded-md border border-neutral-200 bg-neutral-0 px-2.5 py-1.5 text-caption text-neutral-900 outline-none focus:border-accent-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        ))}
        {contractors.length === 0 && <p className="text-callout text-neutral-400">No contractors yet.</p>}
      </div>
    </div>
  )
}
