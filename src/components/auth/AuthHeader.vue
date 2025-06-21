<template>
  <div class="auth-header">
    <!-- Not authenticated -->
    <div v-if="!authStore.isAuthenticated" class="auth-actions">
      <button class="btn-signin" @click="showAuthModal = true">
        Sign In
      </button>
    </div>

    <!-- Authenticated -->
    <div v-else class="user-menu">
      <div class="user-info" @click="showUserProfile = true">
        <div class="user-avatar">
          {{ userInitials }}
        </div>
        <span class="user-email">{{ userEmail }}</span>
        <svg class="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Auth Modal -->
    <AuthModal
      :visible="showAuthModal"
      :initial-mode="authMode"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />

    <!-- User Profile Modal -->
    <div v-if="showUserProfile" class="modal-overlay" @click="showUserProfile = false">
      <div class="modal-content" @click.stop>
        <UserProfile @close="showUserProfile = false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import AuthModal from './AuthModal.vue';
import UserProfile from './UserProfile.vue';

const authStore = useAuthStore();
const showAuthModal = ref(false);
const showUserProfile = ref(false);
const authMode = ref('signin');

const userEmail = computed(() => {
  if (!authStore.user?.email) return '';
  return authStore.user.email;
});

const userInitials = computed(() => {
  if (!authStore.user?.email) return '?';
  return authStore.user.email.charAt(0).toUpperCase();
});

const handleAuthSuccess = () => {
  showAuthModal.value = false;
  // You can add any additional logic here after successful authentication
};
</script>

<style scoped>
.auth-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-signin {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-signin:hover {
  background-color: #2563eb;
}

.user-menu {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f3f4f6;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

.user-email {
  font-size: 0.875rem;
  color: #374151;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  color: #6b7280;
  transition: transform 0.2s;
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  width: 100%;
  max-width: 500px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .user-email {
    display: none;
  }
  
  .user-info {
    padding: 0.25rem;
  }
}
</style> 