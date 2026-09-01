import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'
import { StatusChip, statusTone } from '../../../components/ui/StatusChip'

type UnitOption = { id: string; unit_number: string; tower: { name: string } }
type Lead = {
  id: string
  req_number: number
  name: string
  phone: string | null
  email: string | null
  property_type: string | null
  min_budget: number | null
  max_budget: number | null
  status: string
  next_follow_up_at: string | null
}

const STATUSES = ['new', 'qualified', 'non_prospect', 'lost', 'closed']

export function LeadsTab({ projectId }: { projectId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('leads')
      .select('id, req_number, name, phone, email, property_type, min_budget, max_budget, status, next_follow_up_at')
      .eq('project_id', projectId)
      .order('req_number', { ascending: false })
    setLeads((data as Lead[]) ?? [])

    const { data: towers } = await supabase.from('towers').select('id, name').eq('project_id', projectId)
    const towerIds = (towers ?? []).map((t) => t.id)
    const towerNameById = new Map((towers ?? []).map((t) => [t.id, t.name]))
    if (towerIds.length) {
      const { data: u } = await supabase.from('units').select('id, unit_number, tower_id').in('tower_id', towerIds).order('unit_number')
      setUnits((u ?? []).map((row) => ({ id: row.id, unit_number: row.unit_number, tower: { name: towerNameById.get(row.tower_id) ?? '' } })))
    } else {
      setUnits([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('leads').insert({
      project_id: projectId,
      name,
      phone: phone || null,
      email: email || null,
      property_type: propertyType || null,
      min_budget: minBudget ? Number(minBudget) : null,
      max_budget: maxBudget ? Number(maxBudget) : null,
      next_follow_up_at: followUp || null,
    })
    setSaving(false)
    setName('')
    setPhone('')
    setEmail('')
    setPropertyType('')
    setMinBudget('')
    setMaxBudget('')
    setFollowUp('')
    load()
  }

  async function setStatus(id: string, status: string) {
    if (!supabase) return
    await supabase.from('leads').update({ status }).eq('id', id)
    load()
  }

  async function convertToDeal(lead: Lead, unitId: string) {
    if (!supabase || !unitId) return
    await supabase.from('deals').insert({ lead_id: lead.id, project_id: projectId, unit_id: unitId })
    await supabase.from('leads').update({ status: 'closed' }).eq('id', lead.id)
    load()
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">New lead</h2>
      <form onSubmit={handleCreate} className="mt-3 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-3">
        <Field label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Sachin Sachdev" />
        <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="buyer@example.com" />
        <Field label="Property type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} placeholder="Apartment, Villa" />
        <Field label="Min budget (₹)" type="number" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
        <Field label="Max budget (₹)" type="number" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
        <Field label="Next follow-up" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        <div className="flex items-end">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Adding…' : 'Add lead'}
          </SmallButton>
        </div>
      </form>

      <h2 className="mt-8 text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Leads</h2>
      <div className="mt-3 space-y-2">
        {leads.map((l) => (
          <div key={l.id} className="rounded-lg border border-neutral-200">
            <button onClick={() => setExpanded(expanded === l.id ? null : l.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-callout">
              <span className="flex flex-1 items-center gap-2">
                {expanded === l.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-neutral-400">#{l.req_number}</span>
                <span className="font-semibold text-neutral-900">{l.name}</span>
                {l.phone && <span className="text-footnote text-neutral-400">{l.phone}</span>}
              </span>
              <StatusChip tone={statusTone(l.status)} label={l.status.replace('_', ' ')} />
            </button>
            {expanded === l.id && (
              <div className="space-y-3 border-t border-neutral-200 bg-neutral-50 p-4">
                <p className="text-footnote text-neutral-600">
                  {l.property_type && <>Interested in: {l.property_type} · </>}
                  {(l.min_budget || l.max_budget) && (
                    <>
                      Budget: ₹{l.min_budget?.toLocaleString('en-IN') ?? '—'} - ₹{l.max_budget?.toLocaleString('en-IN') ?? '—'} ·{' '}
                    </>
                  )}
                  {l.next_follow_up_at && <>Follow up: {l.next_follow_up_at}</>}
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <SelectField label="Status" value={l.status} onChange={(e) => setStatus(l.id, e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </SelectField>
                  {l.status === 'qualified' && <ConvertToDeal units={units} onConvert={(unitId) => convertToDeal(l, unitId)} />}
                </div>
              </div>
            )}
          </div>
        ))}
        {leads.length === 0 && <p className="text-callout text-neutral-400">No leads yet.</p>}
      </div>
    </div>
  )
}

function ConvertToDeal({ units, onConvert }: { units: UnitOption[]; onConvert: (unitId: string) => void }) {
  const [unitId, setUnitId] = useState('')

  return (
    <div className="flex items-end gap-2">
      <label className="block">
        <span className="mb-1 block text-footnote font-medium text-neutral-600">Unit for deal</span>
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="w-48 rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
        >
          <option value="">Select unit…</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.tower.name} · {u.unit_number}
            </option>
          ))}
        </select>
      </label>
      <SmallButton disabled={!unitId} onClick={() => onConvert(unitId)}>
        Convert to deal
      </SmallButton>
    </div>
  )
}
