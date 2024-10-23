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
        <div class="entry-definition">
          <div class="english-entry">
            <strong>{{ word.english }}</strong>
            <IconPlayAudio @click="speakEnglish(word.english)"></IconPlayAudio>

            <!-- <svg
              class="play-audio"
              @click="speakEnglish(word.english)"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M18.7907 9.87402C20.4031 10.8189 20.4031 13.1811 18.7907 14.126L7.62791 20.6674C6.0155 21.6123 4 20.4312 4 18.5415L4 5.45853C4 3.56877 6.0155 2.38767 7.62791 3.33255L18.7907 9.87402ZM17.8605 12.4906C18.2326 12.2726 18.2326 11.7274 17.8605 11.5094L6.69767 4.96792C6.32558 4.74987 5.86046 5.02243 5.86046 5.45853L5.86046 18.5415C5.86046 18.9776 6.32558 19.2501 6.69767 19.0321L17.8605 12.4906Z"
                fill="#fff"
              />
            </svg> -->
          </div>
          <div class="chinese-entry">
            <strong>{{ word.chinese }}</strong>
            <IconPlayAudio @click="speakChinese(word.chinese)"></IconPlayAudio>
            <!-- <button @click="speakChinese(word.chinese)">Speak</button> -->
            <!-- <svg
              class="play-audio"
              @click="speakChinese(word.chinese)"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M18.7907 9.87402C20.4031 10.8189 20.4031 13.1811 18.7907 14.126L7.62791 20.6674C6.0155 21.6123 4 20.4312 4 18.5415L4 5.45853C4 3.56877 6.0155 2.38767 7.62791 3.33255L18.7907 9.87402ZM17.8605 12.4906C18.2326 12.2726 18.2326 11.7274 17.8605 11.5094L6.69767 4.96792C6.32558 4.74987 5.86046 5.02243 5.86046 5.45853L5.86046 18.5415C5.86046 18.9776 6.32558 19.2501 6.69767 19.0321L17.8605 12.4906Z"
                fill="#fff"
              />
            </svg> -->
          </div>
          <div class="taigi-entry">
            <strong>{{ word.romaji }}</strong>
            <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" />
          </div>
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
    IconPlayAudio
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
