import { useEffect, useState, type FormEvent } from 'react'
import { Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBuilder } from '../../hooks/useMyBuilder'
import { Field, SmallButton } from '../../components/ui/Field'

type Staff = { id: string; full_name: string; phone: string | null; is_active: boolean }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function BuilderStaff() {
  const { builder, loading: builderLoading } = useMyBuilder()
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableToday, setAvailableToday] = useState<Set<string>>(new Set())
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [newInvite, setNewInvite] = useState<{ name: string; code: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    if (!builder || !supabase) return
    const { data } = await supabase
      .from('staff_members')
      .select('id, full_name, phone, is_active')
      .eq('builder_id', builder.id)
      .order('created_at', { ascending: false })
    setStaff((data as Staff[]) ?? [])

    const staffIds = (data ?? []).map((s) => s.id)
    if (staffIds.length) {
      const { data: avail } = await supabase
        .from('staff_daily_availability')
        .select('staff_member_id')
        .eq('available_date', todayISO())
        .in('staff_member_id', staffIds)
      setAvailableToday(new Set((avail ?? []).map((a) => a.staff_member_id)))
    } else {
      setAvailableToday(new Set())
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!builder || !supabase) return
    setSaving(true)
    const { data } = await supabase
      .from('staff_members')
      .insert({ builder_id: builder.id, full_name: fullName, phone: phone || null })
      .select('full_name, invite_code')
      .single()
    setSaving(false)
    if (data) setNewInvite({ name: data.full_name, code: data.invite_code })
    setFullName('')
    setPhone('')
    load()
  }

  async function toggleActive(id: string, is_active: boolean) {
    if (!supabase) return
    await supabase.from('staff_members').update({ is_active }).eq('id', id)
    load()
  }

  async function toggleAvailableToday(id: string, available: boolean) {
    if (!supabase) return
    if (available) {
      await supabase.from('staff_daily_availability').insert({ staff_member_id: id, available_date: todayISO() })
    } else {
      await supabase.from('staff_daily_availability').delete().eq('staff_member_id', id).eq('available_date', todayISO())
    }
    load()
  }

  function copyLink(code: string) {
    const link = `${window.location.origin}/signup/staff?code=${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (builderLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">Staff</h1>
      <p className="mt-1 text-callout text-neutral-600">
        Your site-visit staff roster — mark who&rsquo;s available today and new visit bookings auto-assign evenly among them.
      </p>

      {newInvite && (
        <div className="mt-6 rounded-xl border border-accent-500/30 bg-accent-100 p-4">
          <p className="text-callout font-semibold text-accent-600">
            {newInvite.name} added — share this invite code so they can create their account
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded-md bg-neutral-0 px-3 py-1.5 text-callout font-semibold text-neutral-900">{newInvite.code}</code>
            <button
              onClick={() => copyLink(newInvite.code)}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-caption font-medium text-neutral-600 hover:border-neutral-400"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy signup link'}
            </button>
            <button onClick={() => setNewInvite(null)} className="text-caption text-neutral-400 hover:text-neutral-600">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-5 sm:grid-cols-3">
        <Field label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Nair" />
        <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
        <div className="flex items-end">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Adding…' : 'Add staff member'}
          </SmallButton>
        </div>
      </form>

      <h2 className="mt-8 text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
        Roster &amp; today&rsquo;s availability
      </h2>
      <div className="mt-3 space-y-2">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-callout font-semibold text-neutral-900">{s.full_name}</p>
              <p className="text-footnote text-neutral-400">{s.phone ?? 'No phone on file'}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-callout text-neutral-600">
                <input
                  type="checkbox"
                  checked={availableToday.has(s.id)}
                  onChange={(e) => toggleAvailableToday(s.id, e.target.checked)}
                  disabled={!s.is_active}
                />
                Available today
              </label>
              <select
                value={s.is_active ? 'active' : 'inactive'}
                onChange={(e) => toggleActive(s.id, e.target.value === 'active')}
                className="rounded-md border border-neutral-200 bg-neutral-0 px-2.5 py-1.5 text-caption text-neutral-900 outline-none focus:border-accent-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        ))}
        {staff.length === 0 && <p className="text-callout text-neutral-400">No staff added yet.</p>}
      </div>
    </div>
  )
}
