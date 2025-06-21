<script setup>
import DictionarySearch from "./pages/DictionarySearch.vue";
import CVSUploader from "./components/CVSUploader.vue";
import { uploadEntries } from "./utils";
import RandomWord from "./pages/RandomWord.vue";
import { ref, onMounted } from "vue";
import db from "./db.js";
import { useAuthStore } from "@/stores/authStore";
import AuthHeader from "@/components/auth/AuthHeader.vue";

const authStore = useAuthStore();

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
</script>

<template>
  <header>
    <div class="header-content">
      <div class="title-section">
        <h1 class="title-app">
          <span class="title-english">English</span>
          <span class="title-chinese">Chinese</span>
          <span class="title-taiwanese">Taiwanese</span>
          <span class="title-dictionary">Dictionary</span>
        </h1>
      </div>
      <AuthHeader />
    </div>
  </header>

  <main>
    <DictionarySearch />
    
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
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.title-section {
  flex: 1;
}

.title-app {
  display: block;
  text-align: left;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.title-app span {
  margin-right: 0.5rem;
}

.title-english {
  color: #3b82f6;
}

.title-chinese {
  color: #ef4444;
}

.title-taiwanese {
  color: #10b981;
}

.title-dictionary {
  color: #6b7280;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .title-app {
    text-align: center;
    font-size: 1.25rem;
  }
  
  .title-app span {
    display: block;
    margin-right: 0;
    margin-bottom: 0.25rem;
  }
}
</style>
