<template>
  <div class="auth-test">
    <h3>Authentication Test</h3>
    
    <!-- Auth Status -->
    <div class="status-section">
      <h4>Status:</h4>
      <p><strong>Authenticated:</strong> {{ isAuthenticated ? 'Yes' : 'No' }}</p>
      <p><strong>Loading:</strong> {{ loading ? 'Yes' : 'No' }}</p>
      <p><strong>User:</strong> {{ user ? user.email : 'None' }}</p>
      <p><strong>Error:</strong> {{ error || 'None' }}</p>
    </div>

    <!-- Auth Actions -->
    <div class="actions-section">
      <h4>Actions:</h4>
      <div class="action-buttons">
        <button @click="showSignIn = true" class="btn-primary">Sign In</button>
        <button @click="showSignUp = true" class="btn-secondary">Sign Up</button>
        <button v-if="isAuthenticated" @click="handleSignOut" class="btn-danger">Sign Out</button>
      </div>
    </div>

    <!-- Test Forms -->
    <div v-if="showSignIn" class="test-form">
      <h4>Sign In Test</h4>
      <input v-model="testEmail" type="email" placeholder="Email" />
      <input v-model="testPassword" type="password" placeholder="Password" />
      <button @click="handleTestSignIn" class="btn-primary">Test Sign In</button>
      <button @click="showSignIn = false" class="btn-secondary">Cancel</button>
    </div>

    <div v-if="showSignUp" class="test-form">
      <h4>Sign Up Test</h4>
      <input v-model="testEmail" type="email" placeholder="Email" />
      <input v-model="testPassword" type="password" placeholder="Password" />
      <button @click="handleTestSignUp" class="btn-primary">Test Sign Up</button>
      <button @click="showSignUp = false" class="btn-secondary">Cancel</button>
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
import AuthModal from './AuthModal.vue';

const authStore = useAuthStore();
const showSignIn = ref(false);
const showSignUp = ref(false);
const showAuthModal = ref(false);
const authMode = ref('signin');
const testEmail = ref('');
const testPassword = ref('');

const isAuthenticated = computed(() => authStore.isAuthenticated);
const loading = computed(() => authStore.loading);
const user = computed(() => authStore.user);
const error = computed(() => authStore.error);

const handleSignOut = async () => {
  await authStore.signOut();
};

const handleTestSignIn = async () => {
  const result = await authStore.signIn(testEmail.value, testPassword.value);
  if (result.success) {
    showSignIn.value = false;
    testEmail.value = '';
    testPassword.value = '';
  }
};

const handleTestSignUp = async () => {
  const result = await authStore.signUp(testEmail.value, testPassword.value);
  if (result.success) {
    showSignUp.value = false;
    testEmail.value = '';
    testPassword.value = '';
  }
};

const handleAuthSuccess = () => {
  showAuthModal.value = false;
};
</script>

<style scoped>
.auth-test {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  max-width: 600px;
}

.status-section, .actions-section {
  margin-bottom: 1rem;
}

.status-section h4, .actions-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.status-section p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.test-form {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.test-form h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.test-form input {
  display: block;
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style> 