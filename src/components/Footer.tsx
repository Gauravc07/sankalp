import { Blocks, Globe, X as XIcon, Mail } from 'lucide-react'
import { Container } from './ui/Container'

const COLUMNS = [
  {
    title: 'Platform',
    links: ['Construction transparency', 'Payments & financials', 'Documents & e-sign', 'AI support bot'],
  },
  {
    title: 'Roles',
    links: ['Buyers', 'Site engineers', 'Sales & brokers', 'Builder admins'],
  },
  {
    title: 'Company',
    links: ['Security', 'Compliance', 'Contact', 'Request a demo'],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 py-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <a href="#top" className="flex items-center gap-2.5 font-display text-title-3 font-bold text-neutral-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-500 text-white">
                <Blocks size={18} strokeWidth={2.5} />
              </span>
              Sankalp
            </a>
            <p className="mt-4 max-w-xs text-callout leading-relaxed text-neutral-600">
              The unified construction-to-customer platform for Indian real estate &mdash; one
              source of truth from foundation to possession.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#top"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                aria-label="Website"
              >
                <Globe size={15} />
              </a>
              <a
                href="#top"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                aria-label="X (Twitter)"
              >
                <XIcon size={15} />
              </a>
              <a
                href="mailto:hello@sankalp.app"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
                aria-label="Email"
              >
                <Mail size={15} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#top"
                        className="text-callout text-neutral-600 transition hover:text-neutral-900"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 text-footnote text-neutral-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Sankalp. Built for Indian real estate.</p>
          <div className="flex items-center gap-6">
            <a href="#top" className="transition hover:text-neutral-600">Privacy policy</a>
            <a href="#top" className="transition hover:text-neutral-600">Terms of service</a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
