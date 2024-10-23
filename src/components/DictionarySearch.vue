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
          <!-- <figcaption>Listen to the T-Rex:</figcaption> -->
          <audio
            controls
            :src="
              `src/assets/audio_taigi/` +
              this.getAudioFolder(word.audioid) +
              `/${word.audioid}.mp3`
            "
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
    getAudioFolder(audioid) {
      const audioidnum = parseInt(audioid.match(/^(\d+)\(/)[1]);
      // console.log(audioid);
      if (audioidnum < 1000) {
        return "0";
      } else if (audioidnum >= 1000 && audioidnum < 2000) {
        return "1";
      } else if (audioidnum >= 2000 && audioidnum < 3000) {
        return "2";
      } else if (audioidnum >= 3000 && audioidnum < 4000) {
        return "3";
      } else if (audioidnum >= 4000 && audioidnum < 5000) {
        return "4";
      } else if (audioidnum >= 5000 && audioidnum < 6000) {
        return "5";
      } else if (audioidnum >= 6000 && audioidnum < 7000) {
        return "6";
      } else if (audioidnum >= 7000 && audioidnum < 8000) {
        return "7";
      } else if (audioidnum >= 8000 && audioidnum < 9000) {
        return "8";
      } else if (audioidnum >= 9000 && audioidnum < 10000) {
        return "9";
      } else if (audioidnum >= 10000 && audioidnum < 11000) {
        return "10";
      } else if (audioidnum >= 11000 && audioidnum < 12000) {
        return "11";
      } else if (audioidnum >= 12000 && audioidnum < 13000) {
        return "12";
      } else if (audioidnum >= 13000 && audioidnum < 14000) {
        return "13";
      } else if (audioidnum >= 14000 && audioidnum < 15000) {
        return "14";
      } else if (audioidnum >= 15000 && audioidnum < 16000) {
        return "15";
      } else if (audioidnum >= 16000 && audioidnum < 17000) {
        return "16";
      } else if (audioidnum >= 17000 && audioidnum < 18000) {
        return "17";
      } else if (audioidnum >= 18000 && audioidnum < 19000) {
        return "18";
      } else if (audioidnum >= 19000 && audioidnum < 20000) {
        return "19";
      } else if (audioidnum >= 20000 && audioidnum < 21000) {
        return "20";
      } else if (audioidnum >= 21000 && audioidnum < 22000) {
        return "21";
      } else if (audioidnum >= 22000 && audioidnum < 23000) {
        return "22";
      } else if (audioidnum >= 23000 && audioidnum < 24000) {
        return "23";
      } else if (audioidnum >= 24000 && audioidnum < 25000) {
        return "24";
      } else if (audioidnum >= 25000 && audioidnum < 26000) {
        return "25";
      } else if (audioidnum >= 26000 && audioidnum < 27000) {
        return "26";
      } else if (audioidnum >= 27000 && audioidnum < 28000) {
        return "27";
      } else if (audioidnum >= 28000 && audioidnum < 29000) {
        return "28";
      } else {
        return "Out of range"; // Optional, if you want to handle numbers >= 29000
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
