
// Bundle Analyzer Configuration
// Add this to your vite.config.ts for bundle analysis

import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    // ... other plugins
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
          utils: ['axios', 'date-fns', 'validator']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
