import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Field } from '../../components/ui/Field'

type Project = { id: string; name: string; city: string | null; rera_status: string }
type Builder = { id: string; name: string }

export function BuilderOverview() {
  const { profile } = useAuth()
  const [builder, setBuilder] = useState<Builder | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!profile || !supabase) return
    const { data: b } = await supabase.from('builders').select('id, name').eq('owner_profile_id', profile.id).single()
    setBuilder(b as Builder | null)
    if (b) {
      const { data: p } = await supabase
        .from('projects')
        .select('id, name, city, rera_status')
        .eq('builder_id', (b as Builder).id)
        .order('created_at', { ascending: false })
      setProjects((p as Project[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!builder || !supabase) return
    setSaving(true)
    await supabase.from('projects').insert({ builder_id: builder.id, name, city, address })
    setSaving(false)
    setName('')
    setCity('')
    setAddress('')
    setShowForm(false)
    load()
  }

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-title-1 font-bold text-neutral-900">{builder?.name}</h1>
          <p className="mt-1 text-callout text-neutral-600">Your projects on Sankalp</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-accent-500 px-4 py-2 text-callout font-semibold text-white transition hover:bg-accent-600"
        >
          <Plus size={15} />
          New project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-5 sm:grid-cols-3">
          <Field label="Project name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Skyline Heights" />
          <Field label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune" />
          <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Baner Road" />
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent-500 px-5 py-2 text-callout font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {projects.length === 0 && !showForm && (
          <p className="text-callout text-neutral-400">No projects yet — create your first one.</p>
        )}
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/builder/projects/${p.id}`}
            className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-0 p-5 transition hover:border-accent-500/30 hover:shadow-md"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tile-amber-bg text-tile-amber-fg">
                <Building2 size={18} />
              </span>
              <span>
                <span className="block text-callout font-semibold text-neutral-900">{p.name}</span>
                <span className="block text-footnote text-neutral-400">{p.city ?? 'City not set'}</span>
              </span>
            </span>
            <ArrowRight size={16} className="text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900" />
          </Link>
        ))}
      </div>
    </div>
  )
}
