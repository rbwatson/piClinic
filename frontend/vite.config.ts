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
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Use jsdom to simulate a browser environment
    environment: 'jsdom',
    // Run the setup file before each test suite
    setupFiles: ['./src/test/setup.ts'],
    // Allow test files anywhere under src/ using either naming convention
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    globals: true,
    // Resolve the same @ alias inside tests
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
