import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { SmallButton } from '../../../components/ui/Field'
import { StatusChip, statusTone } from '../../../components/ui/StatusChip'

type Deal = {
  id: string
  status: string
  offered_price: number | null
  next_follow_up_at: string | null
  unit_id: string | null
  lead: { name: string; phone: string | null; email: string | null } | null
  unit: { unit_number: string; tower: { name: string } } | null
}

function randomCode() {
  return `SLAB-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function DealsTab({ projectId }: { projectId: string }) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [wonLink, setWonLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    if (!supabase) return
    const { data } = await supabase
      .from('deals')
      .select('id, status, offered_price, next_follow_up_at, unit_id, lead:leads(name, phone, email), unit:units(unit_number, tower:towers(name))')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setDeals((data as unknown as Deal[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function markLost(id: string) {
    if (!supabase) return
    await supabase.from('deals').update({ status: 'lost' }).eq('id', id)
    load()
  }

  async function markWon(deal: Deal) {
    if (!supabase || !deal.unit_id) return
    const code = randomCode()
    await supabase.from('bookings').insert({
      unit_id: deal.unit_id,
      booking_code: code,
      deal_id: deal.id,
      pending_customer_name: deal.lead?.name ?? null,
      pending_customer_email: deal.lead?.email ?? null,
      pending_customer_phone: deal.lead?.phone ?? null,
    })
    await supabase.from('deals').update({ status: 'won' }).eq('id', deal.id)
    setWonLink(`${window.location.origin}/signup/customer?code=${code}`)
    load()
  }

  function copyLink() {
    if (!wonLink) return
    navigator.clipboard.writeText(wonLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Deals</h2>
      <p className="mt-1 text-footnote text-neutral-400">Active negotiations, created by converting a qualified lead.</p>

      {wonLink && (
        <div className="mt-3 rounded-lg border border-accent-500/30 bg-accent-100 p-3.5">
          <p className="text-footnote font-semibold text-accent-600">Deal won — booking created. Share this activation link with the buyer</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-neutral-0 px-3 py-1.5 text-footnote text-neutral-900">{wonLink}</code>
            <button
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-caption font-medium text-neutral-600 hover:border-neutral-400"
            >
              <Copy size={12} />
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button onClick={() => setWonLink(null)} className="shrink-0 text-caption text-neutral-400 hover:text-neutral-600">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {deals.map((d) => (
          <div key={d.id} className="rounded-lg border border-neutral-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-callout font-semibold text-neutral-900">{d.lead?.name ?? '—'}</p>
                <p className="text-footnote text-neutral-400">
                  {d.unit ? `${d.unit.tower.name} · ${d.unit.unit_number}` : 'No unit'}
                  {d.offered_price && ` · ₹${d.offered_price.toLocaleString('en-IN')}`}
                  {d.next_follow_up_at && ` · Follow up ${d.next_follow_up_at}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip tone={statusTone(d.status)} label={d.status} />
                {d.status === 'active' && (
                  <>
                    <SmallButton onClick={() => markWon(d)} disabled={!d.unit_id}>
                      Mark won
                    </SmallButton>
                    <button
                      onClick={() => markLost(d.id)}
                      className="rounded-full border border-neutral-200 px-4 py-2 text-caption font-semibold text-neutral-600 hover:border-neutral-400"
                    >
                      Mark lost
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {deals.length === 0 && <p className="text-callout text-neutral-400">No deals yet — convert a qualified lead from the Leads tab.</p>}
      </div>
    </div>
  )
}
