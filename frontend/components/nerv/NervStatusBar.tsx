import React, { useState, useEffect } from 'react'
import BilingualLabel from './BilingualLabel'
import PhosphorGlow from './PhosphorGlow'

interface NervStatusBarProps {
  wordCount: number
  songMode: boolean
  connected: boolean
}

export default function NervStatusBar({ wordCount, songMode, connected }: NervStatusBarProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div
      className="fixed top-0 left-0 right-0 h-6 flex items-center justify-between px-4 z-[100]"
      style={{
        background: 'rgba(10, 10, 18, 0.85)',
        borderBottom: '1px solid var(--nerv-border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-3">
        <BilingualLabel en="WRITER" jp="書記" />
        <span className="nerv-label nerv-number-flicker" style={{ color: 'var(--nerv-cyan)' }}>
          {String(wordCount).padStart(6, '0')}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {songMode && (
          <PhosphorGlow color="var(--nerv-orange)">
            <span className="nerv-label">SONG MODE</span>
          </PhosphorGlow>
        )}
        <span
          className="nerv-status-dot inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: connected ? 'var(--nerv-green)' : 'var(--nerv-red)', color: connected ? 'var(--nerv-green)' : 'var(--nerv-red)' }}
        />
        <span className="nerv-label" style={{ color: 'var(--nerv-text-dim)' }}>
          {timeStr}
        </span>
      </div>
    </div>
  )
}
