import { useEffect, useState } from 'react'
import { FileText, Package, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'
import { Card } from '../../components/ui/Card'
import { StatusChip, statusTone } from '../../components/ui/StatusChip'
import { ProgressBar } from '../../components/ui/ProgressBar'

type Drawing = {
  id: string
  title: string
  drawing_type: string
  file_url: string
  version: number
  uploaded_at: string
}
type QualityCheck = {
  id: string
  checklist_item: string
  result: string
  inspector_name: string | null
  remarks: string | null
  checked_at: string
}
type MaterialLog = {
  id: string
  material_name: string
  quantity: number
  unit: string
  log_date: string
}
type Milestone = {
  id: string
  title: string
  description: string | null
  percent_complete: number | null
  status: string
  milestone_date: string
}

export function CustomerConstruction() {
  const { booking, loading } = useMyBooking()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [checks, setChecks] = useState<QualityCheck[]>([])
  const [materials, setMaterials] = useState<MaterialLog[]>([])

  useEffect(() => {
    if (!booking || !supabase) return
    const projectId = booking.unit.tower.project.id

    supabase
      .from('construction_milestones')
      .select('id, title, description, percent_complete, status, milestone_date')
      .eq('project_id', projectId)
      .order('milestone_date', { ascending: false })
      .then(({ data }) => setMilestones((data as Milestone[]) ?? []))

    supabase
      .from('drawings')
      .select('id, title, drawing_type, file_url, version, uploaded_at')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => setDrawings((data as Drawing[]) ?? []))

    supabase
      .from('quality_checks')
      .select('id, checklist_item, result, inspector_name, remarks, checked_at')
      .eq('project_id', projectId)
      .order('checked_at', { ascending: false })
      .then(({ data }) => setChecks((data as QualityCheck[]) ?? []))

    supabase
      .from('material_consumption')
      .select('id, material_name, quantity, unit, log_date')
      .eq('project_id', projectId)
      .order('log_date', { ascending: false })
      .then(({ data }) => setMaterials((data as MaterialLog[]) ?? []))
  }, [booking])

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!booking) return <NoBookingState />

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Construction progress</h1>
        <p className="mt-1 text-callout text-neutral-600">
          Milestone-by-milestone updates, timestamped and approved before they reach you.
        </p>
      </div>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Progress timeline
        </h2>
        <div className="mt-4 space-y-3">
          {milestones.length === 0 && <p className="text-callout text-neutral-400">No updates logged yet.</p>}
          {milestones.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-callout font-semibold text-neutral-900">{m.title}</p>
                <span className="text-footnote text-neutral-400">
                  {new Date(m.milestone_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {m.description && <p className="mt-1 text-callout text-neutral-600">{m.description}</p>}
              <div className="mt-3">
                <ProgressBar percent={m.percent_complete ?? 0} tone={statusTone(m.status)} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Central database for drawings
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          {drawings.length === 0 && (
            <p className="p-4 text-callout text-neutral-400">No drawings uploaded yet.</p>
          )}
          {drawings.map((d, i) => (
            <a
              key={d.id}
              href={d.file_url}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center justify-between gap-3 px-4 py-3 text-callout transition hover:bg-neutral-50 ${
                i > 0 ? 'border-t border-neutral-200' : ''
              }`}
            >
              <span className="flex items-center gap-3 text-neutral-900">
                <FileText size={15} className="text-status-info" />
                {d.title}
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">
                  {d.drawing_type.replace(/_/g, ' ')}
                </span>
                <span className="text-caption text-neutral-400">v{d.version}</span>
              </span>
              <ExternalLink size={14} className="shrink-0 text-neutral-400" />
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Quality checks
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          {checks.length === 0 && <p className="p-4 text-callout text-neutral-400">No quality checks logged yet.</p>}
          {checks.map((c, i) => (
            <div key={c.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-neutral-200' : ''}`}>
              <div className="flex items-center gap-2.5">
                <StatusChip tone={statusTone(c.result)} label={c.result} />
                <p className="text-callout text-neutral-900">{c.checklist_item}</p>
                <span className="ml-auto text-footnote text-neutral-400">
                  {new Date(c.checked_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {(c.inspector_name || c.remarks) && (
                <p className="mt-1.5 text-footnote text-neutral-600">
                  {c.inspector_name && <>Inspector: {c.inspector_name}</>}
                  {c.inspector_name && c.remarks && ' · '}
                  {c.remarks}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Raw material consumption
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          {materials.length === 0 && (
            <p className="p-4 text-callout text-neutral-400">No material usage logged yet.</p>
          )}
          {materials.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-4 py-3 text-callout ${i > 0 ? 'border-t border-neutral-200' : ''}`}
            >
              <span className="flex items-center gap-2.5 text-neutral-900">
                <Package size={15} className="text-accent-600" />
                {m.material_name}
              </span>
              <span className="text-neutral-600 tabular-nums">
                {m.quantity} {m.unit}
              </span>
              <span className="text-footnote text-neutral-400">
                {new Date(m.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
