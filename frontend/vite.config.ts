import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Separa las dependencias grandes y estables del codigo de la app para
         * que no se invaliden en cada despliegue y no viajen en el bundle
         * inicial de quien solo visita la home.
         */
        manualChunks: (id) => {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('@stripe')) {
            return 'vendor-stripe'
          }

          if (
            id.includes('react-router') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react'
          }

          return undefined
        },
      },
    },
  },
})
