<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#6b7280"/>
        </svg>
      </div>
      
      <h1 class="error-title">404 - Page Not Found</h1>
      
      <p class="error-message">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div class="error-actions">
        <router-link to="/" class="btn btn-primary">
          Go to Dictionary
        </router-link>
        
        <button @click="goBack" class="btn btn-secondary">
          Go Back
        </button>
      </div>
      
      <div class="error-details" v-if="showDetails">
        <p class="error-path">
          <strong>Requested path:</strong> {{ $route.fullPath }}
        </p>
        
        <p class="error-time">
          <strong>Time:</strong> {{ errorTime }}
        </p>
      </div>
      
      <button @click="toggleDetails" class="toggle-details">
        {{ showDetails ? 'Hide' : 'Show' }} Details
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter()
    const showDetails = ref(false)
    const errorTime = ref('')
    
    onMounted(() => {
      errorTime.value = new Date().toLocaleString()
    })
    
    const goBack = () => {
      if (window.history.length > 1) {
        router.go(-1)
      } else {
        router.push('/')
      }
    }
    
    const toggleDetails = () => {
      showDetails.value = !showDetails.value
    }
    
    return {
      showDetails,
      errorTime,
      goBack,
      toggleDetails
    }
  }
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  width: 100%;
}

.error-icon {
  margin-bottom: 2rem;
  opacity: 0.7;
}

.error-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 1rem;
}

.error-message {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.error-details {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: left;
}

.error-path,
.error-time {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.toggle-details {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: underline;
}

.toggle-details:hover {
  color: #2563eb;
}

@media (max-width: 640px) {
  .error-title {
    font-size: 2rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 200px;
  }
}
</style>