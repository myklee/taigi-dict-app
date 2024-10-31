<script setup>
import DictionarySearch from "./components/DictionarySearch.vue";
import CVSUploader from "./components/CVSUploader.vue";
</script>

<template>
  <header>
    <div>
      <h1>台語</h1>
      <h1>辭典</h1>
    </div>
    <div>
      <h1>Taigi</h1>
      <h1>Dict</h1>
    </div>
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
