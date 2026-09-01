import { ArrowRight, X, Check } from 'lucide-react'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'
import { SectionEyebrow } from './ui/Badge'

export function Gap() {
  return (
    <section className="relative py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>The gap nobody closed</SectionEyebrow>
          <h2 className="font-display text-title-1 font-bold text-neutral-900">
            Two disconnected camps. Buyers stuck in the middle.
          </h2>
          <p className="mt-4 text-body text-neutral-600">
            Pre-possession CRM tools track leads and payments. Post-possession society apps
            manage amenities and gate security. Nobody bridges construction, payments and
            buyer community <em>during</em> the build &mdash; until now.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <Reveal delay={0.05}>
            <div className="h-full rounded-lg border border-neutral-200 bg-neutral-0 p-7">
              <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
                Pre-possession CRMs
              </p>
              <p className="mt-1 text-callout text-neutral-400">Sell.Do, LeadSquared, DaeBuild&hellip;</p>
              <ul className="mt-5 space-y-3">
                {['Leads & bookings', 'Payment schedules', 'No community, no post-handover'].map((t, i) => (
                  <li key={t} className="flex items-start gap-2.5 text-callout text-neutral-600">
                    {i === 2 ? (
                      <X size={16} className="mt-0.5 shrink-0 text-status-overdue" />
                    ) : (
                      <Check size={16} className="mt-0.5 shrink-0 text-neutral-400" />
                    )}
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="relative">
            <div className="relative h-full overflow-hidden rounded-lg border border-accent-500/30 bg-accent-100 p-7">
              <div className="absolute top-0 right-0 rounded-bl-md bg-accent-500 px-3 py-1 text-caption font-bold text-white">
                Sankalp
              </div>
              <p className="text-caption font-semibold tracking-[0.02em] text-accent-600 uppercase">
                One unified platform
              </p>
              <p className="mt-1 text-callout text-neutral-600">Construction + payments + community + AI</p>
              <ul className="mt-5 space-y-3">
                {[
                  'Live construction transparency, slab by slab',
                  'Payments, GST/TDS, e-sign, all in one ledger',
                  'Verified-buyer community from booking to move-in',
                  'AI-first support: WhatsApp + in-app, day one',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-callout text-neutral-900">
                    <Check size={16} className="mt-0.5 shrink-0 text-accent-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="h-full rounded-lg border border-neutral-200 bg-neutral-0 p-7">
              <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
                Post-possession ERPs
              </p>
              <p className="mt-1 text-callout text-neutral-400">MyGate, NoBrokerHood, ADDA&hellip;</p>
              <ul className="mt-5 space-y-3">
                {['Visitor & gate management', 'Society billing', 'Nothing before handover'].map((t, i) => (
                  <li key={t} className="flex items-start gap-2.5 text-callout text-neutral-600">
                    {i === 2 ? (
                      <X size={16} className="mt-0.5 shrink-0 text-status-overdue" />
                    ) : (
                      <Check size={16} className="mt-0.5 shrink-0 text-neutral-400" />
                    )}
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3} className="mt-10 flex justify-center">
          <a
            href="#stakeholders"
            className="inline-flex items-center gap-2 text-callout font-medium text-neutral-600 transition hover:text-neutral-900"
          >
            See how every stakeholder fits together
            <ArrowRight size={15} />
          </a>
        </Reveal>
      </Container>
    </section>
  )
}
