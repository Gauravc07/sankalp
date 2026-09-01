import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Container } from './ui/Container'
import { ThemeToggle } from './ui/ThemeToggle'
import { Logo } from './ui/Logo'

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'For every stakeholder', href: '#stakeholders' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-accent-600 py-2 text-center text-footnote font-medium text-white">
        Now onboarding builder partners in Mumbai, Pune &amp; Bengaluru &mdash; RERA-ready from day one.
      </div>

      <motion.nav
        initial={false}
        animate={{
          backgroundColor: scrolled ? 'color-mix(in srgb, var(--color-neutral-0) 80%, transparent)' : 'rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.3 }}
        className={`border-b backdrop-blur-xl ${scrolled ? 'border-neutral-200' : 'border-transparent'}`}
      >
        <Container className="flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 font-display text-title-3 font-bold text-neutral-900">
            <Logo />
            Sankalp
          </a>

          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-callout font-medium text-neutral-600 transition hover:text-neutral-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <ThemeToggle />
            <Link to="/login" className="text-callout font-medium text-neutral-600 transition hover:text-neutral-900">
              Sign in
            </Link>
            <a
              href="#waitlist"
              className="group inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-4 py-2 text-callout font-semibold text-white transition duration-[var(--duration-fast)] active:scale-[0.97] hover:bg-accent-600"
            >
              Request a demo
              <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
            </a>
          </div>

          <button
            className="grid h-9 w-9 place-items-center rounded-md border border-neutral-200 text-neutral-900 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </Container>

        {open && (
          <div className="border-t border-neutral-200 bg-neutral-0 lg:hidden">
            <Container className="flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-callout font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-callout font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              >
                Sign in
              </Link>
              <a
                href="#waitlist"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-md bg-accent-500 px-4 py-2.5 text-center text-callout font-semibold text-white"
              >
                Request a demo
              </a>
              <div className="mt-2 flex justify-center">
                <ThemeToggle />
              </div>
            </Container>
          </div>
        )}
      </motion.nav>
    </header>
  )
}
