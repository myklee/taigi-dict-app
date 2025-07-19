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
        <div class="user-avatar" @click="goToProfile">
          {{ userInitials }}
        </div>
        <button v-if="canModerate" @click="goToAdmin" class="admin-btn">
          Admin Dashboard
        </button>
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

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { useDictionaryStore } from '@/stores/dictionaryStore';
import AuthModal from './AuthModal.vue';

const props = defineProps({
  navigate: Function
});

const authStore = useAuthStore();
const communityStore = useCommunityStore();
const dictionaryStore = useDictionaryStore();
const showAuthModal = ref(false);
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

const canModerate = computed(() => communityStore.canModerate);

const isAdmin = computed(() => {
  const role = communityStore.userProfile?.role;
  return role === 'admin';
});

const handleAuthSuccess = async () => {
  showAuthModal.value = false;
  // Initialize community store after successful authentication
  await communityStore.initialize();
};

const handleSignOut = () => {
  authStore.signOut();
};

const goToProfile = () => {
  if (props.navigate) {
    props.navigate('profile');
  }
};

const goToAdmin = () => {
  if (props.navigate) {
    props.navigate('admin');
  }
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
}

.admin-btn:hover {
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