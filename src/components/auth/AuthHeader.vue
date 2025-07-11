<template>
  <div class="auth-header">
    <!-- Not authenticated -->
    <div v-if="!authStore.isAuthenticated" class="auth-actions">
      <button @click="toggleRandomWord">
        {{ showRandomWord ? 'Hide random word' : 'Show random word' }}
      </button>
      <button @click="showAuthModal = true">
        Log in
      </button>
    </div>

    <!-- Authenticated -->
    <div v-else class="user-menu">
      <div class="user-left">
        <div class="user-avatar" @click="showUserProfile = true">
          {{ userInitials }}
        </div>
        <button @click="handleSignOut">
          Sign Out
        </button>
        <button @click="clearCache">
          Clear cache
        </button>
      </div>
      <button @click="toggleRandomWord">
        {{ showRandomWord ? 'Hide random word' : 'Show random word' }}
      </button>
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
import { useDictionaryStore } from '@/stores/dictionaryStore';
import AuthModal from './AuthModal.vue';
import UserProfile from './UserProfile.vue';

const authStore = useAuthStore();
const dictionaryStore = useDictionaryStore();
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

const showRandomWord = computed(() => dictionaryStore.showRandomWord);

const handleAuthSuccess = () => {
  showAuthModal.value = false;
  // You can add any additional logic here after successful authentication
};

const handleSignOut = () => {
  authStore.signOut();
};

const toggleRandomWord = () => {
  dictionaryStore.toggleRandomWord();
};

const clearCache = async () => {
  await dictionaryStore.clearSearchHistory();
  await dictionaryStore.clearRandomWordHistory();
  await dictionaryStore.setSearchResults([]);
  await dictionaryStore.setCedictResults([]);
  await dictionaryStore.setMknollResults([]);
  await dictionaryStore.setCrossRefCedict([]);
};
</script>

<style scoped>
.auth-header {
  background-color: var(--raisinBlack);
  border-bottom: 1px solid var(--gunmetal);
  padding: 1rem 2rem;
}

.auth-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.user-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.user-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--black);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.user-avatar:hover {
  background-color: var(--gunmetal);
  transform: scale(1.05);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--raisinBlack);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .auth-header {
    padding: 1rem;
  }

  .user-menu {
    flex-direction: column;
    gap: 1rem;
  }
}
</style> 