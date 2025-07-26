<template>
  <div v-if="favoritesStore.showLoginPrompt" class="login-prompt-overlay" @click="hidePrompt">
    <div class="login-prompt" @click.stop>
      <div class="login-prompt-header">
        <h3>Sign in to save favorites</h3>
        <button class="close-button" @click="hidePrompt">
          <span>&times;</span>
        </button>
      </div>
      
      <div class="login-prompt-content">
        <p>You need to be logged in to save words to your favorites list.</p>
        <p>Sign in to access your favorites across all your devices!</p>
      </div>
      
      <div class="login-prompt-actions">
        <button class="login-button" @click="openAuthModal">
          Sign In
        </button>
        <button class="cancel-button" @click="hidePrompt">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';

const favoritesStore = useFavoritesStore();
const authStore = useAuthStore();

const hidePrompt = () => {
  favoritesStore.hideLoginPrompt();
};

const openAuthModal = () => {
  hidePrompt();
  authStore.showAuthModalAction('signin');
};
</script>

<style scoped>
.login-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.login-prompt {
  background: var(--raisinBlack);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.login-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.login-prompt-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--white);
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

.login-prompt-content {
  padding: 1rem 1.5rem;
  color: var(--frenchGray);
}

.login-prompt-content p {
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.login-prompt-content p:last-child {
  margin-bottom: 0;
}

.login-prompt-actions {
  display: flex;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
}

.login-button {
  flex: 1;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-button:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cancel-button {
  flex: 1;
  background: none;
  color: var(--frenchGray);
  border: 1px solid var(--gunmetal);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: var(--gunmetal);
  color: var(--white);
}

/* Mobile responsive */
@media (max-width: 480px) {
  .login-prompt {
    margin: 1rem;
  }
  
  .login-prompt-actions {
    flex-direction: column;
  }
  
  .login-button,
  .cancel-button {
    width: 100%;
  }
}
</style>