import React, { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import NervCLI from './NervCLI'
import GlitchText from './GlitchText'

const BOOT_LINES = [
  'MAGI SYSTEM v3.11 — INITIALIZING',
  'CASPER-3 ... OK',
  'BALTHASAR-2 ... OK',
  'MELCHIOR-1 ... OK',
  'NEURAL LINK ESTABLISHED',
  'LOADING 書記システム ...',
  'NERV WRITER // READY',
]

interface NervBootScreenProps {
  onComplete: () => void
}

export default function NervBootScreen({ onComplete }: NervBootScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cliDone, setCliDone] = useState(false)

  // Check reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete()
      return
    }
  }, [prefersReducedMotion, onComplete])

  useEffect(() => {
    if (!cliDone || !containerRef.current) return

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 200)
      },
    })

    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
    })

    return () => { tl.kill() }
  }, [cliDone, onComplete])

  if (prefersReducedMotion) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
      style={{ background: 'var(--nerv-bg)' }}
    >
      <div className="mb-8">
        <GlitchText intensity="aggressive" className="text-4xl font-bold tracking-[0.3em] uppercase" as="h1">
          <span style={{ color: 'var(--nerv-red)' }}>NERV</span>
        </GlitchText>
      </div>
      <div className="w-80">
        <NervCLI lines={BOOT_LINES} typingSpeed={35} onComplete={() => setCliDone(true)} />
      </div>
      <div className="absolute bottom-8 nerv-label">
        GOD'S IN HIS HEAVEN. ALL'S RIGHT WITH THE WORLD.
      </div>
    </div>
  )
}
