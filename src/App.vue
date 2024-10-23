<script setup>
import DictionarySearch from "./components/DictionarySearch.vue";
import CVSUploader from "./components/CVSUploader.vue";
</script>

<template>
  <header>
    <h1>English · 台語 · 中文</h1>
    <h2></h2>
  </header>

  <main>
    <DictionarySearch />
    <CVSUploader />
  </main>
  <footer>
    <!-- Data provided by 2024 Ministry of Education, R.O.C.  -->
  </footer>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
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
