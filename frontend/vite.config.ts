import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy API calls to the PHP backend during development.
      // Change the target to match your local piClinic install.
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
})
