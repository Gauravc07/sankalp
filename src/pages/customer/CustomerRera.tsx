import { useMyBooking } from '../../hooks/useMyBooking'
import { NoBookingState } from './NoBookingState'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusChip, statusTone } from '../../components/ui/StatusChip'

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  lapsed: 'Lapsed',
  expired: 'Expired',
  not_registered: 'Not yet registered',
}

export function CustomerRera() {
  const { booking, loading } = useMyBooking()

  if (loading) return <p className="text-neutral-400">Loading&hellip;</p>
  if (!booking) return <NoBookingState />

  const { project } = booking.unit.tower
  const status = project.rera_status ?? 'not_registered'

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-title-1 font-bold text-neutral-900">RERA profile</h1>
      <p className="mt-1 text-callout text-neutral-600">
        {project.builder.name}&rsquo;s registration for {project.name}, straight from the project record.
      </p>

      <Card className="mt-8 p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-footnote text-neutral-600">Registered promoter / builder</p>
            <p className="mt-1 font-display text-title-3 font-semibold text-neutral-900">{project.builder.name}</p>
          </div>
          <StatusChip tone={statusTone(status)} label={STATUS_LABEL[status] ?? status} />
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-footnote text-neutral-600">RERA registration number</dt>
            <dd className="mt-1 text-callout font-medium text-neutral-900">
              {project.rera_registration_number || 'Not available yet'}
            </dd>
          </div>
          <div>
            <dt className="text-footnote text-neutral-600">Registered project name</dt>
            <dd className="mt-1 text-callout font-medium text-neutral-900">
              {project.rera_registered_name || project.name}
            </dd>
          </div>
          <div>
            <dt className="text-footnote text-neutral-600">Valid till</dt>
            <dd className="mt-1 text-callout font-medium text-neutral-900">
              {project.rera_valid_till
                ? new Date(project.rera_valid_till).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Not available yet'}
            </dd>
          </div>
          <div>
            <dt className="text-footnote text-neutral-600">Project location</dt>
            <dd className="mt-1 text-callout font-medium text-neutral-900">{project.city || '—'}</dd>
          </div>
        </dl>

        {project.rera_certificate_url ? (
          <a href={project.rera_certificate_url} target="_blank" rel="noreferrer" className="mt-6 inline-block">
            <Button size="sm">View RERA certificate</Button>
          </a>
        ) : (
          <p className="mt-6 text-footnote text-neutral-400">
            Your builder hasn&rsquo;t uploaded a certificate link yet.
          </p>
        )}
      </Card>
    </div>
  )
}
