import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  HardHat,
  ShieldCheck,
  FileCheck2,
  Wallet,
  FolderOpen,
  MessageSquare,
  LifeBuoy,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../lib/auth'
import { useMyBooking } from '../../hooks/useMyBooking'
import { NotificationBell } from '../../components/NotificationBell'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { Logo } from '../../components/ui/Logo'

const NAV = [
  { to: '/customer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/customer/construction', label: 'Construction', icon: HardHat },
  { to: '/customer/payments', label: 'Payments', icon: Wallet },
  { to: '/customer/documents', label: 'Documents', icon: FolderOpen },
  { to: '/customer/compliance', label: 'Compliance', icon: FileCheck2 },
  { to: '/customer/rera', label: 'RERA profile', icon: ShieldCheck },
]

const HELP_NAV = [
  { to: '/customer/requests', label: 'Requests', icon: MessageSquare },
  { to: '/customer/support', label: 'Support', icon: LifeBuoy },
]

export function CustomerLayout() {
  const { profile } = useAuth()
  const { booking } = useMyBooking()

  return (
    <div className="flex min-h-screen bg-neutral-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 px-5 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2 font-display text-title-3 font-bold text-neutral-900">
          <Logo />
          Sankalp
        </div>

        {booking && (
          <div className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-3">
            <p className="text-footnote text-neutral-600">{booking.unit.tower.project.name}</p>
            <p className="text-callout font-semibold text-neutral-900">
              {booking.unit.tower.name} &middot; {booking.unit.unit_number}
            </p>
          </div>
        )}

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-callout font-medium transition ${
                  isActive ? 'bg-accent-100 text-accent-600' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}

          <p className="mt-4 mb-1 px-3 text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Help</p>
          {HELP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-callout font-medium transition ${
                  isActive ? 'bg-accent-100 text-accent-600' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between px-3">
            <p className="truncate text-footnote text-neutral-400">{profile?.full_name || 'Buyer'}</p>
            <ThemeToggle />
          </div>
          <button
            onClick={() => signOut()}
            className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-callout font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex justify-end border-b border-neutral-200 px-5 py-3 lg:px-10">
          <NotificationBell />
        </div>
        <main className="px-5 py-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
