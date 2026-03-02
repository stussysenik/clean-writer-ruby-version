import { useState, useCallback } from 'react'

export function useThemeStore(initialThemes: any[]) {
  const [themes, setThemes] = useState(initialThemes)
  const addCustomTheme = useCallback(async (theme: any) => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      const res = await fetch('/api/v1/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
        body: JSON.stringify({ theme }),
        credentials: 'same-origin',
      })
      if (res.ok) {
        const created = await res.json()
        setThemes(prev => [...prev, created])
        return created
      }
    } catch (e) { console.warn('Failed to create theme:', e) }
    return null
  }, [])
  const deleteCustomTheme = useCallback(async (id: string) => {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
      await fetch(`/api/v1/themes/${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken || '' }, credentials: 'same-origin' })
      setThemes(prev => prev.filter((t: any) => t.id !== id))
    } catch (e) { console.warn('Failed to delete theme:', e) }
  }, [])
  return { themes, addCustomTheme, deleteCustomTheme }
}
export default useThemeStore
