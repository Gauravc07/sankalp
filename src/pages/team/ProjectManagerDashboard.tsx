import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useMyTeamMembership } from '../../hooks/useMyTeamMembership'
import { useBuilderProjects } from '../../hooks/useBuilderProjects'
import { UnitsTab } from '../builder/tabs/UnitsTab'
import { ConstructionTab } from '../builder/tabs/ConstructionTab'
import { ComplianceTab } from '../builder/tabs/ComplianceTab'
import { SalesTab } from '../builder/tabs/SalesTab'
import { RequestsTab } from '../builder/tabs/RequestsTab'

const TABS = [
  { key: 'units', label: 'Towers & units' },
  { key: 'construction', label: 'Construction' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'sales', label: 'Sales' },
  { key: 'requests', label: 'Requests' },
] as const
type TabKey = (typeof TABS)[number]['key']

export function ProjectManagerDashboard() {
  const { membership, loading: membershipLoading } = useMyTeamMembership()
  const { projects, selected, setSelected, loading: projectsLoading } = useBuilderProjects(membership?.builderId)
  const [tab, setTab] = useState<TabKey>('units')

  if (membershipLoading || projectsLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2">
        <ClipboardList size={18} className="text-neutral-400" />
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Project oversight</h1>
      </div>
      <p className="mt-1 text-callout text-neutral-600">Full operational view across {membership?.builderName}&rsquo;s projects.</p>

      {projects.length === 0 ? (
        <p className="mt-6 text-callout text-neutral-400">No projects yet.</p>
      ) : (
        <>
          <label className="mt-6 block max-w-xs">
            <span className="mb-1 block text-footnote font-medium text-neutral-600">Project</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.city ? `(${p.city})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 flex flex-wrap gap-1 border-b border-neutral-200">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-t-md px-3.5 py-2 text-callout font-medium transition ${
                  tab === t.key ? 'border-b-2 border-accent-500 text-accent-600' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {selected && tab === 'units' && <UnitsTab projectId={selected} />}
            {selected && tab === 'construction' && <ConstructionTab projectId={selected} />}
            {selected && tab === 'compliance' && <ComplianceTab projectId={selected} />}
            {selected && tab === 'sales' && <SalesTab projectId={selected} />}
            {selected && tab === 'requests' && <RequestsTab projectId={selected} />}
          </div>
        </>
      )}
    </div>
  )
}
