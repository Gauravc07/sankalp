import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

export function Counter({
  to,
  suffix = '',
  prefix = '',
  duration = 1.8,
}: {
  to: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start: number | null = null
    let raf: number

    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * to))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <motion.span ref={ref} className="tabular-nums">
      {prefix}
      {value.toLocaleString('en-IN')}
      {suffix}
    </motion.span>
  )
}
