<template>
  <div class="user-profile">
    <h3>{{ user?.email }}</h3>

    <div class="profile-content">
      <div class="info-item">
        <span>{{ user?.email }}</span>
      </div>
      <div class="info-item">
        <label>Member since:</label>
        <span>{{ formattedDate }}</span>
      </div>
      <div class="info-item">
        <label>Last sign in:</label>
        <span>{{ formattedLastSignIn }}</span>
      </div>

      <!-- Favorites Section -->
      <div class="favorites-section">
        <div class="section-header">
          <h4>My Favorites 我的最愛</h4>
          <div class="favorites-count">
            <IconHeart :isFavorited="true" />
            <span>{{ favoritesStore.favorites.length }}</span>
          </div>
        </div>
        
        <div v-if="favoritesStore.favorites.length === 0" class="no-favorites">
          <p>No favorites yet. Start exploring and save words you'd like to remember!</p>
        </div>
        
        <div v-else class="favorites-preview">
          <div class="recent-favorites">
            <h5>Recent favorites:</h5>
            <ul class="favorites-list">
              <li 
                v-for="favorite in recentFavorites" 
                :key="favorite.id"
                class="favorite-item"
              >
                <div class="favorite-content">
                  <span class="chinese">{{ favorite.word_data.chinese }}</span>
                  <span class="romaji">{{ favorite.word_data.romaji }}</span>
                  <span class="english">{{ favorite.word_data.english }}</span>
                </div>
                <button 
                  @click="removeFavorite(favorite.word_data.id)"
                  class="remove-favorite"
                  title="Remove from favorites"
                >
                  <IconHeart :isFavorited="true" />
                </button>
              </li>
            </ul>
          </div>
          
          <div class="favorites-actions">
            <button class="btn-secondary" @click="showAllFavorites = true">
              View All Favorites ({{ favoritesStore.favorites.length }})
            </button>
            <button 
              v-if="favoritesStore.favorites.length > 0"
              class="btn-danger-outline" 
              @click="clearAllFavorites"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-secondary" @click="showUpdateProfile = true">
          Update Profile
        </button>
        <button class="btn-secondary" @click="showChangePassword = true">
          Change Password
        </button>
        <button class="btn-danger" @click="handleSignOut">
          Sign Out
        </button>
      </div>

      <!-- Update Profile Modal -->
      <div v-if="showUpdateProfile" class="modal-overlay" @click="showUpdateProfile = false">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h4>Update Profile</h4>
            <button class="close-button" @click="showUpdateProfile = false">
              <span>&times;</span>
            </button>
          </div>
          <form @submit.prevent="handleUpdateProfile" class="modal-content">
            <div class="form-group">
              <label for="display-name">Display Name</label>
              <input id="display-name" v-model="profileForm.displayName" type="text" placeholder="Enter display name" />
            </div>
            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea id="bio" v-model="profileForm.bio" placeholder="Tell us about yourself" rows="3"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="showUpdateProfile = false">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="authStore.loading">
                {{ authStore.loading ? 'Updating...' : 'Update Profile' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div v-if="showChangePassword" class="modal-overlay" @click="showChangePassword = false">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h4>Change Password</h4>
            <button class="close-button" @click="showChangePassword = false">
              <span>&times;</span>
            </button>
          </div>
          <form @submit.prevent="handleChangePassword" class="modal-content">
            <div class="form-group">
              <label for="current-password">Current Password</label>
              <input id="current-password" v-model="passwordForm.currentPassword" type="password" required
                placeholder="Enter current password" />
            </div>
            <div class="form-group">
              <label for="new-password">New Password</label>
              <input id="new-password" v-model="passwordForm.newPassword" type="password" required
                placeholder="Enter new password" />
            </div>
            <div class="form-group">
              <label for="confirm-new-password">Confirm New Password</label>
              <input id="confirm-new-password" v-model="passwordForm.confirmPassword" type="password" required
                placeholder="Confirm new password" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="showChangePassword = false">
                Cancel
              </button>
              <button type="submit" class="btn-primary" :disabled="authStore.loading">
                {{ authStore.loading ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- All Favorites Modal -->
      <div v-if="showAllFavorites" class="modal-overlay" @click="showAllFavorites = false">
        <div class="modal favorites-modal" @click.stop>
          <div class="modal-header">
            <h4>All Favorites ({{ favoritesStore.favorites.length }})</h4>
            <button class="close-button" @click="showAllFavorites = false">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-content favorites-modal-content">
            <div v-if="favoritesStore.favorites.length === 0" class="no-favorites">
              <p>No favorites yet.</p>
            </div>
            <div v-else class="all-favorites-list">
              <div 
                v-for="favorite in favoritesStore.favorites" 
                :key="favorite.id"
                class="favorite-detail-item"
              >
                <div class="favorite-word-info">
                  <div class="word-main">
                    <span class="chinese-large">{{ favorite.word_data.chinese }}</span>
                    <span class="romaji-large">{{ favorite.word_data.romaji }}</span>
                  </div>
                  <div class="word-english">{{ favorite.word_data.english }}</div>
                  <div v-if="favorite.word_data.definitions && favorite.word_data.definitions.length" class="definitions">
                    <div v-for="def in favorite.word_data.definitions.slice(0, 1)" :key="def.id" class="definition">
                      {{ def.def_english }}
                    </div>
                  </div>
                  <div class="favorite-date">
                    Added {{ formatDate(favorite.created_at) }}
                  </div>
                </div>
                <button 
                  @click="removeFavorite(favorite.word_data.id)"
                  class="remove-favorite-btn"
                  title="Remove from favorites"
                >
                  <IconHeart :isFavorited="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="authStore.error" class="error-message">
        {{ authStore.error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import IconHeart from '@/components/icons/IconHeart.vue';

const emit = defineEmits(['close']);

const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const showUpdateProfile = ref(false);
const showChangePassword = ref(false);
const showAllFavorites = ref(false);
const successMessage = ref('');

const profileForm = ref({
  displayName: '',
  bio: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const user = computed(() => authStore.user);
const userInitials = computed(() => {
  if (!user.value?.email) return '?';
  return user.value.email.charAt(0).toUpperCase();
});

const userRole = computed(() => {
  return authStore.isAdmin ? 'Administrator' : 'User';
});

const formattedDate = computed(() => {
  if (!user.value?.created_at) return 'Unknown';
  return new Date(user.value.created_at).toLocaleDateString();
});

const formattedLastSignIn = computed(() => {
  if (!user.value?.last_sign_in_at) return 'Unknown';
  return new Date(user.value.last_sign_in_at).toLocaleString();
});

const recentFavorites = computed(() => {
  return favoritesStore.favorites.slice(0, 3);
});

const handleSignOut = async () => {
  const result = await authStore.signOut();
  if (result.success) {
    emit('close');
  }
};

const handleUpdateProfile = async () => {
  const updates = {};
  if (profileForm.value.displayName) {
    updates.display_name = profileForm.value.displayName;
  }
  if (profileForm.value.bio) {
    updates.bio = profileForm.value.bio;
  }

  const result = await authStore.updateProfile(updates);
  if (result.success) {
    successMessage.value = 'Profile updated successfully!';
    showUpdateProfile.value = false;
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  }
};

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    authStore.error = 'New passwords do not match';
    return;
  }

  const result = await authStore.updatePassword(passwordForm.value.newPassword);
  if (result.success) {
    successMessage.value = 'Password changed successfully!';
    showChangePassword.value = false;
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  }
};

const removeFavorite = async (wordId) => {
  await favoritesStore.removeFavorite(wordId);
  successMessage.value = 'Removed from favorites';
  setTimeout(() => {
    successMessage.value = '';
  }, 2000);
};

const clearAllFavorites = async () => {
  if (confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
    await favoritesStore.clearFavorites();
    successMessage.value = 'All favorites cleared';
    setTimeout(() => {
      successMessage.value = '';
    }, 2000);
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Load favorites on mount
onMounted(async () => {
  await favoritesStore.loadFromIndexedDB();
  await favoritesStore.loadFromSupabase();
});

// Watch for auth store errors and clear success message
watch(() => authStore.error, () => {
  if (authStore.error) {
    successMessage.value = '';
  }
});
</script>

<style scoped>
.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: var(--gunmetal);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.profile-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Favorites Section */
.favorites-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: var(--black);
  border-radius: 0.5rem;
  border: 1px solid var(--gunmetal);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: white;
  font-size: 1.2rem;
}

.favorites-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--frenchGray);
  font-size: 0.9rem;
}

.no-favorites {
  color: var(--frenchGray);
  text-align: center;
  padding: 1rem;
  font-style: italic;
}

.recent-favorites h5 {
  margin: 0 0 0.5rem 0;
  color: var(--frenchGray);
  font-size: 0.9rem;
  font-weight: normal;
}

.favorites-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: var(--raisinBlack);
  border-radius: 0.25rem;
  border: 1px solid var(--gunmetal);
}

.favorite-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.favorite-content .chinese {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.favorite-content .romaji {
  font-size: 0.9rem;
  color: var(--frenchGray);
  font-style: italic;
}

.favorite-content .english {
  font-size: 0.8rem;
  color: var(--frenchGray);
}

.remove-favorite {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #e74c3c;
  transition: opacity 0.2s;
}

.remove-favorite:hover {
  opacity: 0.7;
}

.favorites-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-danger-outline {
  background-color: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-danger-outline:hover {
  background-color: #e74c3c;
  color: white;
}

/* Favorites Modal */
.favorites-modal {
  max-width: 600px;
  max-height: 80vh;
  width: 90vw;
}

.favorites-modal-content {
  max-height: 60vh;
  overflow-y: auto;
}

.all-favorites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.favorite-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background-color: var(--raisinBlack);
  border-radius: 0.5rem;
  border: 1px solid var(--gunmetal);
}

.favorite-word-info {
  flex: 1;
}

.word-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.chinese-large {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
}

.romaji-large {
  font-size: 1.1rem;
  color: var(--frenchGray);
  font-style: italic;
}

.word-english {
  font-size: 1rem;
  color: white;
  margin-bottom: 0.5rem;
}

.definitions {
  margin-bottom: 0.5rem;
}

.definition {
  font-size: 0.9rem;
  color: var(--frenchGray);
  line-height: 1.4;
}

.favorite-date {
  font-size: 0.75rem;
  color: var(--frenchGray);
  opacity: 0.7;
}

.remove-favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #e74c3c;
  transition: opacity 0.2s;
  margin-left: 1rem;
}

.remove-favorite-btn:hover {
  opacity: 0.7;
}
</style>