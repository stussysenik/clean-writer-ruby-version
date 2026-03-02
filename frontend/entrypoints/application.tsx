import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/components/App'
import '@/styles/index.css'

const rootElement = document.getElementById('nerv-root')
if (!rootElement) throw new Error('Root element #nerv-root not found')

const initialState = JSON.parse(rootElement.dataset.initialState || '{}')

createRoot(rootElement).render(
  <React.StrictMode>
    <App initialState={initialState} />
  </React.StrictMode>
)
