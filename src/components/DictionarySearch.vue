<!-- src/components/DictionarySearch.vue -->
<template>
  <div>
    <input
      v-model="searchTerm"
      placeholder="Search for a word"
      @keyup.enter="searchWords" 
    />
    <button @click="searchWords(searchTerm)">Search</button>
    <ul v-if="results.length">
      <li v-for="(word, index) in results" :key="index">
        <strong>{{ word.english }}</strong
        >: {{ word.chinese }} <strong>{{ word.romaji }}</strong
        >: {{ word.audioid }}
        <figure v-if="word.audioid">
          <!-- <figcaption>Listen to the T-Rex:</figcaption> -->
          <audio controls :src="`/src/assets/audio/${word.audioid}.mp3`"></audio>
          <!-- <a href="/media/cc0-audio/t-rex-roar.mp3"> Download audio </a> -->
        </figure>
      </li>
    </ul>
  </div>
</template>

<script>
import { searchWord } from "@/utils";

export default {
  data() {
    return {
      searchTerm: "",
      results: [],
    };
  },
  methods: {
    async searchWords() {
      if (this.searchTerm) {
        this.results = await searchWord(this.searchTerm);
      } else {
        this.results = [];
      }
    },
  },
};
</script>
