import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'
import { Button } from './ui/Button'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Status = 'idle' | 'loading' | 'success' | 'error'

const ROLES = [
  { value: 'builder_developer', label: "I'm a builder / developer" },
  { value: 'buyer', label: "I'm a buyer" },
  { value: 'channel_partner', label: "I'm a channel partner / broker" },
  { value: 'other', label: 'Other' },
]

export function Waitlist() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLES[0].value)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    if (!isSupabaseConfigured || !supabase) {
      setStatus('error')
      setErrorMsg('Signup is not connected yet — add Supabase credentials to .env.local.')
      return
    }

    const { error } = await supabase
      .from('waitlist_signups')
      .insert({ email: email.trim().toLowerCase(), role })

    if (error) {
      setStatus('error')
      setErrorMsg(
        error.code === '23505'
          ? "You're already on the list — we'll be in touch soon."
          : 'Something went wrong. Please try again in a moment.',
      )
      return
    }

    setStatus('success')
    setEmail('')
  }

  return (
    <section id="waitlist" className="relative py-28">
      <Container>
        <Reveal>
          <div className="rounded-lg border border-accent-500/20 bg-accent-100 px-6 py-16 text-center sm:px-16">
            <h2 className="font-display text-title-1 font-bold text-neutral-900">
              Bring your project onto one source of truth
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-body text-neutral-600">
              Join the builders and buyers on the early access list. We&rsquo;ll reach out to
              schedule a walkthrough tailored to your project.
            </p>

            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32 }}
                className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2.5 rounded-md border border-status-on-track/30 bg-status-on-track/12 px-5 py-4 text-callout font-medium text-status-on-track"
              >
                <CheckCircle2 size={18} />
                You&rsquo;re on the list — we&rsquo;ll be in touch soon.
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full flex-1 rounded-md border border-neutral-200 bg-neutral-0 px-5 py-3.5 text-body text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-accent-500"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-md border border-neutral-200 bg-neutral-0 px-4 py-3.5 text-body text-neutral-600 outline-none transition focus:border-accent-500 sm:w-auto"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={status === 'loading'} className="whitespace-nowrap">
                  {status === 'loading' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Join waitlist
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </form>
            )}

            {status === 'error' && (
              <p className="mt-3 text-callout text-status-overdue">{errorMsg}</p>
            )}

            <p className="mt-6 text-footnote text-neutral-400">
              No spam. Just a note when we&rsquo;re ready to onboard your project.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
