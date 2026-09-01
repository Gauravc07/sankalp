import { useState } from 'react'
import { Handshake } from 'lucide-react'
import { useMyTeamMembership } from '../../hooks/useMyTeamMembership'
import { useBuilderProjects } from '../../hooks/useBuilderProjects'
import { LeadsTab } from '../builder/tabs/LeadsTab'
import { DealsTab } from '../builder/tabs/DealsTab'
import { SalesTab } from '../builder/tabs/SalesTab'
import { ClosuresTab } from '../builder/tabs/ClosuresTab'
import { CalendarTab } from '../builder/tabs/CalendarTab'
import { RequestsTab } from '../builder/tabs/RequestsTab'

const SECTIONS = [
  { key: 'leads', label: 'Leads' },
  { key: 'deals', label: 'Deals' },
  { key: 'sales', label: 'Bookings' },
  { key: 'closures', label: 'Closures' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'requests', label: 'Requests' },
] as const
type SectionKey = (typeof SECTIONS)[number]['key']

export function SalesDashboard() {
  const { membership, loading: membershipLoading } = useMyTeamMembership()
  const { projects, selected, setSelected, loading: projectsLoading } = useBuilderProjects(membership?.builderId)
  const [section, setSection] = useState<SectionKey>('leads')

  if (membershipLoading || projectsLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2">
        <Handshake size={18} className="text-neutral-400" />
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Sales &amp; bookings</h1>
      </div>
      <p className="mt-1 text-callout text-neutral-600">Run the full sales pipeline for {membership?.builderName}&rsquo;s projects.</p>

      {projects.length === 0 ? (
        <p className="mt-6 text-callout text-neutral-400">No projects yet.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <label className="block max-w-xs">
              <span className="mb-1 block text-footnote font-medium text-neutral-600">Project</span>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-64 rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.city ? `(${p.city})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-1 rounded-full border border-neutral-200 p-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={`rounded-full px-3.5 py-1.5 text-caption font-semibold transition ${
                    section === s.key ? 'bg-accent-100 text-accent-600' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {selected && section === 'leads' && <LeadsTab projectId={selected} />}
            {selected && section === 'deals' && <DealsTab projectId={selected} />}
            {selected && section === 'sales' && <SalesTab projectId={selected} />}
            {selected && section === 'closures' && <ClosuresTab projectId={selected} />}
            {selected && section === 'calendar' && <CalendarTab projectId={selected} />}
            {selected && section === 'requests' && <RequestsTab projectId={selected} />}
          </div>
        </>
      )}
    </div>
  )
}
