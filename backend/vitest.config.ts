/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      ':bookcars-types': path.resolve(__dirname, '../packages/bookcars-types'),
      ':bookcars-helper': path.resolve(__dirname, '../packages/bookcars-helper'),
      ':currency-converter': path.resolve(__dirname, '../packages/currency-converter'),
      ':disable-react-devtools': path.resolve(__dirname, '../packages/disable-react-devtools'),
    },
  },
})
