<script setup>
import DictionarySearch from "./components/DictionarySearch.vue";
import CVSUploader from "./components/CVSUploader.vue";
import { uploadEntries } from "./utils";
import { ref, onMounted } from "vue";
import db from "./db.js";

// Reactive variable to track if data exists
const hasData = ref(false);

onMounted(async () => {
  // Check if there is any data in the 'words' table
  hasData.value = (await db.words.count()) > 0 && (await db.definitions.count()) > 0;
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
      <h1>Taigi Dictionary</h1>
    </div>
  </header>

  <main>
    <DictionarySearch />
    <!-- <CVSUploader /> -->
  </main>
  <footer>
    <!-- Data provided by 2024 Ministry of Education, R.O.C.  -->
  </footer>
</template>

<style scoped>
header {
  line-height: 1.5;
}
@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
