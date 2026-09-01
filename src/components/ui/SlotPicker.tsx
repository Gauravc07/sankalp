import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Slot = { id: string; slot_date: string; slot_time: string; capacity: number; booked: number }

function toISO(d: Date) {
  // Local calendar date, not UTC — .toISOString() shifts a day backward for
  // timezones ahead of UTC (e.g. IST), which this app is built around.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function SlotPicker({ slots, value, onChange }: { slots: Slot[]; value: string; onChange: (id: string) => void }) {
  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      if (s.booked >= s.capacity) continue
      const list = map.get(s.slot_date) ?? []
      list.push(s)
      map.set(s.slot_date, list)
    }
    return map
  }, [slots])

  const availableDates = useMemo(() => [...slotsByDate.keys()].sort(), [slotsByDate])

  const [monthCursor, setMonthCursor] = useState(() => {
    const first = availableDates[0]
    const d = first ? new Date(first) : new Date()
    d.setDate(1)
    return d
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(availableDates[0] ?? null)

  // slots arrive asynchronously from the parent after mount, so the above
  // initializers can miss the real first date — sync once data lands.
  useEffect(() => {
    if (selectedDate === null && availableDates.length > 0) {
      setSelectedDate(availableDates[0])
      const d = new Date(availableDates[0])
      d.setDate(1)
      setMonthCursor(d)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates])

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

  const timesForSelected = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : []

  if (availableDates.length === 0) {
    return <p className="text-footnote text-neutral-400">No slots open yet — check back soon.</p>
  }

  return (
    <div className="grid gap-4 rounded-lg border border-neutral-200 p-4 sm:grid-cols-2">
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="rounded-full border border-neutral-200 p-1.5 text-neutral-600 hover:border-neutral-400"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-callout font-semibold text-neutral-900">
            {monthCursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="rounded-full border border-neutral-200 p-1.5 text-neutral-600 hover:border-neutral-400"
          >
            <ChevronRight size={14} />
          </button>
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
            const hasSlots = slotsByDate.has(iso)
            return (
              <button
                type="button"
                key={i}
                disabled={!hasSlots}
                onClick={() => setSelectedDate(iso)}
                className={`rounded-md p-2 text-footnote transition ${
                  selectedDate === iso
                    ? 'bg-accent-500 font-semibold text-white'
                    : hasSlots
                      ? 'text-neutral-900 hover:bg-accent-100'
                      : 'text-neutral-200'
                }`}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-caption text-neutral-400">Time zone: Asia/Kolkata (IST)</p>
      </div>

      <div>
        <p className="mb-2 text-footnote font-medium text-neutral-600">
          {selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a date'}
        </p>
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {timesForSelected.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => onChange(s.id)}
              className={`w-full rounded-md border px-3 py-2 text-left text-footnote transition ${
                value === s.id ? 'border-accent-500 bg-accent-100 font-semibold text-accent-600' : 'border-neutral-200 text-neutral-900 hover:border-accent-500'
              }`}
            >
              {s.slot_time}
              <span className="ml-1.5 text-caption text-neutral-400">({s.capacity - s.booked} left)</span>
            </button>
          ))}
          {selectedDate && timesForSelected.length === 0 && <p className="text-footnote text-neutral-400">No slots on this date.</p>}
        </div>
      </div>
    </div>
  )
}
