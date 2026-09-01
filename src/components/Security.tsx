import { Lock, ShieldCheck, ScrollText, MapPin, KeyRound, FileCheck2 } from 'lucide-react'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'
import { SectionEyebrow } from './ui/Badge'

const POINTS = [
  {
    icon: Lock,
    title: 'Encrypted end-to-end',
    desc: 'AES-256 at rest, TLS 1.3 in transit, no exceptions. Card and UPI data never touch our servers — only tokenized references from PCI-DSS Level 1 gateways.',
  },
  {
    icon: ShieldCheck,
    title: 'RBAC & tenant isolation',
    desc: 'Every API checks role, tenant and resource ownership. Cross-tenant data leaks are tested continuously, not just at launch.',
  },
  {
    icon: ScrollText,
    title: 'DPDP Act, 2023 aligned',
    desc: 'Granular per-channel consent, immediate opt-out honoring, and a documented data-breach and retention/deletion runbook.',
  },
  {
    icon: FileCheck2,
    title: 'RERA-native compliance',
    desc: 'Forms 1, 2 & 3 fields are structured into the data model from day one, so quarterly filing is a query, not a re-entry exercise.',
  },
  {
    icon: MapPin,
    title: 'India data residency',
    desc: 'Hosted in AWS ap-south-1 (Mumbai) for both latency and compliance posture on financial and personal data.',
  },
  {
    icon: KeyRound,
    title: 'MFA & audit trails',
    desc: 'Mandatory MFA for Admin, Compliance and Super Admin roles. Every approval and payment is logged to an immutable, append-only trail.',
  },
]

export function Security() {
  return (
    <section id="security" className="relative bg-neutral-0 py-28">
      <Container className="relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Security & compliance</SectionEyebrow>
          <h2 className="font-display text-title-1 font-bold text-neutral-900">
            Production-grade from the first line of code
          </h2>
          <p className="mt-4 text-body text-neutral-600">
            A platform handling escrow, KYC and legal documents doesn&rsquo;t get a security pass
            later &mdash; it&rsquo;s cross-cutting from day one.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.06}>
              <div className="h-full rounded-lg border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-status-info/12 text-status-info">
                  <point.icon size={18} />
                </span>
                <h3 className="mt-4 font-display text-callout font-semibold text-neutral-900">
                  {point.title}
                </h3>
                <p className="mt-2 text-callout leading-relaxed text-neutral-600">{point.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
