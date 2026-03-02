import { useState, useCallback } from 'react'

export function useSettings(initial: any) {
  const [settings, setSettings] = useState(initial)
  const updateSettings = useCallback(async (updates: any) => {
    setSettings((prev: any) => ({ ...prev, ...updates }))
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
        body: JSON.stringify({ settings: updates }),
        credentials: 'same-origin',
      })
    } catch (e) { console.warn('Settings save failed:', e) }
  }, [])
  return { settings, updateSettings }
}
export default useSettings
