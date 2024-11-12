<script setup>
import DictionarySearch from "./components/DictionarySearch.vue";
import SupabaseSearch from "./components/SupabaseSearch.vue";
import CVSUploader from "./components/CVSUploader.vue";
import { uploadEntries } from "./utils";
import RandomWord from "./components/RandomWord.vue";
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
      <!-- <h1>Taiwanese·English·Chinese</h1> -->
    </div>
  </header>

  <main>
    <!-- <DictionarySearch /> -->
    <SupabaseSearch />
    <RandomWord />
  </main>
  <footer>
    <!-- Data provided by 2024 Ministry of Education, R.O.C.  -->
  </footer>
</template>
