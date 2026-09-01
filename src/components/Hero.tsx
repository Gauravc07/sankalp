import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Users2, HardHat, Wallet, ShieldCheck, Check } from 'lucide-react'
import { Container } from './ui/Container'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { StatusChip } from './ui/StatusChip'
import { ProgressBar } from './ui/ProgressBar'

const CHECK_PILLS = ['Live Site Tracking', 'Slab-wise Payments', 'RERA Compliant', 'AI Support Built-in']

const SIDE_ITEMS = [
  { icon: HardHat, label: 'Live Construction Tracking' },
  { icon: Wallet, label: 'Slab-wise Payment Cycle' },
  { icon: ShieldCheck, label: 'RERA & Compliance in One Place' },
]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-16 pb-24 lg:pt-20 lg:pb-32">
      <Container className="relative grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent-500/25 bg-accent-100 px-4 py-1.5 text-caption font-bold text-accent-600 uppercase"
          >
            <span className="flex -space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            </span>
            Built for Indian Real Estate Developers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.05 }}
            className="mt-5 font-display text-title-1 leading-[1.08] font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-display"
          >
            Construction-to-Customer <span className="text-accent-500">Platform</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.1 }}
            className="mt-6 max-w-xl text-body text-neutral-600"
          >
            Give every buyer live site progress, a transparent payment cycle, and RERA-ready
            documents in one app &mdash; while your team manages sales, vendors, and contractors
            from the same platform. Start free and see your first project live today.
          </motion.p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {CHECK_PILLS.map((pill) => (
              <span
                key={pill}
                className="flex items-center gap-1.5 rounded-full bg-tile-green-bg px-3.5 py-1.5 text-footnote font-semibold text-tile-green-fg"
              >
                <Check size={13} strokeWidth={3} />
                {pill}
              </span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.15 }}
            className="mt-8"
          >
            <a href="#waitlist">
              <Button size="md">
                Request a Demo
                <ArrowRight size={16} />
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32, delay: 0.25 }}
            className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-footnote font-medium text-neutral-600"
          >
            <span className="flex items-center gap-1.5">
              <Users2 size={14} className="text-accent-500" /> Built for Indian Developers
            </span>
            <span className="text-neutral-200">|</span>
            <span>Works with Your Existing CRM</span>
            <span className="text-neutral-200">|</span>
            <span>Free to Start</span>
          </motion.div>
        </div>

        <HeroVisual />
      </Container>
    </section>
  )
}

function HeroVisual() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex items-center gap-6">
      <motion.div
        initial={{ opacity: 0, x: reduceMotion ? 0 : -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="hidden shrink-0 flex-col gap-6 sm:flex"
      >
        {SIDE_ITEMS.map((item, i) => (
          <div key={item.label} className="flex flex-col items-center gap-2 text-center">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                ['bg-tile-blue-bg text-tile-blue-fg', 'bg-tile-rose-bg text-tile-rose-fg', 'bg-tile-amber-bg text-tile-amber-fg'][i]
              }`}
            >
              <item.icon size={24} />
            </span>
            <p className="max-w-[6.5rem] text-caption font-semibold text-neutral-600">{item.label}</p>
            {i < SIDE_ITEMS.length - 1 && <span className="h-6 w-px bg-neutral-200" />}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="relative mx-auto w-full max-w-sm"
      >
        <Card className="relative p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <p className="text-footnote text-neutral-600">Tower B &middot; Unit 1204</p>
              <p className="font-display text-callout font-semibold text-neutral-900">Construction progress</p>
            </div>
            <StatusChip tone="onTrack" label="On schedule" />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-title-1 font-bold text-neutral-900 tabular-nums">68%</span>
              <span className="text-footnote text-neutral-600">14th floor slab &middot; today</span>
            </div>
            <ProgressBar percent={68} tone="onTrack" showLabel={false} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-caption text-neutral-600 uppercase">Next payment</p>
              <p className="mt-1 text-callout font-semibold text-neutral-900 tabular-nums">₹4,86,000</p>
              <p className="text-caption text-status-attention">Due in 3 days</p>
            </div>
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-caption text-neutral-600 uppercase">Open queries</p>
              <p className="mt-1 text-callout font-semibold text-neutral-900">0 pending</p>
              <p className="text-caption text-status-on-track">All resolved</p>
            </div>
          </div>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-4"
        >
          <Card className="flex items-center gap-3 p-3.5 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
              <ShieldCheck size={16} />
            </span>
            <p className="text-footnote leading-snug text-neutral-900">
              "Slab 9 installment of ₹4.86L due in 3 days." &mdash; sent via WhatsApp
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
