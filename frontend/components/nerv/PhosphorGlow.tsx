import React from 'react'

interface PhosphorGlowProps {
  children: React.ReactNode
  color?: string
  strong?: boolean
  className?: string
}

export default function PhosphorGlow({ children, color, strong = false, className = '' }: PhosphorGlowProps) {
  return (
    <span
      className={`${strong ? 'nerv-phosphor-strong' : 'nerv-phosphor'} ${className}`}
      style={color ? { color } : undefined}
    >
      {children}
    </span>
  )
}
