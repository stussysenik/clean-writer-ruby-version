import React from 'react'

interface BilingualLabelProps {
  en: string
  jp: string
  className?: string
}

export default function BilingualLabel({ en, jp, className = '' }: BilingualLabelProps) {
  return (
    <span className={`nerv-label ${className}`}>
      <span style={{ opacity: 0.4 }}>{jp}</span>
      <span className="mx-1" style={{ opacity: 0.2 }}>/</span>
      <span>{en}</span>
    </span>
  )
}
