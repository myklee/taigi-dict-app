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
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const emit = defineEmits(['close']);

const authStore = useAuthStore();
const showUpdateProfile = ref(false);
const showChangePassword = ref(false);
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
</style>