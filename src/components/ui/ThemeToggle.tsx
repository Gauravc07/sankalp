import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type ThemePreference } from '../../context/ThemeContext'

const OPTIONS: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-50 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setPreference(opt.value)}
          aria-label={`${opt.label} theme`}
          aria-pressed={preference === opt.value}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
            preference === opt.value
              ? 'bg-neutral-0 text-accent-600 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <opt.icon size={14} strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}
