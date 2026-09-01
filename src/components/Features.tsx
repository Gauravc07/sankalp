import {
  Camera,
  Wallet,
  FileSignature,
  Bot,
  MessagesSquare,
  BellRing,
  type LucideIcon,
} from 'lucide-react'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'
import { SectionEyebrow } from './ui/Badge'

type Tile = 'blue' | 'green' | 'rose' | 'amber' | 'purple'

type Feature = {
  icon: LucideIcon
  title: string
  desc: string
  tag: string
  tile: Tile
}

const TILE_CLASSES: Record<Tile, string> = {
  blue: 'bg-tile-blue-bg text-tile-blue-fg',
  green: 'bg-tile-green-bg text-tile-green-fg',
  rose: 'bg-tile-rose-bg text-tile-rose-fg',
  amber: 'bg-tile-amber-bg text-tile-amber-fg',
  purple: 'bg-tile-purple-bg text-tile-purple-fg',
}

const FEATURES: Feature[] = [
  {
    icon: Camera,
    title: 'Construction transparency',
    desc: 'Geo-tagged, timestamped photos and video per slab. A committed-vs-actual schedule view means delays are visible, never hidden — and nothing reaches a buyer without PM approval.',
    tag: 'Site engineer → PM → buyer',
    tile: 'blue',
  },
  {
    icon: Wallet,
    title: 'Payments & financials',
    desc: 'Slab-wise schedules tied to the real agreement, auto GST/TDS breakdowns, and a downloadable digital ledger. Pay in-app via tokenized, PCI-DSS-compliant gateways — cards never touch our servers.',
    tag: 'Razorpay / Cashfree / PayU',
    tile: 'green',
  },
  {
    icon: FileSignature,
    title: 'Documents & e-sign',
    desc: 'Allotment letters, BBAs, RERA certificates and floor plans in one vault, with IT-Act-compliant e-signature and expiry reminders for time-bound documents like loan sanctions.',
    tag: 'Leegality / DocuSign India',
    tile: 'purple',
  },
  {
    icon: Bot,
    title: 'AI support, grounded in fact',
    desc: 'A RAG-based bot answers from live payment and construction data — it is built to refuse rather than guess a figure. Anger or repeated complaints escalate to a human, instantly, with full context.',
    tag: 'WhatsApp + in-app, same brain',
    tile: 'rose',
  },
  {
    icon: MessagesSquare,
    title: 'Verified buyer community',
    desc: 'A booking-ID-gated forum per project lets buyers compare notes and coordinate — moderated, never auto-deleted, and it carries forward into a post-possession neighbour directory.',
    tag: 'Pre- to post-possession',
    tile: 'amber',
  },
  {
    icon: BellRing,
    title: 'Notifications that reach you',
    desc: 'WhatsApp, email and push sent in parallel for anything critical, with SMS fallback and exponential-backoff retries. Every message deep-links back to the exact screen in-app.',
    tag: 'Nothing is WhatsApp-only',
    tile: 'blue',
  },
]

export function Features() {
  return (
    <section id="platform" className="relative py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>The platform</SectionEyebrow>
          <h2 className="font-display text-title-1 font-bold text-neutral-900">
            Everything a construction-to-customer journey needs
          </h2>
          <p className="mt-4 text-body text-neutral-600">
            Six systems that used to live in six disconnected tools, now sharing one data model.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.06}>
              <div className="group h-full rounded-lg border border-neutral-200 bg-neutral-0 p-7 transition duration-[var(--duration-fast)] hover:border-accent-500/30 hover:shadow-md">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TILE_CLASSES[feature.tile]}`}>
                  <feature.icon size={20} />
                </span>
                <h3 className="mt-5 font-display text-title-3 font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-callout leading-relaxed text-neutral-600">{feature.desc}</p>
                <p className="mt-4 text-footnote font-medium text-neutral-400">{feature.tag}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
