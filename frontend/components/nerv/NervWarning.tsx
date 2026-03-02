import React, { useState, useEffect } from 'react'

interface NervWarningProps {
  message: string
  messageJp?: string
  className?: string
}

export default function NervWarning({ message, messageJp = '警告', className = '' }: NervWarningProps) {
  const [showJp, setShowJp] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setShowJp(prev => !prev), 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`nerv-warning-pulse px-3 py-1.5 nerv-clip ${className}`}>
      <span className="nerv-label" style={{ color: 'var(--nerv-red)' }}>
        {showJp ? messageJp : message}
      </span>
    </div>
  )
}
