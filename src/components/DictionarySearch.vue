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
      <li class="entry" v-for="(entry, index) in results" :key="index">
        <div class="index">{{ index + 1 }}</div>

        <div class="entry-definition">
          <div class="english-entry">
            {{ entry.word.id }}
            <strong>{{ entry.word.english }}</strong>
            <IconPlayAudio
              @click="speakEnglish(entry.word.english)"
            ></IconPlayAudio>
          </div>
          <div class="chinese-entry">
            <strong>{{ entry.word.chinese }}</strong>
            <IconPlayAudio
              @click="speakChinese(entry.word.chinese)"
            ></IconPlayAudio>
          </div>
          <div class="taigi-entry">
            <strong>{{ entry.word.romaji }}</strong>
            <AudioPlayerTaigi
              v-if="entry.word.audioid"
              :audioID="entry.word.audioid"
            />
          </div>

          <ol v-if="entry.english_definitions">
            <li v-for="(engdef, index) in entry.english_definitions">
              {{ engdef }}  <IconPlayAudio
              @click="speakEnglish(engdef)"
            ></IconPlayAudio>
            </li>
           
          </ol>
          <ol v-if="entry.chinese_definitions">
            <li v-for="(chdef, index) in entry.chinese_definitions">
              {{ chdef }} <IconPlayAudio
              @click="speakChinese(chdef)"
            ></IconPlayAudio>
            </li>

            
          </ol>

          <!-- <div>{{ results }}</div> -->
          <!-- <div v-for="()"></div> -->
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { searchWord } from "@/utils";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import IconPlayAudio from "./icons/IconPlayAudio.vue";

export default {
  components: {
    AudioPlayerTaigi,
    IconPlayAudio,
  },
  data() {
    return {
      searchTerm: "",
      results: [],
      defs: [],
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
    async searchDefs(word) {
      if (this.results) {
        const defs = await db.definitions
          .where("wordid")
          .equals(word)
          .toArray();
        return defs;
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

      // let voices = [];

      // // Load available voices
      // const loadVoices = () => {
      //   voices = speechSynthesis.getVoices();
      //   // You can log the voices to see which ones are available
      //   console.log(voices);
      // };
      // // Find a specific voice if needed
      // const selectedVoice = voices.find((voice) => voice.lang === "zh-TW");

      // loadVoices();
      // if (selectedVoice) {
      //   utterance.voice = selectedVoice;
      // }
      window.speechSynthesis.speak(utterance);
    },
    async speakEnglish(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";

      let voices = [];

      // // Load available voices
      const loadVoices = () => {
        voices = speechSynthesis.getVoices();
        // You can log the voices to see which ones are available
        console.log(voices);
      };
      // // Find a specific voice if needed
      // const selectedVoice = voices.find((voice) => voice.lang === "zh-TW");

      // loadVoices();
      // if (selectedVoice) {
      //   utterance.voice = selectedVoice;
      // }
      window.speechSynthesis.speak(utterance);
    },
  },
};
</script>
