import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Phone, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'
import { Card } from '../../components/ui/Card'

type Faq = { id: string; category: string; question: string; answer: string }
type Contact = { id: string; role_label: string; name: string; phone: string | null; email: string | null }

export function CustomerSupport() {
  const { booking, loading } = useMyBooking()
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  useEffect(() => {
    if (!booking || !supabase) return
    const builderId = booking.unit.tower.project.builder.id
    const projectId = booking.unit.tower.project.id

    supabase
      .from('faq_items')
      .select('id, category, question, answer')
      .eq('builder_id', builderId)
      .eq('is_published', true)
      .then(({ data }) => setFaqs((data as Faq[]) ?? []))

    supabase
      .from('contacts')
      .select('id, role_label, name, phone, email')
      .eq('project_id', projectId)
      .then(({ data }) => setContacts((data as Contact[]) ?? []))
  }, [booking])

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!booking) return <NoBookingState />

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Support</h1>
        <p className="mt-1 text-callout text-neutral-600">Answers first, a real person right after.</p>
      </div>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Contact directory</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <Card key={c.id} className="p-4">
              <p className="text-callout font-semibold text-neutral-900">{c.name}</p>
              <p className="text-footnote text-neutral-400">{c.role_label}</p>
              <div className="mt-2 space-y-1">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-footnote text-accent-600 hover:text-accent-500">
                    <Phone size={13} /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-footnote text-accent-600 hover:text-accent-500">
                    <Mail size={13} /> {c.email}
                  </a>
                )}
              </div>
            </Card>
          ))}
          {contacts.length === 0 && <p className="text-callout text-neutral-400 sm:col-span-2">No contacts published yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Frequently asked questions</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
          {faqs.map((f, i) => (
            <div key={f.id} className={i > 0 ? 'border-t border-neutral-200' : ''}>
              <button
                onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex items-center gap-2.5 text-callout font-medium text-neutral-900">
                  {openFaq === f.id ? <ChevronDown size={14} className="shrink-0 text-neutral-400" /> : <ChevronRight size={14} className="shrink-0 text-neutral-400" />}
                  {f.question}
                </span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">{f.category}</span>
              </button>
              {openFaq === f.id && <p className="px-4 pb-4 pl-[2.1rem] text-footnote leading-relaxed text-neutral-600">{f.answer}</p>}
            </div>
          ))}
          {faqs.length === 0 && <p className="p-4 text-callout text-neutral-400">No FAQs published yet.</p>}
        </div>
      </section>
    </div>
  )
}
