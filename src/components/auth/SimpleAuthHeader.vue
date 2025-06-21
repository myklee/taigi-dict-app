<template>
  <div class="simple-auth-header">
    <div v-if="!isAuthenticated" class="auth-actions">
      <button class="btn-signin" @click="showAuthModal = true">
        Sign In
      </button>
    </div>

    <div v-else class="user-info">
      <span class="user-email">{{ userEmail }}</span>
      <button class="btn-signout" @click="handleSignOut">
        Sign Out
      </button>
    </div>

    <!-- Auth Modal -->
    <AuthModal
      :visible="showAuthModal"
      :initial-mode="'signin'"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import AuthModal from './AuthModal.vue';

const authStore = useAuthStore();
const showAuthModal = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const userEmail = computed(() => authStore.user?.email || '');

const handleSignOut = async () => {
  await authStore.signOut();
};

const handleAuthSuccess = () => {
  showAuthModal.value = false;
};
</script>

<style scoped>
.simple-auth-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-actions {
  display: flex;
  gap: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
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

.btn-signout {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-signout:hover {
  background-color: #dc2626;
}

.user-email {
  font-size: 0.875rem;
  color: #374151;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 