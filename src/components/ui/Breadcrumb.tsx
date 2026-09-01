import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { Container } from './Container'

export function Breadcrumb({ items, className }: { items: string[]; className?: string }) {
  return (
    <div className={clsx('border-b border-neutral-200 bg-neutral-0 py-2.5', className)}>
      <Container>
        <div className="flex items-center gap-1.5 text-caption text-neutral-400">
          {items.map((item, i) => (
            <span key={item} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={11} />}
              <span className={i === items.length - 1 ? 'font-medium text-neutral-600' : ''}>{item}</span>
            </span>
          ))}
        </div>
      </Container>
    </div>
  )
}
