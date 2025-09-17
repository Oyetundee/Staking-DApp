import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [],
    }
  },
  optimizeDeps: {
    include: ['@apollo/client', 'rxjs', 'rxjs/operators']
  },
  define: {
    global: 'globalThis',
  }
})