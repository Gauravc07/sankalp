import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'

export function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function handleClick(id: string, link: string | null) {
    markRead(id)
    setOpen(false)
    if (link) navigate(link)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:text-neutral-900"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-attention px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-0 p-2 shadow-lg">
            {notifications.length === 0 && (
              <p className="p-4 text-center text-callout text-neutral-400">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n.id, n.link)}
                className={`block w-full rounded-md p-3 text-left transition hover:bg-neutral-50 ${
                  !n.read_at ? 'bg-accent-100/40' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read_at && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />}
                  <div>
                    <p className="text-callout text-neutral-900">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-footnote text-neutral-600">{n.body}</p>}
                    <p className="mt-1 text-caption text-neutral-400">
                      {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
