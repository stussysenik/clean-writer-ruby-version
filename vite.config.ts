import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    RubyPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@/': resolve(__dirname, 'frontend') + '/',
    },
  },
  worker: {
    format: 'es',
  },
})
