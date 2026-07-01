import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/edid-editor/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendors out of the app chunk so the main bundle stays well
        // under the 500 kB warning threshold. The workspace edidts library
        // (~330 kB) is the single biggest contributor, so it gets its own
        // chunk; the rest are split by dependency.
        manualChunks(id) {
          if (id.includes('packages/edidts')) return 'edidts'
          if (id.includes('node_modules')) {
            if (id.includes('reka-ui')) return 'reka-ui'
            if (id.includes('@vueuse')) return 'vueuse'
            if (id.includes('@tanstack')) return 'tanstack'
            if (id.includes('@lucide') || id.includes('lucide-vue')) return 'lucide'
            if (id.includes('/vue/') || id.includes('@vue/')) return 'vue'
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})