import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

type Item = { date: string; kind: 'lead' | 'deal' | 'visit'; label: string }

const KIND_DOT: Record<Item['kind'], string> = {
  lead: 'bg-tile-blue-fg',
  deal: 'bg-tile-amber-fg',
  visit: 'bg-tile-green-fg',
}
const KIND_LABEL: Record<Item['kind'], string> = {
  lead: 'Lead follow-up',
  deal: 'Deal follow-up',
  visit: 'Site visit',
}

function toISO(d: Date) {
  // Local calendar date, not UTC — .toISOString() shifts a day backward for
  // timezones ahead of UTC (e.g. IST), which this app is built around.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function CalendarTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const [{ data: leads }, { data: deals }, { data: slots }] = await Promise.all([
        supabase.from('leads').select('name, next_follow_up_at').eq('project_id', projectId).not('next_follow_up_at', 'is', null),
        supabase.from('deals').select('id, next_follow_up_at').eq('project_id', projectId).not('next_follow_up_at', 'is', null),
        supabase.from('site_visit_slots').select('slot_date, slot_time').eq('project_id', projectId),
      ])

      const combined: Item[] = [
        ...((leads ?? []) as { name: string; next_follow_up_at: string }[]).map((l) => ({
          date: l.next_follow_up_at,
          kind: 'lead' as const,
          label: `Follow up: ${l.name}`,
        })),
        ...((deals ?? []) as { id: string; next_follow_up_at: string }[]).map((d) => ({
          date: d.next_follow_up_at,
          kind: 'deal' as const,
          label: `Deal follow-up`,
        })),
        ...((slots ?? []) as { slot_date: string; slot_time: string }[]).map((s) => ({
          date: s.slot_date,
          kind: 'visit' as const,
          label: `Site visit · ${s.slot_time}`,
        })),
      ]
      setItems(combined)
    }
    load()
  }, [projectId])

  const days = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [monthCursor])

  const itemsByDate = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const item of items) {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    }
    return map
  }, [items])

  const selectedItems = selectedDate ? (itemsByDate.get(selectedDate) ?? []) : []

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="rounded-full border border-neutral-200 p-1.5 text-neutral-600 hover:border-neutral-400"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="w-32 text-center text-callout font-semibold text-neutral-900">
            {monthCursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="rounded-full border border-neutral-200 p-1.5 text-neutral-600 hover:border-neutral-400"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-caption text-neutral-600">
        {(['lead', 'deal', 'visit'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${KIND_DOT[k]}`} />
            {KIND_LABEL[k]}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-caption font-semibold text-neutral-400">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          const iso = toISO(day)
          const dayItems = itemsByDate.get(iso) ?? []
          const isToday = iso === toISO(new Date())
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(iso)}
              className={`flex flex-col items-center gap-1 rounded-md border p-2 text-callout transition ${
                selectedDate === iso ? 'border-accent-500 bg-accent-100' : 'border-neutral-200 hover:border-neutral-400'
              } ${isToday ? 'font-bold text-accent-600' : 'text-neutral-900'}`}
            >
              {day.getDate()}
              {dayItems.length > 0 && (
                <span className="flex gap-0.5">
                  {dayItems.slice(0, 3).map((it, idx) => (
                    <span key={idx} className={`h-1 w-1 rounded-full ${KIND_DOT[it.kind]}`} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 rounded-lg border border-neutral-200 p-4">
          <p className="text-callout font-semibold text-neutral-900">
            {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="mt-2 space-y-1.5">
            {selectedItems.map((it, i) => (
              <p key={i} className="flex items-center gap-2 text-footnote text-neutral-600">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[it.kind]}`} />
                {it.label}
              </p>
            ))}
            {selectedItems.length === 0 && <p className="text-footnote text-neutral-400">Nothing scheduled.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
