import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('maplibre-gl')) return 'vendor-map'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react'
        },
      },
    },
  },
})
