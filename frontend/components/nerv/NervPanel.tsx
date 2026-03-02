import React from 'react'

interface NervPanelProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  style?: React.CSSProperties
}

export default function NervPanel({ children, className = '', glow = true, style }: NervPanelProps) {
  return (
    <div
      className={`nerv-clip ${glow ? 'nerv-border-glow' : ''} ${className}`}
      style={{
        border: '1px solid var(--nerv-border)',
        background: 'rgba(10, 10, 18, 0.9)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
