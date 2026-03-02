import React from 'react'

interface NervCRTOverlayProps {
  enabled: boolean
}

export default function NervCRTOverlay({ enabled }: NervCRTOverlayProps) {
  if (!enabled) return null
  return (
    <>
      <div className="nerv-scanlines" aria-hidden="true" />
      <div className="nerv-vignette" aria-hidden="true" />
    </>
  )
}
