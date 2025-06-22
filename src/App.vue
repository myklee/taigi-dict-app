<script setup>
import DictionarySearch from "./pages/DictionarySearch.vue";
import ProfilePage from "./pages/ProfilePage.vue";
import CVSUploader from "./components/CVSUploader.vue";
import { uploadEntries } from "./utils";
import RandomWord from "./pages/RandomWord.vue";
import { ref, onMounted, computed } from "vue";
import db from "./db.js";
import { useAuthStore } from "@/stores/authStore";
import AuthHeader from "@/components/auth/AuthHeader.vue";

const authStore = useAuthStore();
const currentRoute = ref('dictionary');

// // Reactive variable to track if data exists
// const hasData = ref(false);

// onMounted(async () => {
//   // Check if there is any data in the 'words' table
//   hasData.value =
//     (await db.words.count()) > 0 && (await db.definitions.count()) > 0;
//   console.log(db);
//   if (hasData.value) {
//     console.log("Data is available in IndexedDB.");
//   } else {
//     console.log("No data in IndexedDB.");
//     uploadEntries();
//   }
// });

onMounted(async () => {
  // Initialize authentication
  await authStore.initializeAuth();
  
  // Set up hash change listener for navigation
  const handleHashChange = () => {
    const hash = window.location.hash.slice(1); // Remove the #
    currentRoute.value = hash === 'profile' ? 'profile' : 'dictionary';
  };
  
  // Set initial route
  handleHashChange();
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);
});

// Computed property to determine which component to show
const currentComponent = computed(() => {
  return currentRoute.value === 'profile' ? ProfilePage : DictionarySearch;
});

// Navigation functions
const goToDictionary = () => {
  window.location.hash = '';
};

const goToProfile = () => {
  window.location.hash = '#profile';
};
</script>

<template>
  <header>
    <div class="header-content">
      <AuthHeader />
    </div>
  </header>

  <!-- Navigation Bar -->
  <nav class="main-nav">
    <div class="nav-container">
      <div class="nav-links">
        <button 
          class="nav-link" 
          :class="{ active: currentRoute === 'dictionary' }"
          @click="goToDictionary"
        >
          <span class="nav-icon">📚</span>
          Dictionary
        </button>
        <button 
          v-if="authStore.isAuthenticated"
          class="nav-link" 
          :class="{ active: currentRoute === 'profile' }"
          @click="goToProfile"
        >
          <span class="nav-icon">👤</span>
          Profile
        </button>
      </div>
    </div>
  </nav>

  <main>
    <component :is="currentComponent" />
    
    <!-- <div id="auth">
      <input type="email" id="email" placeholder="Email" />
      <input type="password" id="password" placeholder="Password" />
      <button onclick="login()">Login</button>
      <button onclick="signUp()">Sign Up</button>
      <button onclick="logout()">Logout</button>
    </div> -->
  </main>
  <footer>
    <!-- Data provided by 2024 Ministry of Education, R.O.C.  -->
  </footer>
</template>

<style scoped>
.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Navigation Styles */
.main-nav {
  background-color: var(--raisinBlack);
  border-bottom: 1px solid var(--gunmetal);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 0;
}

.nav-link {
  background: none;
  border: none;
  color: var(--frenchGray);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  background-color: var(--gunmetal);
  color: var(--white);
}

.nav-link.active {
  background-color: var(--black);
  color: var(--white);
}

.nav-icon {
  font-size: 1.2rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }

  .nav-container {
    padding: 0 1rem;
  }

  .nav-links {
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
