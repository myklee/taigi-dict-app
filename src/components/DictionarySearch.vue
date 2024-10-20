<!-- src/components/DictionarySearch.vue -->
<template>
  <div>
    <input
      v-model="searchTerm"
      placeholder="Search for a word"
      @keyup.enter="searchWords"
    />
    <button @click="searchWords(searchTerm)">Search</button>
    <ul class="results" v-if="results.length">
      <li class="entry" v-for="(word, index) in results" :key="index">
        <div class="entry_definition">
          <h3>
            <strong>{{ word.english }}</strong>
          </h3>
          <h3>
            <strong>{{ word.chinese }}</strong>
            <button @click="speakChinese(word.chinese)">Speak</button>
          </h3>
          <h3>
            <strong>{{ word.romaji }}</strong>
          </h3>
        </div>
        <figure v-if="word.audioid">
          <!-- <figcaption>Listen to the T-Rex:</figcaption> -->
          <audio
            controls
            :src="`/src/assets/audio/${word.audioid}.mp3`"
          ></audio>
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
    async speakChinese(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-TW";
      window.speechSynthesis.speak(utterance);
    },
  },
};
</script>
