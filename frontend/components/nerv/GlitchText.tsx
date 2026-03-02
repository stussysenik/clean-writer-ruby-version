import React from 'react'

interface GlitchTextProps {
  children: React.ReactNode
  intensity?: 'subtle' | 'aggressive'
  className?: string
  as?: React.ElementType
}

export default function GlitchText({ children, intensity = 'subtle', className = '', as: Tag = 'span' }: GlitchTextProps) {
  return (
    <Tag className={`${intensity === 'aggressive' ? 'nerv-glitch-aggressive' : 'nerv-glitch-subtle'} ${className}`}>
      {children}
    </Tag>
  )
}
