<template>
  <div id="user-profile-page">
    <Loader :loading="loading" />
    
    <!-- Header Section -->
    <section class="profile-header">
      <div class="header-content">
        <div class="user-info">
          <div class="user-avatar-large">
            {{ userInitials }}
          </div>
          <div class="user-details">
            <h1>{{ user?.email }}</h1>
            <div class="user-role">{{ userRole }}</div>
          </div>
        </div>
        <button @click="goHome()" class="back-button">
          ← Back to Dictionary
        </button>
      </div>
    </section>

    <!-- Profile Content -->
    <section class="profile-content">
      <div class="content-container">
        
        <!-- Account Information -->
        <div class="info-section">
          <h2>Account Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Email:</label>
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
          </div>
        </div>

        <!-- Favorites Section -->
        <div class="favorites-section">
          <div class="section-header">
            <h2>My Favorites 我的最愛</h2>
            <div class="favorites-count">
              <IconHeart :isFavorited="true" />
              <span>{{ favoritesStore.favorites.length }}</span>
            </div>
          </div>
          
          <div v-if="favoritesStore.favorites.length === 0" class="no-favorites">
            <IconHeart :isFavorited="false" />
            <h3>No favorites yet</h3>
            <p>Start exploring the dictionary and click the heart icon to save words you'd like to remember!</p>
            <button @click="goHome()" class="btn-primary">
              Start Exploring
            </button>
          </div>
          
          <div v-else class="favorites-content">
            <!-- Recent Favorites Preview -->
            <div class="recent-favorites">
              <h3>Recent favorites:</h3>
              <div class="favorites-grid">
                <div 
                  v-for="favorite in recentFavorites" 
                  :key="favorite.id"
                  class="favorite-card"
                >
                  <div class="favorite-word-info">
                    <div class="word-main">
                      <span class="chinese">{{ favorite.word_data.chinese }}</span>
                      <span class="romaji">{{ favorite.word_data.romaji }}</span>
                    </div>
                    <div class="word-english">{{ favorite.word_data.english }}</div>
                    <div v-if="favorite.word_data.definitions && favorite.word_data.definitions.length" class="definition-preview">
                      {{ favorite.word_data.definitions[0].def_english }}
                    </div>
                    <div class="favorite-date">
                      {{ formatDate(favorite.created_at) }}
                    </div>
                  </div>
                  <button 
                    @click="removeFavorite(favorite.word_data.id)"
                    class="remove-favorite"
                    title="Remove from favorites"
                  >
                    <IconHeart :isFavorited="true" />
                  </button>
                </div>
              </div>
            </div>
            
            <!-- All Favorites (if more than 3) -->
            <div v-if="favoritesStore.favorites.length > 3" class="all-favorites">
              <h3>All Favorites ({{ favoritesStore.favorites.length }})</h3>
              <div class="favorites-list">
                <div 
                  v-for="favorite in favoritesStore.favorites" 
                  :key="favorite.id"
                  class="favorite-list-item"
                >
                  <div class="favorite-content">
                    <div class="word-info">
                      <span class="chinese">{{ favorite.word_data.chinese }}</span>
                      <span class="romaji">{{ favorite.word_data.romaji }}</span>
                      <span class="english">{{ favorite.word_data.english }}</span>
                    </div>
                    <div class="favorite-meta">
                      <span class="date">{{ formatDate(favorite.created_at) }}</span>
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
            
            <!-- Favorites Actions -->
            <div class="favorites-actions">
              <button 
                v-if="favoritesStore.favorites.length > 0"
                class="btn-danger-outline" 
                @click="clearAllFavorites"
              >
                Clear All Favorites
              </button>
            </div>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="actions-section">
          <h2>Account Actions</h2>
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
        </div>

      </div>
    </section>

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

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
    <div v-if="authStore.error" class="error-message">
      {{ authStore.error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import IconHeart from '@/components/icons/IconHeart.vue';
import Loader from '@/components/utility/Loader.vue';

const emit = defineEmits(['close']);

const router = useRouter();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const showUpdateProfile = ref(false);
const showChangePassword = ref(false);
const successMessage = ref('');
const loading = ref(false);

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

const goHome = () => {
  router.push({ name: 'dictionary' });
};

const handleSignOut = async () => {
  const result = await authStore.signOut();
  if (result.success) {
    // Navigate to home after sign out
    goHome();
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
    loading.value = true;
    await favoritesStore.clearFavorites();
    successMessage.value = 'All favorites cleared';
    loading.value = false;
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
  loading.value = true;
  await favoritesStore.loadFromIndexedDB();
  await favoritesStore.loadFromSupabase();
  loading.value = false;
});

// Watch for auth store errors and clear success message
watch(() => authStore.error, () => {
  if (authStore.error) {
    successMessage.value = '';
  }
});
</script>

<style scoped>
#user-profile-page {
  min-height: 100vh;
  background-color: var(--app-background);
}

/* Header Section */
.profile-header {
  background-color: var(--raisinBlack);
  border-bottom: 1px solid var(--gunmetal);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--black);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  border: 3px solid var(--gunmetal);
}

.user-details h1 {
  margin: 0;
  color: white;
  font-size: 1.8rem;
}

.user-role {
  color: var(--frenchGray);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.back-button {
  background-color: var(--gunmetal);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--black);
}

/* Profile Content */
.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Section Styles */
.info-section,
.favorites-section,
.actions-section {
  background-color: var(--black);
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid var(--gunmetal);
}

.info-section h2,
.favorites-section h2,
.actions-section h2 {
  margin: 0 0 1.5rem 0;
  color: white;
  font-size: 1.5rem;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--raisinBlack);
  border-radius: 0.5rem;
  border: 1px solid var(--gunmetal);
}

.info-item label {
  color: var(--frenchGray);
  font-size: 0.9rem;
  font-weight: 600;
}

.info-item span {
  color: white;
  font-size: 1rem;
}

/* Favorites Section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.favorites-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--frenchGray);
  font-size: 1.1rem;
}

.no-favorites {
  text-align: center;
  padding: 3rem;
  color: var(--frenchGray);
}

.no-favorites h3 {
  margin: 1rem 0;
  color: white;
}

.no-favorites p {
  line-height: 1.6;
  margin-bottom: 2rem;
}

.recent-favorites h3,
.all-favorites h3 {
  margin: 0 0 1rem 0;
  color: white;
  font-size: 1.2rem;
}

/* Favorites Grid */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.favorite-card {
  background-color: var(--raisinBlack);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid var(--gunmetal);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.favorite-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.word-main {
  margin-bottom: 0.75rem;
}

.chinese {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.25rem;
}

.romaji {
  display: block;
  font-size: 1rem;
  color: var(--frenchGray);
  font-style: italic;
}

.word-english {
  font-size: 1rem;
  color: white;
  margin-bottom: 0.5rem;
}

.definition-preview {
  font-size: 0.9rem;
  color: var(--frenchGray);
  line-height: 1.4;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-date {
  font-size: 0.8rem;
  color: var(--frenchGray);
  opacity: 0.7;
}

.remove-favorite {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #e74c3c;
  transition: opacity 0.2s;
}

.remove-favorite:hover {
  opacity: 0.7;
}

/* All Favorites List */
.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.favorite-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--raisinBlack);
  border-radius: 0.5rem;
  border: 1px solid var(--gunmetal);
}

.favorite-content {
  flex: 1;
}

.word-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.word-info .chinese {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  display: inline;
  margin: 0;
}

.word-info .romaji {
  font-size: 0.9rem;
  color: var(--frenchGray);
  font-style: italic;
  display: inline;
}

.word-info .english {
  font-size: 0.9rem;
  color: var(--frenchGray);
}

.favorite-meta .date {
  font-size: 0.8rem;
  color: var(--frenchGray);
  opacity: 0.7;
}

.remove-favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #e74c3c;
  padding: 0.5rem;
  transition: opacity 0.2s;
}

.remove-favorite-btn:hover {
  opacity: 0.7;
}

/* Actions */
.favorites-actions {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid var(--gunmetal);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Button Styles */
.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: var(--gunmetal);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: var(--black);
}

.btn-danger {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.btn-danger-outline {
  background-color: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-danger-outline:hover {
  background-color: #e74c3c;
  color: white;
}

/* Modal Styles (reused from original) */
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

.modal {
  background-color: var(--raisinBlack);
  border-radius: 0.75rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.modal-header h4 {
  margin: 0;
  color: white;
}

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

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--frenchGray);
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gunmetal);
  border-radius: 0.5rem;
  background-color: var(--black);
  color: white;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Messages */
.success-message,
.error-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.success-message {
  background-color: #059669;
}

.error-message {
  background-color: #dc2626;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-direction: column;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
  }

  .profile-content {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .word-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>