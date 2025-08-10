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

// Handle GitHub Pages SPA redirect
router.isReady().then(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('p');
  if (redirect) {
    // Remove the redirect parameter and navigate to the original path
    const url = new URL(window.location);
    url.searchParams.delete('p');
    window.history.replaceState({}, '', url.toString());
    // Navigate to the original path
    router.push(decodeURIComponent(redirect));
  }
});

// Mount the app - router is now available before mount
app.mount('#app')

// Initialize accessibility features
initializeAccessibility()

// Initialize accessibility preferences
initializeAccessibilityPreferences()

// Supabase postgres password VaJzmCmC2uIWw6UI

// Global error handler for authentication errors
app.config.errorHandler = (err, _vm, info) => {
  console.error('Global error:', err);
  console.error('Error info:', info);
  
  // Handle authentication-specific errors
  if (err.message && err.message.includes('auth')) {
    console.error('Authentication error detected');
  }
};
