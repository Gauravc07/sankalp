import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../../lib/supabase'
import { Field, SelectField, SmallButton } from '../../../components/ui/Field'

type Requirement = { id: string; name: string; authority: string | null }
type RecordRow = { id: string; requirement_id: string; status: string; reference_number: string | null }
type Premium = { id: string; premium_type: string; calculated_amount: number; payment_status: string }

export function ComplianceTab({ projectId }: { projectId: string }) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [records, setRecords] = useState<RecordRow[]>([])
  const [premiums, setPremiums] = useState<Premium[]>([])
  const [savingReq, setSavingReq] = useState<string>('')

  const [premiumType, setPremiumType] = useState('')
  const [basis, setBasis] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [savingPremium, setSavingPremium] = useState(false)

  async function load() {
    if (!supabase) return
    const { data: reqs } = await supabase.from('compliance_requirements').select('id, name, authority')
    setRequirements((reqs as Requirement[]) ?? [])
    const { data: recs } = await supabase
      .from('compliance_records')
      .select('id, requirement_id, status, reference_number')
      .eq('project_id', projectId)
    setRecords((recs as RecordRow[]) ?? [])
    const { data: prems } = await supabase
      .from('premium_calculations')
      .select('id, premium_type, calculated_amount, payment_status')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setPremiums((prems as Premium[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function updateStatus(requirementId: string, status: string) {
    if (!supabase) return
    setSavingReq(requirementId)
    await supabase
      .from('compliance_records')
      .upsert({ project_id: projectId, requirement_id: requirementId, status }, { onConflict: 'project_id,requirement_id' })
    setSavingReq('')
    load()
  }

  async function submitPremium(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSavingPremium(true)
    await supabase.from('premium_calculations').insert({
      project_id: projectId,
      premium_type: premiumType,
      calculation_basis: basis || null,
      calculated_amount: Number(amount),
      payment_status: paymentStatus,
    })
    setSavingPremium(false)
    setPremiumType('')
    setBasis('')
    setAmount('')
    load()
  }

  const recordByReq = new Map(records.map((r) => [r.requirement_id, r]))

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Compliance tracking
        </h2>
        <div className="mt-3 space-y-2">
          {requirements.map((req) => {
            const rec = recordByReq.get(req.id)
            return (
              <div key={req.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3.5 py-2.5">
                <div>
                  <p className="text-callout text-neutral-900">{req.name}</p>
                  <p className="text-footnote text-neutral-400">{req.authority}</p>
                </div>
                <select
                  value={rec?.status ?? 'pending'}
                  disabled={savingReq === req.id}
                  onChange={(e) => updateStatus(req.id, e.target.value)}
                  className="rounded-md border border-neutral-200 bg-neutral-0 px-2.5 py-1.5 text-caption text-neutral-900 outline-none focus:border-accent-500"
                >
                  <option value="pending">Pending</option>
                  <option value="applied">Applied</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="not_applicable">N/A</option>
                </select>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
          Premium calculations
        </h2>
        <form onSubmit={submitPremium} className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4">
          <Field
            label="Premium type"
            required
            value={premiumType}
            onChange={(e) => setPremiumType(e.target.value)}
            placeholder="Fungible FSI Premium"
          />
          <Field label="Calculation basis" value={basis} onChange={(e) => setBasis(e.target.value)} placeholder="10% of ready reckoner rate × area" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹)" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1250000" />
            <SelectField label="Payment status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
            </SelectField>
          </div>
          <SmallButton disabled={savingPremium} type="submit">
            {savingPremium ? 'Adding…' : 'Add premium'}
          </SmallButton>
        </form>
        <div className="mt-3 space-y-2">
          {premiums.map((p) => (
            <div key={p.id} className="flex justify-between rounded-lg border border-neutral-200 px-3.5 py-2.5 text-callout">
              <span className="text-neutral-900">{p.premium_type}</span>
              <span className="text-neutral-400">
                ₹{Number(p.calculated_amount).toLocaleString('en-IN')} &middot; {p.payment_status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
