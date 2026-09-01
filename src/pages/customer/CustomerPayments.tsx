import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'
import { Card } from '../../components/ui/Card'
import { StatusChip } from '../../components/ui/StatusChip'

type Schedule = { id: string; sale_price: number | null }
type Slab = {
  id: string
  label: string
  base_amount: number
  gst_percent: number
  tds_percent: number
  due_date: string | null
  status: string
}
type Txn = { id: string; payment_slab_id: string; amount: number; payment_date: string; mode: string; reference_number: string | null }

export function CustomerPayments() {
  const { booking, loading } = useMyBooking()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [slabs, setSlabs] = useState<Slab[]>([])
  const [txns, setTxns] = useState<Txn[]>([])

  useEffect(() => {
    if (!booking || !supabase) return

    supabase
      .from('payment_schedules')
      .select('id, sale_price')
      .eq('booking_id', booking.id)
      .maybeSingle()
      .then(async ({ data }) => {
        setSchedule(data as Schedule | null)
        if (!data || !supabase) return

        const { data: slabRows } = await supabase
          .from('payment_slabs')
          .select('id, label, base_amount, gst_percent, tds_percent, due_date, status')
          .eq('payment_schedule_id', data.id)
          .order('sort_order')
        setSlabs((slabRows as Slab[]) ?? [])

        const slabIds = (slabRows ?? []).map((s) => s.id)
        if (slabIds.length) {
          const { data: txnRows } = await supabase
            .from('payment_transactions')
            .select('id, payment_slab_id, amount, payment_date, mode, reference_number')
            .in('payment_slab_id', slabIds)
            .order('payment_date', { ascending: false })
          setTxns((txnRows as Txn[]) ?? [])
        }
      })
  }, [booking])

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!booking) return <NoBookingState />

  const totalPayable = slabs.reduce((sum, s) => {
    const gst = (s.base_amount * s.gst_percent) / 100
    const tds = (s.base_amount * s.tds_percent) / 100
    return sum + s.base_amount + gst - tds
  }, 0)
  const totalPaid = txns.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Payments</h1>
        <p className="mt-1 text-callout text-neutral-600">
          Your payment structure, GST/TDS breakdown, and transaction ledger.
        </p>
      </div>

      {!schedule ? (
        <p className="text-callout text-neutral-400">Your builder hasn&rsquo;t published a payment schedule yet.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-footnote text-neutral-600">Sale price</p>
              <p className="mt-1 text-title-1 font-bold text-neutral-900 tabular-nums">
                {schedule.sale_price != null ? `₹${Number(schedule.sale_price).toLocaleString('en-IN')}` : '—'}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-footnote text-neutral-600">Total payable (incl. GST/TDS)</p>
              <p className="mt-1 text-title-1 font-bold text-neutral-900 tabular-nums">₹{totalPayable.toLocaleString('en-IN')}</p>
            </Card>
            <Card className="p-5">
              <p className="text-footnote text-neutral-600">Paid to date</p>
              <p className="mt-1 text-title-1 font-bold text-status-on-track tabular-nums">₹{totalPaid.toLocaleString('en-IN')}</p>
            </Card>
          </div>

          <section>
            <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
              Payment structure
            </h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
              {slabs.map((s, i) => {
                const gstAmt = (s.base_amount * s.gst_percent) / 100
                const tdsAmt = (s.base_amount * s.tds_percent) / 100
                const payable = s.base_amount + gstAmt - tdsAmt
                const isOverdue = s.status === 'pending' && s.due_date && new Date(s.due_date) < new Date()
                const tone = s.status === 'paid' ? 'onTrack' : isOverdue ? 'overdue' : 'attention'
                const label = s.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'
                return (
                  <div key={s.id} className={`px-4 py-3.5 ${i > 0 ? 'border-t border-neutral-200' : ''}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-callout font-semibold text-neutral-900">{s.label}</p>
                      <StatusChip tone={tone} label={label} />
                    </div>
                    <p className="mt-1.5 text-footnote text-neutral-400">
                      Base ₹{s.base_amount.toLocaleString('en-IN')} + GST {s.gst_percent}% (₹{gstAmt.toLocaleString('en-IN')}) − TDS{' '}
                      {s.tds_percent}% (₹{tdsAmt.toLocaleString('en-IN')})
                      {s.due_date && ` · Due ${new Date(s.due_date).toLocaleDateString('en-IN')}`}
                    </p>
                    <p className="mt-1 text-title-3 font-semibold text-neutral-900 tabular-nums">₹{payable.toLocaleString('en-IN')}</p>
                  </div>
                )
              })}
              {slabs.length === 0 && <p className="p-4 text-callout text-neutral-400">No payment slabs yet.</p>}
            </div>
          </section>

          <section>
            <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
              Ledger &amp; financial summary
            </h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
              {txns.map((t, i) => (
                <div key={t.id} className={`flex items-center justify-between px-4 py-3 text-callout ${i > 0 ? 'border-t border-neutral-200' : ''}`}>
                  <span className="text-neutral-600">
                    {t.mode.replace('_', ' ')} {t.reference_number && `· ${t.reference_number}`}
                  </span>
                  <span className="text-neutral-400">{new Date(t.payment_date).toLocaleDateString('en-IN')}</span>
                  <span className="font-medium text-neutral-900 tabular-nums">₹{Number(t.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {txns.length === 0 && <p className="p-4 text-callout text-neutral-400">No payments recorded yet.</p>}
            </div>
          </section>
        </>
      )}

      <Link to="/customer/documents" className="group flex items-center justify-between rounded-lg border border-neutral-200 p-5 transition hover:border-accent-500/30">
        <span className="flex items-center gap-3">
          <FolderOpen size={18} className="text-accent-600" />
          <span>
            <span className="block text-callout font-semibold text-neutral-900">Every receipt, generated automatically</span>
            <span className="block text-footnote text-neutral-600">View them in Documents &amp; receipts</span>
          </span>
        </span>
        <ArrowRight size={14} className="text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900" />
      </Link>
    </div>
  )
}
