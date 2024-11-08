<!-- src/components/DictionarySearch.vue -->
<template>
  <div>
    <div id="main-search-container">
      <input
        id="main-search"
        v-model="searchTerm"
        placeholder="Search for a word"
        @keyup.enter="searchWords(searchTerm, exactSearch)"
        type="search"
        autocapitalize="off"
        class="search-field"
      />
      <button
        class="search-button"
        @click="searchWords(searchTerm, exactSearch)"
      >
        Search
      </button>
    </div>
    <label id="exact_search" for="exactSearch"
      ><input
        id="exactSearch"
        type="checkbox"
        v-model="exactSearch"
        checked
      />Exact search</label
    >
    <div class="result-count">{{ results.length }} results found</div>
    <!-- <p>sé-i̍k/sué-i̍k ā á à ả â ã ē é è ẽ ê i í ì ĩ î o ó ò õ ô ō u ú ù ũ û ū b̍ p̍ t̍ k̍ g̍ n̍ s̍ m̍ l̍ h̍ ê ē e̍ a̍ i̍ o̍ u̍ ā ô ō ê ỉ ṳ ě ̍ ̑ ạtē-ga̍k/tuē-ga̍k</p> -->
    <ul class="results" v-if="results.length">
      <!-- <li class="result-count">{{ results.length }} results found</li> -->
      <li class="entry" v-for="(entry, index) in results" :key="index">
        <!-- <div class="index">{{ index + 1 }}</div> -->

        <div class="entry-items">
          <div class="entry-item english-entry">
            {{ entry.word.english }}
            <IconPlayAudio
              @click="speakEnglish(entry.word.english)"
            ></IconPlayAudio>
          </div>
          <div class="entry-item chinese-entry">
            {{ entry.word.chinese }}
            <IconPlayAudio
              @click="speakChinese(entry.word.chinese)"
            ></IconPlayAudio>
          </div>
          <div class="entry-item taigi-entry">
            {{ entry.word.romaji }}
            <AudioPlayerTaigi
              v-if="entry.word.audioid"
              :audioID="entry.word.audioid"
            />
          </div>
        </div>
        <div class="definitions">
          <ol v-if="entry.english_definitions">
            <li v-for="(engdef, index) in entry.english_definitions">
              {{ engdef }}
              <IconPlayAudio @click="speakEnglish(engdef)"></IconPlayAudio>
            </li>
          </ol>
          <ol v-if="entry.chinese_definitions">
            <li v-for="(chdef, index) in entry.chinese_definitions">
              {{ chdef }}
              <IconPlayAudio @click="speakChinese(chdef)"></IconPlayAudio>
            </li>
          </ol>
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
      exactSearch: false,
    };
  },
  methods: {
    async searchWords(term, exact) {
      if (this.searchTerm) {
        this.results = await searchWord(term, exact);
      } else {
        this.results = [];
      }
    },
    async speakChinese(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-TW";
      window.speechSynthesis.speak(utterance);
    },
    async speakEnglish(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      window.speechSynthesis.speak(utterance);
    },
  },
};
</script>
