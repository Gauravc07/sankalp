import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { SetupTab } from './tabs/SetupTab'
import { UnitsTab } from './tabs/UnitsTab'
import { SalesTab } from './tabs/SalesTab'
import { ConstructionTab } from './tabs/ConstructionTab'
import { ComplianceTab } from './tabs/ComplianceTab'
import { VendorPOsTab } from './tabs/VendorPOsTab'
import { ContractorWOsTab } from './tabs/ContractorWOsTab'
import { RequestsTab } from './tabs/RequestsTab'
import { SiteVisitsTab } from './tabs/SiteVisitsTab'
import { ContactsTab } from './tabs/ContactsTab'

export type ProjectRow = {
  id: string
  builder_id: string
  name: string
  city: string | null
  address: string | null
  map_embed_url: string | null
  rera_registration_number: string | null
  rera_registered_name: string | null
  rera_status: string
  rera_certificate_url: string | null
  rera_valid_till: string | null
}

const TABS = [
  { key: 'setup', label: 'Setup & RERA' },
  { key: 'units', label: 'Towers & units' },
  { key: 'sales', label: 'Sales' },
  { key: 'construction', label: 'Construction' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'vendors', label: 'Vendor POs' },
  { key: 'contractors', label: 'Work orders' },
  { key: 'requests', label: 'Requests' },
  { key: 'visits', label: 'Site visits' },
  { key: 'contacts', label: 'Contacts' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function BuilderProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<ProjectRow | null>(null)
  const [tab, setTab] = useState<TabKey>('setup')
  const [loading, setLoading] = useState(true)

  async function loadProject() {
    if (!projectId || !supabase) return
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
    setProject(data as ProjectRow | null)
    setLoading(false)
  }

  useEffect(() => {
    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!project) return <p className="text-neutral-400">Project not found.</p>

  return (
    <div>
      <Link to="/builder" className="flex items-center gap-1.5 text-footnote font-medium text-neutral-400 hover:text-neutral-900">
        <ArrowLeft size={13} />
        All projects
      </Link>
      <h1 className="mt-3 font-display text-title-1 font-bold text-neutral-900">{project.name}</h1>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-callout font-medium transition ${
              tab === t.key ? 'border-accent-500 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'setup' && <SetupTab project={project} onSaved={loadProject} />}
        {tab === 'units' && <UnitsTab projectId={project.id} />}
        {tab === 'sales' && <SalesTab projectId={project.id} />}
        {tab === 'construction' && <ConstructionTab projectId={project.id} />}
        {tab === 'compliance' && <ComplianceTab projectId={project.id} />}
        {tab === 'vendors' && <VendorPOsTab builderId={project.builder_id} projectId={project.id} />}
        {tab === 'contractors' && <ContractorWOsTab builderId={project.builder_id} projectId={project.id} />}
        {tab === 'requests' && <RequestsTab projectId={project.id} />}
        {tab === 'visits' && <SiteVisitsTab projectId={project.id} builderId={project.builder_id} />}
        {tab === 'contacts' && <ContactsTab projectId={project.id} />}
      </div>
    </div>
  )
}
