<script setup>
import DictionarySearch from "./components/DictionarySearch.vue";
import SupabaseSearch from "./pages/SupabaseSearch.vue";
import CVSUploader from "./components/CVSUploader.vue";
import { uploadEntries } from "./utils";
import RandomWord from "./pages/RandomWord.vue";
import { ref, onMounted } from "vue";
import db from "./db.js";

// Reactive variable to track if data exists
const hasData = ref(false);

onMounted(async () => {
  // Check if there is any data in the 'words' table
  hasData.value =
    (await db.words.count()) > 0 && (await db.definitions.count()) > 0;
  console.log(db);
  if (hasData.value) {
    console.log("Data is available in IndexedDB.");
  } else {
    console.log("No data in IndexedDB.");
    uploadEntries();
  }
});
</script>

<template>
  <header>
    <!-- <div>
      <h1>台語</h1>
      <h1>辭典</h1>
    </div> -->
    <div>
      <h1 class="title-app">
        <span class="title-english">English</span>
        <span class="title-chinese">Chinese</span>
        <span class="title-taiwanese">Taiwanese</span>
        <span class="title-dictionary">Dictionary</span>
      </h1>
    </div>
  </header>

  <main>
    <!-- <DictionarySearch /> -->
    <SupabaseSearch />
    <RandomWord />
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
.title-app {
  display: none;
  text-align: center;
  span {
    margin:1rem;
  }
}
</style>
