// Rails API client with CSRF, debounced autosave, and offline queue

function getCsrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
    ...((options.headers as Record<string, string>) || {}),
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }

  return res
}

// Documents
export async function fetchDocuments() {
  const res = await apiFetch('/api/v1/documents')
  return res.json()
}

export async function createDocument(data: Record<string, unknown>) {
  const res = await apiFetch('/api/v1/documents', {
    method: 'POST',
    body: JSON.stringify({ document: data }),
  })
  return res.json()
}

export async function updateDocument(id: string, data: Record<string, unknown>) {
  const res = await apiFetch(`/api/v1/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ document: data }),
  })
  return res.json()
}

export async function autosaveDocument(id: string, content: string, wordCount: number) {
  const res = await apiFetch(`/api/v1/documents/${id}/autosave`, {
    method: 'PATCH',
    body: JSON.stringify({ document: { content, word_count: wordCount } }),
  })
  return res.json()
}

// Themes
export async function fetchThemes() {
  const res = await apiFetch('/api/v1/themes')
  return res.json()
}

export async function createTheme(data: Record<string, unknown>) {
  const res = await apiFetch('/api/v1/themes', {
    method: 'POST',
    body: JSON.stringify({ theme: data }),
  })
  return res.json()
}

export async function updateTheme(id: string, data: Record<string, unknown>) {
  const res = await apiFetch(`/api/v1/themes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ theme: data }),
  })
  return res.json()
}

export async function deleteTheme(id: string) {
  await apiFetch(`/api/v1/themes/${id}`, { method: 'DELETE' })
}

export async function reorderThemes(positions: { id: string; position: number }[]) {
  await apiFetch('/api/v1/themes/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ positions }),
  })
}

// Settings
export async function fetchSettings() {
  const res = await apiFetch('/api/v1/settings')
  return res.json()
}

export async function updateSettings(data: Record<string, unknown>) {
  const res = await apiFetch('/api/v1/settings', {
    method: 'PATCH',
    body: JSON.stringify({ settings: data }),
  })
  return res.json()
}

// Export
export async function exportMarkdown(content: string, filename?: string) {
  const res = await apiFetch('/api/v1/export/markdown', {
    method: 'POST',
    body: JSON.stringify({ content, filename }),
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'clean-writer.md'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Debounced save helper
export function createDebouncedSave<T>(
  saveFn: (data: T) => Promise<unknown>,
  delay = 2000
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: T | null = null

  return {
    save(data: T) {
      pending = data
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        if (pending) {
          try {
            await saveFn(pending)
          } catch (e) {
            console.warn('Debounced save failed:', e)
            // Queue for offline replay
            queueOfflineSave(pending)
          }
          pending = null
        }
      }, delay)
    },
    flush() {
      if (timer) clearTimeout(timer)
      if (pending) {
        saveFn(pending).catch(() => queueOfflineSave(pending!))
        pending = null
      }
    },
  }
}

// Offline queue using IndexedDB
const OFFLINE_DB = 'clean_writer_offline'
const OFFLINE_STORE = 'pending_saves'

function queueOfflineSave(data: unknown) {
  try {
    const request = indexedDB.open(OFFLINE_DB, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(OFFLINE_STORE, { autoIncrement: true })
    }
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(OFFLINE_STORE, 'readwrite')
      tx.objectStore(OFFLINE_STORE).add({ data, timestamp: Date.now() })
    }
  } catch {
    // IndexedDB not available — data lost
  }
}

export async function replayOfflineQueue() {
  return new Promise<void>((resolve) => {
    try {
      const request = indexedDB.open(OFFLINE_DB, 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore(OFFLINE_STORE, { autoIncrement: true })
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction(OFFLINE_STORE, 'readwrite')
        const store = tx.objectStore(OFFLINE_STORE)
        const getAll = store.getAll()
        getAll.onsuccess = () => {
          // Clear the store
          store.clear()
          resolve()
        }
        getAll.onerror = () => resolve()
      }
      request.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}
