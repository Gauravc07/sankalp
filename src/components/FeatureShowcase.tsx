import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HardHat, Wallet, FileText, Bot, Check } from 'lucide-react'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'
import { SectionEyebrow } from './ui/Badge'
import { Card } from './ui/Card'
import { StatusChip } from './ui/StatusChip'
import { ProgressBar } from './ui/ProgressBar'

type Tab = {
  key: string
  label: string
  icon: typeof HardHat
  title: string
  desc: string
  bullets: string[]
  panel: 'construction' | 'payments' | 'documents' | 'support'
}

const TABS: Tab[] = [
  {
    key: 'construction',
    label: 'Construction Progress',
    icon: HardHat,
    title: 'Every slab, verified before it reaches a buyer',
    desc: 'Site engineers upload geo-tagged photos per milestone; a project manager signs off before anything goes live to the customer app.',
    bullets: ['Committed vs. actual schedule', 'Geo-tagged, timestamped photos', 'PM approval before publish'],
    panel: 'construction',
  },
  {
    key: 'payments',
    label: 'Payments & Financials',
    icon: Wallet,
    title: 'Slab-wise dues, GST/TDS handled automatically',
    desc: 'Payment schedules map to the actual agreement, with tokenized in-app collection so no card data ever touches our servers.',
    bullets: ['Auto GST/TDS breakup', 'Razorpay, Cashfree, PayU', 'Downloadable digital ledger'],
    panel: 'payments',
  },
  {
    key: 'documents',
    label: 'Documents & Compliance',
    icon: FileText,
    title: 'RERA, approvals and agreements in one vault',
    desc: 'Allotment letters, BBAs, RERA certificates and NOCs live in one place, with e-signature and expiry reminders built in.',
    bullets: ['RERA-native document model', 'IT-Act-compliant e-sign', 'Expiry & renewal reminders'],
    panel: 'documents',
  },
  {
    key: 'support',
    label: 'AI Support',
    icon: Bot,
    title: 'Grounded answers, escalated when it matters',
    desc: 'A RAG-based bot answers from live payment and construction data, refusing to guess — and hands off to a human on real urgency.',
    bullets: ['Answers grounded in real data', 'WhatsApp + in-app, same brain', 'Instant human escalation'],
    panel: 'support',
  },
]

export function FeatureShowcase() {
  const [active, setActive] = useState(0)
  const tab = TABS[active]

  return (
    <section className="relative py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>See it in action</SectionEyebrow>
          <h2 className="font-display text-title-1 font-bold text-neutral-900">One platform, every part of the journey</h2>
          <p className="mt-4 text-body text-neutral-600">
            Switch between the systems your buyers and your team touch every day.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-callout font-semibold transition duration-[var(--duration-fast)] ${
                i === active
                  ? 'bg-accent-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <h3 className="font-display text-title-2 font-semibold text-neutral-900">{tab.title}</h3>
              <p className="mt-3 text-body text-neutral-600">{tab.desc}</p>
              <ul className="mt-6 flex flex-col gap-3">
                {tab.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-callout font-medium text-neutral-900">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tile-green-bg text-tile-green-fg">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab.panel}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <ShowcasePanel panel={tab.panel} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  )
}

function ShowcasePanel({ panel }: { panel: Tab['panel'] }) {
  if (panel === 'construction') {
    return (
      <Card className="p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <p className="font-display text-callout font-semibold text-neutral-900">Tower B &middot; Floor 14 slab</p>
          <StatusChip tone="onTrack" label="On schedule" />
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-title-1 font-bold text-neutral-900 tabular-nums">68%</span>
            <span className="text-footnote text-neutral-600">of Tower B complete</span>
          </div>
          <ProgressBar percent={68} tone="onTrack" showLabel={false} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {['Foundation', 'Slab 9', 'Slab 14'].map((label, i) => (
            <div key={label} className="rounded-md bg-tile-blue-bg p-3 text-center">
              <p className="text-caption font-semibold text-tile-blue-fg">{label}</p>
              <p className="mt-1 text-footnote font-bold text-neutral-900">{i < 2 ? 'Done' : 'In progress'}</p>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (panel === 'payments') {
    return (
      <Card className="p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <p className="font-display text-callout font-semibold text-neutral-900">Payment schedule</p>
          <span className="rounded-full bg-tile-amber-bg px-3 py-1 text-caption font-bold text-tile-amber-fg uppercase">Slab 9 due</span>
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          {[
            { label: 'Foundation', amount: '₹8,10,000', status: 'Paid' },
            { label: 'Slab 5', amount: '₹4,86,000', status: 'Paid' },
            { label: 'Slab 9', amount: '₹4,86,000', status: 'Due in 3 days' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-md bg-neutral-50 px-3.5 py-2.5">
              <span className="text-callout font-medium text-neutral-900">{row.label}</span>
              <span className="text-footnote font-semibold text-neutral-900 tabular-nums">{row.amount}</span>
              <span className={`text-caption font-bold ${row.status === 'Paid' ? 'text-status-on-track' : 'text-status-attention'}`}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (panel === 'documents') {
    return (
      <Card className="p-6 shadow-lg">
        <p className="font-display text-callout font-semibold text-neutral-900">Document vault</p>
        <div className="mt-5 flex flex-col gap-2.5">
          {[
            { label: 'RERA Certificate', tile: 'bg-tile-purple-bg text-tile-purple-fg' },
            { label: 'Builder-Buyer Agreement', tile: 'bg-tile-blue-bg text-tile-blue-fg' },
            { label: 'Allotment Letter', tile: 'bg-tile-rose-bg text-tile-rose-fg' },
          ].map((doc) => (
            <div key={doc.label} className="flex items-center gap-3 rounded-md bg-neutral-50 px-3.5 py-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${doc.tile}`}>
                <FileText size={16} />
              </span>
              <span className="text-callout font-medium text-neutral-900">{doc.label}</span>
              <span className="ml-auto text-caption font-bold text-status-on-track uppercase">Verified</span>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-status-on-track" />
        <p className="font-display text-callout font-semibold text-neutral-900">AI support &middot; live</p>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <div className="ml-auto max-w-[80%] rounded-lg bg-accent-500 px-4 py-2.5 text-callout text-white">
          When is my next payment due?
        </div>
        <div className="max-w-[85%] rounded-lg bg-neutral-50 px-4 py-2.5 text-callout text-neutral-900">
          Your Slab 9 installment of ₹4,86,000 is due on 2 Aug. Last payment of ₹4,86,000 was received 12 Jun.
        </div>
        <div className="max-w-[85%] rounded-lg bg-neutral-50 px-4 py-2.5 text-callout text-neutral-900">
          Want a reminder 2 days before?
        </div>
      </div>
    </Card>
  )
}
