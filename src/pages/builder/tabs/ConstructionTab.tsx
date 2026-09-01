import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'

type Milestone = { id: string; title: string; percent_complete: number | null; status: string; milestone_date: string }
type Drawing = { id: string; title: string; drawing_type: string; file_url: string }
type QualityCheck = { id: string; checklist_item: string; result: string }
type MaterialLog = { id: string; material_name: string; quantity: number; unit: string }

export function ConstructionTab({ projectId }: { projectId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [checks, setChecks] = useState<QualityCheck[]>([])
  const [materials, setMaterials] = useState<MaterialLog[]>([])

  async function load() {
    if (!supabase) return
    supabase
      .from('construction_milestones')
      .select('id, title, percent_complete, status, milestone_date')
      .eq('project_id', projectId)
      .order('milestone_date', { ascending: false })
      .then(({ data }) => setMilestones((data as Milestone[]) ?? []))
    supabase
      .from('drawings')
      .select('id, title, drawing_type, file_url')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => setDrawings((data as Drawing[]) ?? []))
    supabase
      .from('quality_checks')
      .select('id, checklist_item, result')
      .eq('project_id', projectId)
      .order('checked_at', { ascending: false })
      .then(({ data }) => setChecks((data as QualityCheck[]) ?? []))
    supabase
      .from('material_consumption')
      .select('id, material_name, quantity, unit')
      .eq('project_id', projectId)
      .order('log_date', { ascending: false })
      .then(({ data }) => setMaterials((data as MaterialLog[]) ?? []))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <MilestoneBlock projectId={projectId} items={milestones} onSaved={load} />
      <DrawingBlock projectId={projectId} items={drawings} onSaved={load} />
      <QualityBlock projectId={projectId} items={checks} onSaved={load} />
      <MaterialBlock projectId={projectId} items={materials} onSaved={load} />
    </div>
  )
}

function MilestoneBlock({ projectId, items, onSaved }: { projectId: string; items: Milestone[]; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [percent, setPercent] = useState('')
  const [status, setStatus] = useState('on_schedule')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('construction_milestones').insert({
      project_id: projectId,
      title,
      percent_complete: percent ? Number(percent) : null,
      status,
      milestone_date: date,
    })
    setSaving(false)
    setTitle('')
    setPercent('')
    onSaved()
  }

  return (
    <div>
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Milestones</h2>
      <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4">
        <Field label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="14th floor slab" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="% complete" type="number" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="68" />
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="on_schedule">On schedule</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
          </SelectField>
          <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <SmallButton disabled={saving} type="submit">
          {saving ? 'Adding…' : 'Add milestone'}
        </SmallButton>
      </form>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {items.map((m) => (
          <div key={m.id} className="rounded-lg border border-neutral-200 px-3.5 py-2 text-callout text-neutral-900">
            {m.title} &middot; {m.percent_complete}% &middot; {m.status}
          </div>
        ))}
      </div>
    </div>
  )
}

function DrawingBlock({ projectId, items, onSaved }: { projectId: string; items: Drawing[]; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('floor_plan')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('drawings').insert({ project_id: projectId, title, drawing_type: type, file_url: url })
    setSaving(false)
    setTitle('')
    setUrl('')
    onSaved()
  }

  return (
    <div>
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Drawings</h2>
      <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4">
        <Field label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Floor plan — Tower B, 14F" />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="floor_plan">Floor plan</option>
            <option value="structural">Structural</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="sanctioned_building_plan">Sanctioned building plan</option>
            <option value="other">Other</option>
          </SelectField>
          <Field label="File URL" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
        <SmallButton disabled={saving} type="submit">
          {saving ? 'Adding…' : 'Add drawing'}
        </SmallButton>
      </form>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {items.map((d) => (
          <div key={d.id} className="rounded-lg border border-neutral-200 px-3.5 py-2 text-callout text-neutral-900">
            {d.title} &middot; {d.drawing_type.replace(/_/g, ' ')}
          </div>
        ))}
      </div>
    </div>
  )
}

function QualityBlock({ projectId, items, onSaved }: { projectId: string; items: QualityCheck[]; onSaved: () => void }) {
  const [item, setItem] = useState('')
  const [result, setResult] = useState('pending')
  const [inspector, setInspector] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('quality_checks').insert({
      project_id: projectId,
      checklist_item: item,
      result,
      inspector_name: inspector || null,
    })
    setSaving(false)
    setItem('')
    setInspector('')
    onSaved()
  }

  return (
    <div>
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Quality checks</h2>
      <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4">
        <Field label="Checklist item" required value={item} onChange={(e) => setItem(e.target.value)} placeholder="Concrete cube test — M25" />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Result" value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </SelectField>
          <Field label="Inspector" value={inspector} onChange={(e) => setInspector(e.target.value)} placeholder="Name" />
        </div>
        <SmallButton disabled={saving} type="submit">
          {saving ? 'Adding…' : 'Add check'}
        </SmallButton>
      </form>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutral-200 px-3.5 py-2 text-callout text-neutral-900">
            {c.checklist_item} &middot; {c.result}
          </div>
        ))}
      </div>
    </div>
  )
}

function MaterialBlock({ projectId, items, onSaved }: { projectId: string; items: MaterialLog[]; onSaved: () => void }) {
  const [material, setMaterial] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('material_consumption').insert({
      project_id: projectId,
      material_name: material,
      quantity: Number(quantity),
      unit,
    })
    setSaving(false)
    setMaterial('')
    setQuantity('')
    setUnit('')
    onSaved()
  }

  return (
    <div>
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Material consumption</h2>
      <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4">
        <Field label="Material" required value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Cement (OPC 53)" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="120" />
          <Field label="Unit" required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="bags" />
        </div>
        <SmallButton disabled={saving} type="submit">
          {saving ? 'Adding…' : 'Log usage'}
        </SmallButton>
      </form>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {items.map((m) => (
          <div key={m.id} className="rounded-lg border border-neutral-200 px-3.5 py-2 text-callout text-neutral-900">
            {m.material_name} &middot; {m.quantity} {m.unit}
          </div>
        ))}
      </div>
    </div>
  )
}
