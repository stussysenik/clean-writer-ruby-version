import { useState, useCallback, useRef, useEffect } from 'react'

const AUTOSAVE_DELAY = 2000

export function useDocument(initialDoc: any) {
  const [doc, setDoc] = useState(initialDoc)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<any>(null)

  const updateDoc = useCallback((updates: any) => {
    setDoc((prev: any) => ({ ...prev, ...updates }))
    pendingRef.current = { ...pendingRef.current, ...updates }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const pending = pendingRef.current
      if (!pending) return
      pendingRef.current = null
      try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        await fetch(`/api/v1/documents/${doc.id}/autosave`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
          body: JSON.stringify({ document: pending }),
          credentials: 'same-origin',
        })
      } catch (e) { console.warn('Autosave failed:', e) }
    }, AUTOSAVE_DELAY)
  }, [doc.id])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])
  return { doc, updateDoc }
}
export default useDocument
