import { useState, type FormEvent } from 'react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'
import type { ProjectRow } from '../BuilderProjectDetail'

export function SetupTab({ project, onSaved }: { project: ProjectRow; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: project.name,
    city: project.city ?? '',
    address: project.address ?? '',
    map_embed_url: project.map_embed_url ?? '',
    rera_registration_number: project.rera_registration_number ?? '',
    rera_registered_name: project.rera_registered_name ?? '',
    rera_status: project.rera_status,
    rera_certificate_url: project.rera_certificate_url ?? '',
    rera_valid_till: project.rera_valid_till ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase
      .from('projects')
      .update({ ...form, rera_valid_till: form.rera_valid_till || null })
      .eq('id', project.id)
    setSaving(false)
    setSaved(true)
    onSaved()
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Project details
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Project name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Field label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
          <div className="sm:col-span-2">
            <Field label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Location map embed URL"
              value={form.map_embed_url}
              onChange={(e) => set('map_embed_url', e.target.value)}
              placeholder="https://www.google.com/maps/embed?..."
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          RERA profile (visible to every buyer)
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="RERA registration number"
            value={form.rera_registration_number}
            onChange={(e) => set('rera_registration_number', e.target.value)}
            placeholder="P52100012345"
          />
          <Field
            label="Registered project name"
            value={form.rera_registered_name}
            onChange={(e) => set('rera_registered_name', e.target.value)}
          />
          <SelectField label="Status" value={form.rera_status} onChange={(e) => set('rera_status', e.target.value)}>
            <option value="not_registered">Not registered</option>
            <option value="active">Active</option>
            <option value="lapsed">Lapsed</option>
            <option value="expired">Expired</option>
          </SelectField>
          <Field
            label="Valid till"
            type="date"
            value={form.rera_valid_till}
            onChange={(e) => set('rera_valid_till', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Field
              label="Certificate URL"
              value={form.rera_certificate_url}
              onChange={(e) => set('rera_certificate_url', e.target.value)}
              placeholder="https://maharera.mahaonline.gov.in/..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SmallButton disabled={saving} type="submit">
          {saving ? 'Saving…' : 'Save changes'}
        </SmallButton>
        {saved && <span className="text-callout text-status-on-track">Saved</span>}
      </div>
    </form>
  )
}
