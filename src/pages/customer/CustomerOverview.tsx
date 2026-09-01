import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HardHat, ShieldCheck, FileCheck2, ArrowRight, FileText, Car } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'
import { Card } from '../../components/ui/Card'
import { StatusChip, statusTone } from '../../components/ui/StatusChip'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Button } from '../../components/ui/Button'

type Milestone = {
  id: string
  title: string
  percent_complete: number | null
  status: string
  milestone_date: string
}
type FloorPlan = { id: string; title: string; file_url: string }

export function CustomerOverview() {
  const { booking, loading } = useMyBooking()
  const [latest, setLatest] = useState<Milestone | null>(null)
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null)
  const [occupancyUnlocked, setOccupancyUnlocked] = useState(false)

  useEffect(() => {
    if (!booking || !supabase) return
    const projectId = booking.unit.tower.project.id
    const towerId = booking.unit.tower.id

    supabase
      .from('construction_milestones')
      .select('id, title, percent_complete, status, milestone_date')
      .eq('project_id', projectId)
      .order('milestone_date', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLatest(data as Milestone | null))

    supabase
      .from('drawings')
      .select('id, title, file_url')
      .eq('project_id', projectId)
      .eq('tower_id', towerId)
      .eq('drawing_type', 'floor_plan')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setFloorPlan(data as FloorPlan | null))

    supabase
      .from('compliance_records')
      .select('status, requirement:compliance_requirements!inner(code)')
      .eq('project_id', projectId)
      .eq('requirement.code', 'OCCUPANCY_CERT')
      .maybeSingle()
      .then(({ data }) => setOccupancyUnlocked((data as { status: string } | null)?.status === 'approved'))
  }, [booking])

  if (loading) return <p className="text-neutral-400">Loading your dashboard&hellip;</p>
  if (!booking) return <NoBookingState />

  const { unit } = booking
  const { tower } = unit
  const { project } = tower
  const tone = latest ? statusTone(latest.status) : 'onTrack'
  const totalCharges = unit.unit_charges.reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">
        {project.name} &middot; {tower.name} {unit.unit_number}
      </h1>
      <p className="mt-1 text-callout text-neutral-600">
        {unit.unit_type ?? 'Unit'} {unit.floor != null && `· Floor ${unit.floor}`}{' '}
        {unit.carpet_area_sqft && `· ${unit.carpet_area_sqft} sq.ft carpet`}
      </p>

      <Card className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-footnote text-neutral-600">Live construction progress</p>
            <p className="mt-1 text-title-1 font-bold text-neutral-900 tabular-nums">
              {latest?.percent_complete != null ? `${latest.percent_complete}%` : '—'}
            </p>
          </div>
          {latest && <StatusChip tone={tone} label={latest.status.replace('_', ' ')} />}
        </div>
        {latest && (
          <>
            <div className="mt-4">
              <ProgressBar percent={latest.percent_complete ?? 0} tone={tone} showLabel={false} />
            </div>
            <p className="mt-3 text-callout text-neutral-600">
              Latest: <span className="text-neutral-900">{latest.title}</span> &middot;{' '}
              {new Date(latest.milestone_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </>
        )}
        {!latest && <p className="mt-4 text-callout text-neutral-600">No construction updates yet.</p>}
      </Card>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Price &amp; charges</h2>
          <p className="mt-2 text-title-2 font-bold text-neutral-900 tabular-nums">
            {unit.list_price != null ? `₹${Number(unit.list_price).toLocaleString('en-IN')}` : 'Not listed yet'}
          </p>
          {unit.unit_charges.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3">
              {unit.unit_charges.map((c) => (
                <div key={c.id} className="flex justify-between text-footnote text-neutral-600">
                  <span>{c.charge_name}</span>
                  <span className="tabular-nums">₹{Number(c.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-neutral-200 pt-1.5 text-footnote font-semibold text-neutral-900">
                <span>Total additional charges</span>
                <span className="tabular-nums">₹{totalCharges.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
          {unit.parking_details && (
            <p className="mt-3 flex items-center gap-1.5 text-footnote text-neutral-600">
              <Car size={13} /> {unit.parking_details}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Layout &amp; location</h2>
          {floorPlan ? (
            <a href={floorPlan.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block">
              <Button variant="secondary" size="sm">
                <FileText size={14} /> View floor plan
              </Button>
            </a>
          ) : (
            <p className="mt-2 text-footnote text-neutral-400">No floor plan uploaded yet.</p>
          )}
          <p className="mt-3 text-footnote text-neutral-600">
            {project.address}
            {project.address && project.city && ', '}
            {project.city}
          </p>
          {project.map_embed_url && (
            <div className="mt-3 overflow-hidden rounded-md border border-neutral-200">
              <iframe src={project.map_embed_url} title="Project location" width="100%" height="160" style={{ border: 0 }} loading="lazy" />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Link to="/customer/construction" className="group">
          <Card hover className="p-5">
            <HardHat size={18} className="text-accent-600" />
            <p className="mt-3 text-callout font-semibold text-neutral-900">Construction</p>
            <p className="mt-1 text-footnote text-neutral-600">Drawings, quality checks, material logs</p>
            <ArrowRight size={14} className="mt-3 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900" />
          </Card>
        </Link>
        <Link to="/customer/compliance" className="group">
          <Card hover className="p-5">
            <FileCheck2 size={18} className="text-accent-600" />
            <p className="mt-3 text-callout font-semibold text-neutral-900">Compliance</p>
            <p className="mt-1 text-footnote text-neutral-600">Tracking, requirements, premium calculations</p>
            <ArrowRight size={14} className="mt-3 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900" />
          </Card>
        </Link>
        <Link to="/customer/rera" className="group">
          <Card hover className="p-5">
            <ShieldCheck size={18} className="text-accent-600" />
            <p className="mt-3 text-callout font-semibold text-neutral-900">RERA profile</p>
            <p className="mt-1 text-footnote text-neutral-600">Your builder&rsquo;s registration status</p>
            <ArrowRight size={14} className="mt-3 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900" />
          </Card>
        </Link>
      </div>

      {occupancyUnlocked && <OccupancyDeclaration bookingId={booking.id} />}
    </div>
  )
}

function OccupancyDeclaration({ bookingId }: { bookingId: string }) {
  const [status, setStatus] = useState('self_occupied')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('unit_occupancy_status')
      .select('occupancy_status')
      .eq('booking_id', bookingId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStatus(data.occupancy_status)
      })
  }, [bookingId])

  async function save() {
    if (!supabase) return
    await supabase.from('unit_occupancy_status').upsert({ booking_id: bookingId, occupancy_status: status }, { onConflict: 'booking_id' })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Card className="mt-5 p-6">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Occupancy status</h2>
      <p className="mt-1 text-footnote text-neutral-600">
        Your occupancy certificate is in — let us know how the unit is being used, for society records.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { value: 'self_occupied', label: 'Self-occupied' },
          { value: 'rented', label: 'Rented out' },
          { value: 'vacant', label: 'Vacant' },
        ].map((o) => (
          <button
            key={o.value}
            onClick={() => setStatus(o.value)}
            className={`rounded-full border px-3.5 py-1.5 text-callout font-medium transition ${
              status === o.value ? 'border-accent-500/40 bg-accent-100 text-accent-600' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={save}>
          Save
        </Button>
        {saved && <span className="text-footnote text-status-on-track">Saved</span>}
      </div>
    </Card>
  )
}
