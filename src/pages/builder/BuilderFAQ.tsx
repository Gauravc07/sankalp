import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMyBuilder } from '../../hooks/useMyBuilder'
import { Field, SmallButton } from '../../components/ui/Field'

type Faq = { id: string; category: string; question: string; answer: string; is_published: boolean }

export function BuilderFAQ() {
  const { builder, loading: builderLoading } = useMyBuilder()
  const [items, setItems] = useState<Faq[]>([])
  const [category, setCategory] = useState('general')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!builder || !supabase) return
    const { data } = await supabase
      .from('faq_items')
      .select('id, category, question, answer, is_published')
      .eq('builder_id', builder.id)
      .order('sort_order')
    setItems((data as Faq[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!builder || !supabase) return
    setSaving(true)
    await supabase.from('faq_items').insert({ builder_id: builder.id, category, question, answer })
    setSaving(false)
    setQuestion('')
    setAnswer('')
    load()
  }

  async function togglePublished(id: string, is_published: boolean) {
    if (!supabase) return
    await supabase.from('faq_items').update({ is_published: !is_published }).eq('id', id)
    load()
  }

  async function remove(id: string) {
    if (!supabase) return
    await supabase.from('faq_items').delete().eq('id', id)
    load()
  }

  if (builderLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">FAQ</h1>
      <p className="mt-1 text-callout text-neutral-600">
        Published entries appear to every buyer across all your projects, under Support.
      </p>

      <form onSubmit={handleCreate} className="mt-6 space-y-3 rounded-lg border border-neutral-200 bg-neutral-0 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="payments" />
          <Field label="Question" required value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="When is my next payment due?" />
        </div>
        <label className="block">
          <span className="mb-1 block text-footnote font-medium text-neutral-600">Answer</span>
          <textarea
            required
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
          />
        </label>
        <SmallButton disabled={saving} type="submit">
          {saving ? 'Adding…' : 'Add FAQ'}
        </SmallButton>
      </form>

      <div className="mt-6 space-y-2">
        {items.map((f) => (
          <div key={f.id} className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-callout font-semibold text-neutral-900">{f.question}</p>
                <p className="mt-1 text-footnote text-neutral-600">{f.answer}</p>
                <span className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-caption text-neutral-600">{f.category}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => togglePublished(f.id, f.is_published)}
                  className={`rounded-full px-2.5 py-1 text-caption font-medium ${f.is_published ? 'bg-status-on-track/12 text-status-on-track' : 'bg-neutral-100 text-neutral-400'}`}
                >
                  {f.is_published ? 'Published' : 'Draft'}
                </button>
                <button onClick={() => remove(f.id)} className="text-neutral-400 hover:text-status-overdue">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-callout text-neutral-400">No FAQ entries yet.</p>}
      </div>
    </div>
  )
}
