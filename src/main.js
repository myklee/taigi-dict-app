import './assets/main.css'

import { createApp } from 'vue'

import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');

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
