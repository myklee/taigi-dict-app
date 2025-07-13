<script setup>
import DictionarySearch from "./pages/DictionarySearch.vue";
import UserProfile from "./pages/UserProfile.vue";
import CVSUploader from "./components/CVSUploader.vue";
import { uploadEntries } from "./utils";
import RandomWord from "./pages/RandomWord.vue";
import { ref, onMounted, computed } from "vue";
import db from "./db.js";
import { useAuthStore } from "@/stores/authStore";
import AuthHeader from "@/components/auth/AuthHeader.vue";

const authStore = useAuthStore();
const currentRoute = ref('dictionary');

// Simple routing system
const navigate = (route) => {
  currentRoute.value = route;
  // Update URL without page reload
  const path = route === 'dictionary' ? '/' : `/${route}`;
  window.history.pushState({}, '', path);
};

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  const path = window.location.pathname;
  if (path === '/profile') {
    currentRoute.value = 'profile';
  } else {
    currentRoute.value = 'dictionary';
  }
});

// Initialize route based on current URL
onMounted(() => {
  const path = window.location.pathname;
  if (path === '/profile') {
    currentRoute.value = 'profile';
  }
});

// Provide navigation function globally
window.$navigate = navigate;

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
});

// Computed property to determine which component to show
const currentComponent = computed(() => {
  switch (currentRoute.value) {
    case 'profile':
      return UserProfile;
    case 'dictionary':
    default:
      return DictionarySearch;
  }
});
</script>

<template>
  <header>
    <AuthHeader :navigate="navigate" />
  </header>

  <main>
    <component :is="currentComponent" :navigate="navigate" />

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
/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }
}
</style>
