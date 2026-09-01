import { HardHat } from 'lucide-react'
import { useMyTeamMembership } from '../../hooks/useMyTeamMembership'
import { useBuilderProjects } from '../../hooks/useBuilderProjects'
import { ConstructionTab } from '../builder/tabs/ConstructionTab'

export function SiteEngineerDashboard() {
  const { membership, loading: membershipLoading } = useMyTeamMembership()
  const { projects, selected, setSelected, loading: projectsLoading } = useBuilderProjects(membership?.builderId)

  if (membershipLoading || projectsLoading) return <p className="text-neutral-400">Loading&hellip;</p>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2">
        <HardHat size={18} className="text-neutral-400" />
        <h1 className="font-display text-title-1 font-bold text-neutral-900">Construction updates</h1>
      </div>
      <p className="mt-1 text-callout text-neutral-600">Log milestones, drawings, quality checks, and material use for {membership?.builderName}&rsquo;s projects.</p>

      {projects.length === 0 ? (
        <p className="mt-6 text-callout text-neutral-400">No projects to update yet.</p>
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

          <div className="mt-6">{selected && <ConstructionTab projectId={selected} />}</div>
        </>
      )}
    </div>
  )
}
