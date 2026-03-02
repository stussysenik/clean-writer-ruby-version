import React, { useState, useEffect, useRef, useCallback } from 'react'

interface NervCLIProps {
  lines: string[]
  typingSpeed?: number
  className?: string
  onComplete?: () => void
}

export default function NervCLI({ lines, typingSpeed = 40, className = '', onComplete }: NervCLIProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState('')
  const lineIndexRef = useRef(0)
  const charIndexRef = useRef(0)
  const lastTimeRef = useRef(0)
  const rafRef = useRef<number>(0)

  const tick = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const elapsed = timestamp - lastTimeRef.current

    if (elapsed >= typingSpeed) {
      lastTimeRef.current = timestamp
      const li = lineIndexRef.current
      const ci = charIndexRef.current

      if (li >= lines.length) {
        onComplete?.()
        return
      }

      const line = lines[li]
      if (ci < line.length) {
        charIndexRef.current++
        setCurrentLine(line.slice(0, ci + 1))
      } else {
        setDisplayedLines(prev => [...prev, line])
        setCurrentLine('')
        lineIndexRef.current++
        charIndexRef.current = 0
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [lines, typingSpeed, onComplete])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  return (
    <div className={`font-mono text-[10px] leading-relaxed ${className}`} style={{ color: 'var(--nerv-green)' }}>
      {displayedLines.map((line, i) => (
        <div key={i} className="opacity-50">
          <span style={{ color: 'var(--nerv-red)' }}>{'>'}</span> {line}
        </div>
      ))}
      {currentLine && (
        <div>
          <span style={{ color: 'var(--nerv-red)' }}>{'>'}</span> {currentLine}
          <span className="nerv-blink">_</span>
        </div>
      )}
    </div>
  )
}
