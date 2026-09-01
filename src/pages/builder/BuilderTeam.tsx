import { useEffect, useState, type FormEvent } from 'react'
import { Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBuilder } from '../../hooks/useMyBuilder'
import { Field, SmallButton } from '../../components/ui/Field'
import { TEAM_ROLES, type TeamRole } from '../../lib/auth'

type Member = { id: string; full_name: string; phone: string | null; role_type: TeamRole; is_active: boolean }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function BuilderTeam() {
  const { builder, loading: builderLoading } = useMyBuilder()
  const [members, setMembers] = useState<Member[]>([])
  const [availableToday, setAvailableToday] = useState<Set<string>>(new Set())
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [roleType, setRoleType] = useState<TeamRole>('site_staff')
  const [saving, setSaving] = useState(false)
  const [newInvite, setNewInvite] = useState<{ name: string; code: string; roleType: TeamRole } | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    if (!builder || !supabase) return
    const { data } = await supabase
      .from('staff_members')
      .select('id, full_name, phone, role_type, is_active')
      .eq('builder_id', builder.id)
      .order('created_at', { ascending: false })
    setMembers((data as Member[]) ?? [])

    const siteStaffIds = ((data as Member[]) ?? []).filter((m) => m.role_type === 'site_staff').map((m) => m.id)
    if (siteStaffIds.length) {
      const { data: avail } = await supabase
        .from('staff_daily_availability')
        .select('staff_member_id')
        .eq('available_date', todayISO())
        .in('staff_member_id', siteStaffIds)
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
      .insert({ builder_id: builder.id, full_name: fullName, phone: phone || null, role_type: roleType })
      .select('full_name, invite_code, role_type')
      .single()
    setSaving(false)
    if (data) setNewInvite({ name: data.full_name, code: data.invite_code, roleType: data.role_type })
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

  function copyLink(code: string, forRole: TeamRole) {
    const link = `${window.location.origin}/signup/team?code=${code}&role=${forRole}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function roleLabel(value: TeamRole) {
    return TEAM_ROLES.find((r) => r.value === value)?.label ?? value
  }

  if (builderLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  const membersByRole = TEAM_ROLES.map((r) => ({ role: r, members: members.filter((m) => m.role_type === r.value) })).filter(
    (g) => g.members.length > 0,
  )

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">Team</h1>
      <p className="mt-1 text-callout text-neutral-600">
        Your internal team roster — site visit staff, engineers, sales, support, compliance, and project managers.
      </p>

      {newInvite && (
        <div className="mt-6 rounded-xl border border-accent-500/30 bg-accent-100 p-4">
          <p className="text-callout font-semibold text-accent-600">
            {newInvite.name} added as {roleLabel(newInvite.roleType)} — share this invite link so they can create their account
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded-md bg-neutral-0 px-3 py-1.5 text-callout font-semibold text-neutral-900">{newInvite.code}</code>
            <button
              onClick={() => copyLink(newInvite.code, newInvite.roleType)}
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

      <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-5 sm:grid-cols-4">
        <Field label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Nair" />
        <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
        <label className="block">
          <span className="mb-1 block text-footnote font-medium text-neutral-600">Role</span>
          <select
            value={roleType}
            onChange={(e) => setRoleType(e.target.value as TeamRole)}
            className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
          >
            {TEAM_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <SmallButton disabled={saving} type="submit">
            {saving ? 'Adding…' : 'Add team member'}
          </SmallButton>
        </div>
      </form>

      {membersByRole.map(({ role, members: group }) => (
        <div key={role.value} className="mt-8">
          <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
            {role.label} {role.value === 'site_staff' && <span className="normal-case text-neutral-400">&middot; today&rsquo;s availability</span>}
          </h2>
          <div className="mt-3 space-y-2">
            {group.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
                <div>
                  <p className="text-callout font-semibold text-neutral-900">{m.full_name}</p>
                  <p className="text-footnote text-neutral-400">{m.phone ?? 'No phone on file'}</p>
                </div>
                <div className="flex items-center gap-4">
                  {m.role_type === 'site_staff' && (
                    <label className="flex items-center gap-2 text-callout text-neutral-600">
                      <input
                        type="checkbox"
                        checked={availableToday.has(m.id)}
                        onChange={(e) => toggleAvailableToday(m.id, e.target.checked)}
                        disabled={!m.is_active}
                      />
                      Available today
                    </label>
                  )}
                  <select
                    value={m.is_active ? 'active' : 'inactive'}
                    onChange={(e) => toggleActive(m.id, e.target.value === 'active')}
                    className="rounded-md border border-neutral-200 bg-neutral-0 px-2.5 py-1.5 text-caption text-neutral-900 outline-none focus:border-accent-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {members.length === 0 && <p className="mt-8 text-callout text-neutral-400">No team members added yet.</p>}
    </div>
  )
}
