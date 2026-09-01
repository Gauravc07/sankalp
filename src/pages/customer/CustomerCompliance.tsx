import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'
import { StatusChip, statusTone } from '../../components/ui/StatusChip'

type Requirement = { id: string; code: string; name: string; description: string | null; authority: string | null }
type Record_ = {
  requirement_id: string
  status: string
  reference_number: string | null
  applied_date: string | null
  approved_date: string | null
  notes: string | null
}
type Premium = {
  id: string
  premium_type: string
  calculation_basis: string | null
  area_sqm: number | null
  rate_per_sqm: number | null
  calculated_amount: number
  payment_status: string
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'Approved',
  applied: 'Applied — awaiting approval',
  pending: 'Not yet started',
  rejected: 'Rejected',
  not_applicable: 'Not applicable',
}

export function CustomerCompliance() {
  const { booking, loading } = useMyBooking()
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [records, setRecords] = useState<Record_[]>([])
  const [premiums, setPremiums] = useState<Premium[]>([])

  useEffect(() => {
    if (!booking || !supabase) return
    const projectId = booking.unit.tower.project.id

    supabase
      .from('compliance_requirements')
      .select('id, code, name, description, authority')
      .then(({ data }) => setRequirements((data as Requirement[]) ?? []))

    supabase
      .from('compliance_records')
      .select('requirement_id, status, reference_number, applied_date, approved_date, notes')
      .eq('project_id', projectId)
      .then(({ data }) => setRecords((data as Record_[]) ?? []))

    supabase
      .from('premium_calculations')
      .select('id, premium_type, calculation_basis, area_sqm, rate_per_sqm, calculated_amount, payment_status')
      .eq('project_id', projectId)
      .then(({ data }) => setPremiums((data as Premium[]) ?? []))
  }, [booking])

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!booking) return <NoBookingState />

  const recordByReq = new Map(records.map((r) => [r.requirement_id, r]))

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Government compliances</h1>
        <p className="mt-1 text-callout text-neutral-600">
          The approvals every project needs, and where this one stands on each.
        </p>
      </div>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Compliance tracking
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          {requirements.map((req, i) => {
            const rec = recordByReq.get(req.id)
            const status = rec?.status ?? 'pending'
            return (
              <div key={req.id} className={`px-4 py-3.5 ${i > 0 ? 'border-t border-neutral-200' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-callout font-semibold text-neutral-900">{req.name}</p>
                    <p className="mt-0.5 text-footnote text-neutral-400">{req.authority}</p>
                  </div>
                  <StatusChip tone={statusTone(status)} label={STATUS_LABEL[status] ?? status} />
                </div>
                {req.description && <p className="mt-2 text-footnote text-neutral-600">{req.description}</p>}
                {rec?.reference_number && (
                  <p className="mt-1.5 text-footnote text-neutral-400">Ref: {rec.reference_number}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Premium calculations
        </h2>
        <p className="mt-1 text-footnote text-neutral-400">
          Statutory premiums paid to authorities for approvals like fungible FSI or staircase area.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          {premiums.length === 0 && (
            <p className="p-4 text-callout text-neutral-400">No premium calculations recorded yet.</p>
          )}
          {premiums.map((p, i) => (
            <div key={p.id} className={`px-4 py-3.5 ${i > 0 ? 'border-t border-neutral-200' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-callout font-semibold text-neutral-900">{p.premium_type}</p>
                <StatusChip tone={statusTone(p.payment_status)} label={p.payment_status} />
              </div>
              {p.calculation_basis && <p className="mt-1 text-footnote text-neutral-600">{p.calculation_basis}</p>}
              <p className="mt-2 text-title-3 font-bold text-neutral-900 tabular-nums">
                ₹{Number(p.calculated_amount).toLocaleString('en-IN')}
              </p>
              {(p.area_sqm || p.rate_per_sqm) && (
                <p className="mt-0.5 text-footnote text-neutral-400 tabular-nums">
                  {p.area_sqm && `${p.area_sqm} sq.m`}
                  {p.area_sqm && p.rate_per_sqm && ' × '}
                  {p.rate_per_sqm && `₹${p.rate_per_sqm}/sq.m`}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
