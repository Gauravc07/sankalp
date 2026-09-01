import { Link, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../lib/auth'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { Logo } from '../../components/ui/Logo'

export function StaffLayout() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-neutral-0">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/staff" className="flex items-center gap-2.5 font-display text-title-3 font-bold text-neutral-900">
            <Logo />
            Sankalp <span className="ml-1 text-footnote font-normal text-neutral-400">Site visits</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-callout text-neutral-600">{profile?.full_name}</span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 py-1.5 text-caption font-medium text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-900"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
