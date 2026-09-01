import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Field, SmallButton } from '../../../components/ui/Field'

type Contact = { id: string; role_label: string; name: string; phone: string | null; email: string | null }

export function ContactsTab({ projectId }: { projectId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [roleLabel, setRoleLabel] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('contacts')
      .select('id, role_label, name, phone, email')
      .eq('project_id', projectId)
      .order('created_at')
    setContacts((data as Contact[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    await supabase.from('contacts').insert({ project_id: projectId, role_label: roleLabel, name, phone: phone || null, email: email || null })
    setSaving(false)
    setRoleLabel('')
    setName('')
    setPhone('')
    setEmail('')
    load()
  }

  async function remove(id: string) {
    if (!supabase) return
    await supabase.from('contacts').delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
        Project contacts
      </h2>
      <p className="mt-1 text-footnote text-neutral-400">
        Shown to every buyer in this project, under Support &rarr; Contact directory.
      </p>
      <form onSubmit={handleCreate} className="glass-card mt-3 grid gap-3 rounded-lg border border-neutral-200 bg-neutral-0 p-4 sm:grid-cols-2">
        <Field label="Role" required value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} placeholder="Relationship Manager" />
        <Field label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Nair" />
        <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        <Field label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@skylineheights.com" />
        <div className="sm:col-span-2">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Adding…' : 'Add contact'}
          </SmallButton>
        </div>
      </form>

      <div className="mt-4 space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-callout font-semibold text-neutral-900">
                {c.name} <span className="font-normal text-neutral-400">&middot; {c.role_label}</span>
              </p>
              <p className="text-footnote text-neutral-600">
                {c.phone} {c.phone && c.email && '· '} {c.email}
              </p>
            </div>
            <button onClick={() => remove(c.id)} className="text-neutral-400 hover:text-status-overdue">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {contacts.length === 0 && <p className="text-callout text-neutral-400">No contacts added yet.</p>}
      </div>
    </div>
  )
}
