<!-- src/components/DictionarySearch.vue -->
<template>
  <div>
    <div id="main-search-container">
      <input
        id="main-search"
        v-model="searchTerm"
        placeholder="Search for a word"
        @keyup.enter="searchWords"
        type="search"
      />
      <button @click="searchWords(searchTerm)">Search</button>
      <!-- <div>Choose a voice <button @click="voices()">Show me voices</button></div> -->
    </div>

    <ul class="results" v-if="results.length">
      <li class="entry" v-for="(word, index) in results" :key="index">
        <div class="entry_definition">
          <h3>
            <strong>{{ word.english }}</strong> |
            <strong>{{ word.chinese }}</strong
            >&nbsp;
            <button @click="speakChinese(word.chinese)">Speak</button>
          </h3>
          <h3>
            <strong>{{ word.romaji }}</strong>
          </h3>
        </div>
        <figure v-if="word.audioid">
          <AudioPlayer :audioID="word.audioid" />
        </figure>
      </li>
    </ul>
  </div>
</template>

<script>
import { searchWord } from "@/utils";
import AudioPlayer from "./AudioPlayer.vue";

export default {
  components: {
    AudioPlayer,
  },
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

    voices() {
      let voices = [];

      // Load available voices
      const loadVoices = () => {
        voices = speechSynthesis.getVoices();
        // You can log the voices to see which ones are available
        console.log(voices);
      };
      // Find a specific voice if needed
      const selectedVoice = voices.find((voice) => voice.lang === "en-US");
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      loadVoices();
    },
    async speakChinese(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-TW";
      let voices = [];

      // Load available voices
      const loadVoices = () => {
        voices = speechSynthesis.getVoices();
        // You can log the voices to see which ones are available
        console.log(voices);
      };
      // Find a specific voice if needed
      const selectedVoice = voices.find((voice) => voice.lang === "zh-TW");

      loadVoices();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
    },
  },
};
</script>
