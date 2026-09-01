import logoSrc from '../../assets/logo.png'

export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={logoSrc}
      alt="Sankalp"
      width={size}
      height={size}
      className={`shrink-0 rounded-md object-cover ${className}`}
    />
  )
}
