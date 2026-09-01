import { useEffect, useState } from 'react'
import { Building2, Users, IndianRupee, AlertTriangle, LifeBuoy, CalendarCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBuilder } from '../../hooks/useMyBuilder'
import { StatTile } from '../../components/ui/StatTile'
import { BarRow } from '../../components/ui/BarRow'
import { Card } from '../../components/ui/Card'

type UnitStatusRollup = { available: number; blocked: number; booked: number; sold: number }
type ValueRollup = Record<keyof UnitStatusRollup, number>
type PaymentHealth = { total_payable: number; total_collected: number; total_overdue: number; overdue_count: number }
type SupportSla = {
  open_count: number
  in_progress_count: number
  resolved_count: number
  avg_resolution_hours: number | null
  breached_count: number
}
type SiteVisitStats = { visits_requested: number; visits_converted: number }
type MilestoneRollup = { on_schedule: number; delayed: number; completed: number }

const EMPTY_UNIT_ROLLUP: UnitStatusRollup = { available: 0, blocked: 0, booked: 0, sold: 0 }
const EMPTY_VALUE_ROLLUP: ValueRollup = { available: 0, blocked: 0, booked: 0, sold: 0 }
const EMPTY_MILESTONES: MilestoneRollup = { on_schedule: 0, delayed: 0, completed: 0 }

function formatCrore(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function BuilderInsights() {
  const { builder, loading: builderLoading } = useMyBuilder()
  const [loading, setLoading] = useState(true)
  const [projectCount, setProjectCount] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [unitCounts, setUnitCounts] = useState<UnitStatusRollup>(EMPTY_UNIT_ROLLUP)
  const [unitValues, setUnitValues] = useState<ValueRollup>(EMPTY_VALUE_ROLLUP)
  const [milestones, setMilestones] = useState<MilestoneRollup>(EMPTY_MILESTONES)
  const [paymentHealth, setPaymentHealth] = useState<PaymentHealth | null>(null)
  const [supportSla, setSupportSla] = useState<SupportSla | null>(null)
  const [siteVisits, setSiteVisits] = useState<SiteVisitStats | null>(null)

  useEffect(() => {
    async function load() {
      if (!builder || !supabase) return

      const { data: projects } = await supabase.from('projects').select('id').eq('builder_id', builder.id)
      const projectIds = (projects ?? []).map((p) => p.id)
      setProjectCount(projectIds.length)

      if (projectIds.length) {
        const { data: towers } = await supabase.from('towers').select('id').in('project_id', projectIds)
        const towerIds = (towers ?? []).map((t) => t.id)

        if (towerIds.length) {
          const { data: units } = await supabase
            .from('units')
            .select('id, status, list_price')
            .in('tower_id', towerIds)

          const counts: UnitStatusRollup = { available: 0, blocked: 0, booked: 0, sold: 0 }
          const values: ValueRollup = { available: 0, blocked: 0, booked: 0, sold: 0 }
          for (const u of units ?? []) {
            const status = u.status as keyof UnitStatusRollup
            if (status in counts) {
              counts[status] += 1
              values[status] += Number(u.list_price ?? 0)
            }
          }
          setUnitCounts(counts)
          setUnitValues(values)

          const unitIds = (units ?? []).map((u) => u.id)
          if (unitIds.length) {
            const { data: bookings } = await supabase
              .from('bookings')
              .select('customer_profile_id, status')
              .in('unit_id', unitIds)
              .eq('status', 'active')
            setCustomerCount(
              new Set((bookings ?? []).map((b) => b.customer_profile_id).filter(Boolean)).size,
            )
          }
        }

        const { data: milestoneRows } = await supabase
          .from('construction_milestones')
          .select('status')
          .in('project_id', projectIds)
        const m: MilestoneRollup = { on_schedule: 0, delayed: 0, completed: 0 }
        for (const row of milestoneRows ?? []) {
          const status = row.status as keyof MilestoneRollup
          if (status in m) m[status] += 1
        }
        setMilestones(m)
      }

      const [{ data: ph }, { data: sla }, { data: sv }] = await Promise.all([
        supabase.rpc('builder_payment_health', { p_builder_id: builder.id }),
        supabase.rpc('builder_support_sla', { p_builder_id: builder.id }),
        supabase.rpc('builder_site_visit_stats', { p_builder_id: builder.id }),
      ])
      setPaymentHealth((ph?.[0] as PaymentHealth) ?? null)
      setSupportSla((sla?.[0] as SupportSla) ?? null)
      setSiteVisits((sv?.[0] as SiteVisitStats) ?? null)

      setLoading(false)
    }
    load()
  }, [builder])

  if (builderLoading || loading) return <p className="text-neutral-400">Loading&hellip;</p>

  const totalUnits = unitCounts.available + unitCounts.blocked + unitCounts.booked + unitCounts.sold
  const totalUnitValue = unitValues.available + unitValues.blocked + unitValues.booked + unitValues.sold

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">Insights</h1>
      <p className="mt-1 text-callout text-neutral-600">Customer, payment, and inventory health across all of {builder?.name}&rsquo;s projects</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Building2} tile="blue" value={projectCount} label="Active projects" />
        <StatTile icon={Users} tile="green" value={customerCount} label="Customers with active bookings" />
        <StatTile icon={IndianRupee} tile="amber" value={Math.round(paymentHealth?.total_collected ?? 0)} prefix="₹" label="Collected to date" />
        <StatTile icon={AlertTriangle} tile="rose" value={paymentHealth?.overdue_count ?? 0} label="Overdue payment slabs" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Inventory remaining</h2>
          <p className="mt-1 text-footnote text-neutral-400">{totalUnits} units &middot; {formatCrore(totalUnitValue)} total value</p>
          <div className="mt-4 space-y-4">
            <BarRow label="Available" value={unitCounts.available} total={totalUnits} tone="onTrack" valueLabel={`${unitCounts.available} · ${formatCrore(unitValues.available)}`} />
            <BarRow label="Blocked" value={unitCounts.blocked} total={totalUnits} tone="attention" valueLabel={`${unitCounts.blocked} · ${formatCrore(unitValues.blocked)}`} />
            <BarRow label="Booked" value={unitCounts.booked} total={totalUnits} tone="info" valueLabel={`${unitCounts.booked} · ${formatCrore(unitValues.booked)}`} />
            <BarRow label="Sold" value={unitCounts.sold} total={totalUnits} tone="onTrack" valueLabel={`${unitCounts.sold} · ${formatCrore(unitValues.sold)}`} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Payment collection health</h2>
          <p className="mt-1 text-footnote text-neutral-400">{formatCrore(paymentHealth?.total_payable ?? 0)} total payable</p>
          <div className="mt-4 space-y-4">
            <BarRow
              label="Collected"
              value={paymentHealth?.total_collected ?? 0}
              total={paymentHealth?.total_payable ?? 0}
              tone="onTrack"
              valueLabel={formatCrore(paymentHealth?.total_collected ?? 0)}
            />
            <BarRow
              label="Overdue"
              value={paymentHealth?.total_overdue ?? 0}
              total={paymentHealth?.total_payable ?? 0}
              tone="overdue"
              valueLabel={formatCrore(paymentHealth?.total_overdue ?? 0)}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <LifeBuoy size={15} className="text-neutral-400" />
            <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Support SLA</h2>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-title-3 font-bold text-neutral-900">{supportSla?.open_count ?? 0}</p>
              <p className="text-caption text-neutral-400">Open</p>
            </div>
            <div>
              <p className="font-display text-title-3 font-bold text-neutral-900">{supportSla?.in_progress_count ?? 0}</p>
              <p className="text-caption text-neutral-400">In progress</p>
            </div>
            <div>
              <p className="font-display text-title-3 font-bold text-neutral-900">{supportSla?.resolved_count ?? 0}</p>
              <p className="text-caption text-neutral-400">Resolved</p>
            </div>
          </div>
          <p className="mt-4 text-footnote text-neutral-600">
            Avg. resolution time: <span className="font-medium text-neutral-900">{supportSla?.avg_resolution_hours != null ? `${Math.round(supportSla.avg_resolution_hours)}h` : '—'}</span>
          </p>
          {(supportSla?.breached_count ?? 0) > 0 && (
            <p className="mt-1 text-footnote text-status-overdue">{supportSla?.breached_count} request(s) open past the 48h SLA</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <CalendarCheck size={15} className="text-neutral-400" />
            <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Site visits &amp; construction</h2>
          </div>
          <p className="mt-4 text-footnote text-neutral-600">
            Site visit conversion: <span className="font-medium text-neutral-900">{siteVisits?.visits_converted ?? 0} / {siteVisits?.visits_requested ?? 0}</span> requesters now booked
          </p>
          <div className="mt-4 flex gap-4 text-footnote text-neutral-600">
            <span>On schedule: <strong className="text-neutral-900">{milestones.on_schedule}</strong></span>
            <span>Delayed: <strong className="text-status-overdue">{milestones.delayed}</strong></span>
            <span>Completed: <strong className="text-neutral-900">{milestones.completed}</strong></span>
          </div>
        </Card>
      </div>
    </div>
  )
}
