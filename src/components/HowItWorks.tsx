import { motion } from 'framer-motion'
import { HardHat, ClipboardCheck, BellRing, MessageCircleQuestion, CheckCircle2 } from 'lucide-react'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'
import { SectionEyebrow } from './ui/Badge'

const STEPS = [
  {
    icon: HardHat,
    title: 'Site engineer uploads',
    desc: 'Slab photo & milestone status, captured in-app with embedded GPS + timestamp. Queued instantly if offline.',
  },
  {
    icon: ClipboardCheck,
    title: 'Project manager approves',
    desc: 'Nothing reaches a customer unverified — the PM signs off, or sends it back with a comment.',
  },
  {
    icon: BellRing,
    title: 'Customer is notified',
    desc: 'Push, WhatsApp and email fire in parallel, each deep-linking straight to the update.',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Customer can ask, instantly',
    desc: 'A question on that exact update goes to the AI bot first — grounded in their real data.',
  },
  {
    icon: CheckCircle2,
    title: 'Resolved or escalated',
    desc: 'Simple queries close instantly. Anything urgent or complex reaches a human, with full context, on an SLA clock.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="font-display text-title-1 font-bold text-neutral-900">
            From trowel to notification in one approved flow
          </h2>
          <p className="mt-4 text-body text-neutral-600">
            One design rule underpins the whole loop: nothing customer-facing skips human approval.
          </p>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute top-6 right-0 left-0 hidden h-px bg-neutral-200 lg:block" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.2, 0, 0, 1] }}
            style={{ transformOrigin: 'left' }}
            className="absolute top-6 right-0 left-0 hidden h-px bg-accent-500 lg:block"
          />

          <div className="grid gap-10 lg:grid-cols-5 lg:gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.12} className="relative text-center lg:text-left">
                <span className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent-500/30 bg-neutral-0 text-accent-600 lg:mx-0">
                  <step.icon size={20} />
                </span>
                <p className="mt-5 font-display text-callout font-semibold text-neutral-900">{step.title}</p>
                <p className="mt-2 text-callout leading-relaxed text-neutral-600">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
