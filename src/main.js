import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initializeAccessibility } from './utils/accessibility.js'
import { initializeAccessibilityPreferences } from './utils/accessibilityPreferences.js'

const app = createApp(App)
const pinia = createPinia()

// Register Pinia store
app.use(pinia)

// Register Vue Router
app.use(router)

// Mount the app - router is now available before mount
app.mount('#app')

// Initialize accessibility features
initializeAccessibility()

// Initialize accessibility preferences
initializeAccessibilityPreferences()

// Supabase postgres password VaJzmCmC2uIWw6UI

// Global error handler for authentication errors
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err);
  console.error('Error info:', info);
  
  // Handle authentication-specific errors
  if (err.message && err.message.includes('auth')) {
    console.error('Authentication error detected');
  }
};
