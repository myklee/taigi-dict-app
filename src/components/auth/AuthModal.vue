<template>
  <div v-if="visible" class="auth-modal-overlay" @click="closeModal">
    <div class="auth-modal" @click.stop>
      <div class="auth-modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="close-button" @click="closeModal">
          <span>&times;</span>
        </button>
      </div>

      <div class="auth-modal-content">
        <!-- Sign In Form -->
        <form v-if="mode === 'signin'" @submit.prevent="handleSignIn" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="Enter your email"
              :disabled="authStore.loading"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="Enter your password"
              :disabled="authStore.loading"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="authStore.loading">
              <span v-if="authStore.loading">Signing in...</span>
              <span v-else>Sign In</span>
            </button>
            
            <button type="button" class="btn-google" @click="handleGoogleSignIn" :disabled="authStore.loading">
              <svg viewBox="0 0 24 24" class="google-icon">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          <div class="form-links">
            <button type="button" class="link-button" @click="setMode('forgot')">
              Forgot password?
            </button>
            <button type="button" class="link-button" @click="setMode('signup')">
              Don't have an account? Sign up
            </button>
          </div>
        </form>

        <!-- Sign Up Form -->
        <form v-if="mode === 'signup'" @submit.prevent="handleSignUp" class="auth-form">
          <div class="form-group">
            <label for="signup-email">Email</label>
            <input
              id="signup-email"
              v-model="form.email"
              type="email"
              required
              placeholder="Enter your email"
              :disabled="authStore.loading"
            />
          </div>
          
          <div class="form-group">
            <label for="signup-password">Password</label>
            <input
              id="signup-password"
              v-model="form.password"
              type="password"
              required
              placeholder="Enter your password"
              :disabled="authStore.loading"
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              v-model="form.confirmPassword"
              type="password"
              required
              placeholder="Confirm your password"
              :disabled="authStore.loading"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="authStore.loading">
              <span v-if="authStore.loading">Creating account...</span>
              <span v-else>Sign Up</span>
            </button>
          </div>

          <div class="form-links">
            <button type="button" class="link-button" @click="setMode('signin')">
              Already have an account? Sign in
            </button>
          </div>
        </form>

        <!-- Forgot Password Form -->
        <form v-if="mode === 'forgot'" @submit.prevent="handleResetPassword" class="auth-form">
          <div class="form-group">
            <label for="reset-email">Email</label>
            <input
              id="reset-email"
              v-model="form.email"
              type="email"
              required
              placeholder="Enter your email"
              :disabled="authStore.loading"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="authStore.loading">
              <span v-if="authStore.loading">Sending...</span>
              <span v-else>Send Reset Link</span>
            </button>
          </div>

          <div class="form-links">
            <button type="button" class="link-button" @click="setMode('signin')">
              Back to sign in
            </button>
          </div>
        </form>

        <!-- Success Message -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <!-- Error Message -->
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  initialMode: {
    type: String,
    default: 'signin'
  }
});

const emit = defineEmits(['close', 'success']);

const authStore = useAuthStore();
const mode = ref(props.initialMode);
const successMessage = ref('');

const form = ref({
  email: '',
  password: '',
  confirmPassword: ''
});

const modalTitle = computed(() => {
  switch (mode.value) {
    case 'signin': return 'Sign In';
    case 'signup': return 'Create Account';
    case 'forgot': return 'Reset Password';
    default: return 'Authentication';
  }
});

const setMode = (newMode) => {
  mode.value = newMode;
  authStore.clearError();
  successMessage.value = '';
  form.value = { email: '', password: '', confirmPassword: '' };
};

const closeModal = () => {
  emit('close');
  setMode('signin');
};

const handleSignIn = async () => {
  const result = await authStore.signIn(form.value.email, form.value.password);
  if (result.success) {
    successMessage.value = 'Successfully signed in!';
    setTimeout(() => {
      emit('success');
      closeModal();
    }, 1000);
  }
};

const handleSignUp = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    authStore.error = 'Passwords do not match';
    return;
  }
  
  const result = await authStore.signUp(form.value.email, form.value.password);
  if (result.success) {
    successMessage.value = 'Account created! Please check your email to verify your account.';
    setTimeout(() => {
      closeModal();
    }, 3000);
  }
};

const handleGoogleSignIn = async () => {
  const result = await authStore.signInWithGoogle();
  if (result.success) {
    successMessage.value = 'Redirecting to Google...';
  }
};

const handleResetPassword = async () => {
  const result = await authStore.resetPassword(form.value.email);
  if (result.success) {
    successMessage.value = 'Password reset link sent to your email!';
    setTimeout(() => {
      setMode('signin');
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
.auth-modal-overlay {
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

.auth-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.auth-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.auth-modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
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

.auth-modal-content {
  padding: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
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

.btn-google {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-google:hover:not(:disabled) {
  background-color: #f9fafb;
}

.btn-google:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.form-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.link-button {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: underline;
  padding: 0;
}

.link-button:hover {
  color: #2563eb;
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