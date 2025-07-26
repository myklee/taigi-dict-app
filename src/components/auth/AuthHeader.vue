<template>
  <div class="auth-header">
    <!-- Not authenticated -->
    <div v-if="!authStore.isAuthenticated" class="auth-actions">
      <button @click="toggleRandomWord">
        {{ showRandomWord ? 'Hide random word' : 'Show random word' }}
      </button>
      <button @click="authStore.showAuthModalAction('signin')">
        Log in
      </button>
    </div>

    <!-- Authenticated -->
    <div v-else class="user-menu">
      <div class="user-left">
        <router-link to="/profile" class="user-avatar">
          {{ userInitials }}
        </router-link>
        <router-link v-if="canModerate" to="/admin" class="admin-btn">
          Admin Dashboard
        </router-link>
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
      :visible="authStore.showAuthModal"
      :initial-mode="authStore.authModalMode"
      @close="authStore.hideAuthModal"
      @success="handleAuthSuccess"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { useDictionaryStore } from '@/stores/dictionaryStore';
import AuthModal from './AuthModal.vue';

const authStore = useAuthStore();
const communityStore = useCommunityStore();
const dictionaryStore = useDictionaryStore();

const userEmail = computed(() => {
  if (!authStore.user?.email) return '';
  return authStore.user.email;
});

const userInitials = computed(() => {
  if (!authStore.user?.email) return '?';
  return authStore.user.email.charAt(0).toUpperCase();
});

const showRandomWord = computed(() => dictionaryStore.showRandomWord);

const canModerate = computed(() => communityStore.canModerate);

const isAdmin = computed(() => {
  const role = communityStore.userProfile?.role;
  return role === 'admin';
});

const handleAuthSuccess = async () => {
  authStore.hideAuthModal();
  // Initialize community store after successful authentication
  await communityStore.initialize();
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
  text-decoration: none;
}

.user-avatar:hover,
.user-avatar.router-link-active {
  background-color: var(--gunmetal);
  transform: scale(1.05);
}

.admin-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.admin-btn:hover,
.admin-btn.router-link-active {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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