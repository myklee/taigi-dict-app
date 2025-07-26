import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/taigi-dict-app/',
  plugins: [
    vue(),
  ],
  define: {
    // Platform detection for web builds
    'import.meta.env.VITE_PLATFORM': JSON.stringify('web'),
    'import.meta.env.VITE_ROUTER_MODE': JSON.stringify('history'),
    'import.meta.env.VITE_IS_CAPACITOR': JSON.stringify(false)
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('vue-router')) {
              return 'router'
            }
            if (id.includes('vue') || id.includes('pinia')) {
              return 'vendor'
            }
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            return 'vendor'
          }
          
          // Route-based chunks
          if (id.includes('/views/')) {
            if (id.includes('Admin') || id.includes('/admin/')) {
              return 'admin-views'
            }
            if (id.includes('Profile') || id.includes('Favorites') || id.includes('History')) {
              return 'user-views'
            }
            if (id.includes('Dictionary') || id.includes('Search') || id.includes('Word')) {
              return 'dictionary-views'
            }
            return 'views'
          }
          
          // Component-based chunks - merge all components into admin-components to avoid circular dependencies
          if (id.includes('/components/')) {
            return 'admin-components'
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  assetsInclude: ['**/*.mp3'],
  // Web-specific optimizations
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia']
  }
})