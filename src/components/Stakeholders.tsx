import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home,
  HardHat,
  Headset,
  Users,
  ShieldCheck,
  Handshake,
  type LucideIcon,
} from 'lucide-react'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'
import { SectionEyebrow } from './ui/Badge'

type Role = {
  key: string
  icon: LucideIcon
  title: string
  who: string
  points: string[]
}

const ROLES: Role[] = [
  {
    key: 'buyer',
    icon: Home,
    title: 'Buyer',
    who: 'The flat owner',
    points: [
      'Slab-wise payment schedule with auto GST/TDS breakdown',
      'Geo-tagged construction photos & videos, milestone by milestone',
      'Document vault with e-signed agreements',
      'AI chat first, human support second — never stuck in a queue',
    ],
  },
  {
    key: 'site',
    icon: HardHat,
    title: 'Site Engineer',
    who: 'On-ground construction staff',
    points: [
      'Offline-first capture — uploads queue and sync when back online',
      'In-app camera embeds timestamp + GPS, no backdated photos',
      'Daily progress reports auto-compiled for PM approval',
      'Delay & material flags routed instantly to the project manager',
    ],
  },
  {
    key: 'sales',
    icon: Handshake,
    title: 'Sales & Channel Partners',
    who: "Builder's RM team & brokers",
    points: [
      'AI lead scoring across portals, site visits & referrals',
      'Digital booking flow — cost sheet to e-signed allotment',
      'Live inventory & brokerage payout tracking for partners',
      'WhatsApp campaign automation on Meta-approved templates',
    ],
  },
  {
    key: 'support',
    icon: Headset,
    title: 'Support Team',
    who: 'L1/L2 customer care',
    points: [
      'Unified queue from bot escalations, forms & WhatsApp',
      'Full customer context — never ask "which unit is this?"',
      'SLA timers with auto-escalation on breach',
      'Canned responses, editable per builder',
    ],
  },
  {
    key: 'admin',
    icon: Users,
    title: 'Builder Admin',
    who: "Developer's management",
    points: [
      'Cross-project, cross-city portfolio dashboard',
      'Escrow reconciliation against the RERA 70% rule',
      'Full audit trail on every customer-facing update',
      'Financial reporting: collections vs. schedule, overruns',
    ],
  },
  {
    key: 'compliance',
    icon: ShieldCheck,
    title: 'Compliance Officer',
    who: "Builder's legal/RERA team",
    points: [
      'Quarterly RERA filing drafts auto-generated from live data',
      'Deadline reminders 60 days out — missed filings become hard to miss',
      'RERA Forms 1/2/3 as a query, not a re-entry exercise',
      'Immutable audit log, retained per regulatory requirement',
    ],
  },
]

export function Stakeholders() {
  const [active, setActive] = useState(ROLES[0].key)
  const activeRole = ROLES.find((r) => r.key === active) ?? ROLES[0]

  return (
    <section id="stakeholders" className="relative py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>One platform, every role</SectionEyebrow>
          <h2 className="font-display text-title-1 font-bold text-neutral-900">
            Built for the whole project, not just the buyer
          </h2>
          <p className="mt-4 text-body text-neutral-600">
            Role-based access is the foundation, not an afterthought &mdash; every screen, API and
            notification is scoped to who&rsquo;s asking.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-wrap justify-center gap-2">
            {ROLES.map((role) => {
              const Icon = role.icon
              const isActive = role.key === active
              return (
                <button
                  key={role.key}
                  onClick={() => setActive(role.key)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-callout font-medium transition ${
                    isActive
                      ? 'border-accent-500/40 bg-accent-100 text-accent-600'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  <Icon size={15} />
                  {role.title}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="mx-auto mt-8 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-0 p-8 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent-500 text-white">
                  <activeRole.icon size={20} />
                </span>
                <div>
                  <p className="font-display text-title-3 font-semibold text-neutral-900">{activeRole.title}</p>
                  <p className="text-footnote text-neutral-600">{activeRole.who}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {activeRole.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-callout leading-relaxed text-neutral-600"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </Reveal>
      </Container>
    </section>
  )
}
