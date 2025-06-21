<template>
  <div class="user-profile">
    <div class="profile-header">
      <div class="user-info">
        <div class="avatar">
          {{ userInitials }}
        </div>
        <div class="user-details">
          <h3>{{ user?.email }}</h3>
          <p class="user-role">{{ userRole }}</p>
        </div>
      </div>
      <button class="close-button" @click="$emit('close')">
        <span>&times;</span>
      </button>
    </div>

    <div class="profile-content">
      <!-- Profile Information -->
      <div class="profile-section">
        <h4>Profile Information</h4>
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

      <!-- Actions -->
      <div class="profile-section">
        <h4>Account Actions</h4>
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
              <input
                id="display-name"
                v-model="profileForm.displayName"
                type="text"
                placeholder="Enter display name"
              />
            </div>
            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea
                id="bio"
                v-model="profileForm.bio"
                placeholder="Tell us about yourself"
                rows="3"
              ></textarea>
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
              <input
                id="current-password"
                v-model="passwordForm.currentPassword"
                type="password"
                required
                placeholder="Enter current password"
              />
            </div>
            <div class="form-group">
              <label for="new-password">New Password</label>
              <input
                id="new-password"
                v-model="passwordForm.newPassword"
                type="password"
                required
                placeholder="Enter new password"
              />
            </div>
            <div class="form-group">
              <label for="confirm-new-password">Confirm New Password</label>
              <input
                id="confirm-new-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                required
                placeholder="Confirm new password"
              />
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
.user-profile {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 50px;
  height: 50px;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.user-details h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.user-role {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
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
  background-color: #f3f4f6;
}

.profile-content {
  padding: 1.5rem;
}

.profile-section {
  margin-bottom: 2rem;
}

.profile-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.info-item span {
  color: #1f2937;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #dc2626;
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

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.success-message {
  background-color: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 1rem;
}

.error-message {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 1rem;
}
</style> 