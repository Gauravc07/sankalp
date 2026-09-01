import { useEffect, useState } from 'react'
import { FileText, ExternalLink, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getVaultFileUrl } from '../../lib/vault'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'

type Doc = { id: string; category: string; title: string; storage_path: string | null; status: string; created_at: string }

const CATEGORY_LABEL: Record<string, string> = {
  allotment_letter: 'Allotment letter',
  agreement: 'Agreement to sale',
  receipt: 'Receipts',
  noc: 'NOCs',
  legal: 'Legal',
  other: 'Other',
}

export function CustomerDocuments() {
  const { booking, loading } = useMyBooking()
  const [docs, setDocs] = useState<Doc[]>([])
  const [filter, setFilter] = useState('all')
  const [opening, setOpening] = useState<string | null>(null)

  useEffect(() => {
    if (!booking || !supabase) return
    supabase
      .from('documents')
      .select('id, category, title, storage_path, status, created_at')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setDocs((data as Doc[]) ?? []))
  }, [booking])

  async function openDocument(d: Doc) {
    if (!d.storage_path || opening) return
    setOpening(d.id)
    const { url, error } = await getVaultFileUrl(d.storage_path)
    setOpening(null)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    else if (error) window.alert('Could not open this document. Please try again.')
  }

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!booking) return <NoBookingState />

  const categories = ['all', ...Object.keys(CATEGORY_LABEL)]
  const visible = filter === 'all' ? docs : docs.filter((d) => d.category === filter)

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">Documents &amp; receipts</h1>
      <p className="mt-1 text-callout text-neutral-600">
        Your allotment letter, agreement, every payment receipt, and any issued NOCs — all in one vault.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3.5 py-1.5 text-callout font-medium transition ${
              filter === c ? 'border-accent-500/40 bg-accent-100 text-accent-600' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-neutral-200">
        {visible.length === 0 && <p className="p-4 text-callout text-neutral-400">No documents in this category yet.</p>}
        {visible.map((d, i) =>
          d.storage_path ? (
            <button
              key={d.id}
              type="button"
              onClick={() => openDocument(d)}
              disabled={opening === d.id}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-callout transition hover:bg-neutral-50 disabled:opacity-60 ${
                i > 0 ? 'border-t border-neutral-200' : ''
              }`}
            >
              <span className="flex items-center gap-3 text-neutral-900">
                <FileText size={15} className="text-status-info" />
                {d.title}
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">{CATEGORY_LABEL[d.category] ?? d.category}</span>
              </span>
              <span className="flex items-center gap-3 text-footnote text-neutral-400">
                {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {opening === d.id ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
              </span>
            </button>
          ) : (
            <div key={d.id} className={`flex items-center justify-between px-4 py-3.5 text-callout ${i > 0 ? 'border-t border-neutral-200' : ''}`}>
              <span className="flex items-center gap-3 text-neutral-900">
                <FileText size={15} className="text-neutral-400" />
                {d.title}
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">{CATEGORY_LABEL[d.category] ?? d.category}</span>
              </span>
              <span className="text-footnote text-neutral-400">{d.status}</span>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
