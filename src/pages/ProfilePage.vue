<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>User Profile</h1>
      <button class="btn-back" @click="goBack">
        ← Back to Dictionary
      </button>
    </div>
    
    <div class="profile-container">
      <UserProfile @close="goBack" />
    </div>
  </div>
</template>

<script setup>
import UserProfile from '@/components/auth/UserProfile.vue';

const goBack = () => {
  // Navigate back to dictionary using hash routing
  window.location.hash = '';
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--app-background);
  color: var(--color-text);
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin: 0 auto 2rem auto;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text);
}

.btn-back {
  background-color: var(--button-background);
  color: var(--button-text-color);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-back:hover {
  background-color: var(--gunmetal);
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: var(--raisinBlack);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .btn-back {
    width: 100%;
    justify-content: center;
  }
}
</style> 