<template>
  <div>
    <!-- Show content if authenticated or if no auth required -->
    <div v-if="shouldShowContent">
      <slot />
    </div>
    
    <!-- Show fallback for unauthenticated users -->
    <div v-else-if="showFallback" class="auth-fallback">
      <div class="fallback-content">
        <div class="fallback-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3>{{ fallbackTitle }}</h3>
        <p>{{ fallbackMessage }}</p>
        <button class="btn-primary" @click="$emit('signin')">
          Sign In
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const props = defineProps({
  requireAuth: {
    type: Boolean,
    default: false
  },
  showFallback: {
    type: Boolean,
    default: true
  },
  fallbackTitle: {
    type: String,
    default: 'Authentication Required'
  },
  fallbackMessage: {
    type: String,
    default: 'Please sign in to access this feature.'
  }
});

const emit = defineEmits(['signin']);

const authStore = useAuthStore();

const shouldShowContent = computed(() => {
  if (!props.requireAuth) return true;
  return authStore.isAuthenticated;
});
</script>

<style scoped>
.auth-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.fallback-content {
  text-align: center;
  max-width: 400px;
}

.fallback-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #6b7280;
}

.fallback-icon svg {
  width: 100%;
  height: 100%;
}

.fallback-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.fallback-content p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.5;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}
</style> 