<template>
  <Loader :loading="loading" />
  <!-- <button @click="updatepinyin">update pinyin</button> -->
  <!-- <button @click="processZhuyinColumn">update zhuyin</button> -->
  <div id="supasearch">
    <div class="search-header">
      <div class="search-words">
        <input
          type="text"
          v-model="searchQuery"
          @keyup.enter="searchWords"
          :placeholder="getPlaceholderText()"
          class="text-field search-words-text-field"
          autocapitalize="off"
        />
        <button
          v-if="searchQuery.length > 0"
          class="clear-search"
          @click="clearInput"
        >
          <span class="visually-hidden">Clear</span>
        </button>
      </div>
      <div class="search-options">
        <div class="search-mode-container">
          <label for="search-mode">Search mode:</label>
          <select 
            id="search-mode" 
            v-model="searchMode" 
            @change="searchWords"
            class="search-mode-select"
          >
            <option value="all">All (English, Chinese, Taiwanese)</option>
            <option value="phonetic">Phonetic (Taiwanese romanization)</option>
            <option value="chinese">Chinese characters</option>
            <option value="english">English</option>
          </select>
        </div>
        <div class="exact-search-container">
          <input
            id="exact-search"
            type="checkbox"
            v-model="exactSearch"
            @change="searchWords"
          />
          <label for="exact-search">Exact Search</label>
        </div>
        <div class="search-actions">
          <button class="search-button" @click="searchWords">Search</button>
        </div>
      </div>
      <!-- search history -->
      <div
        v-if="dictionaryStore.searchHistory.length > 0"
        class="search-history"
      >
        <div class="search-history-header">
          <h3>Search History</h3>
          <button
            class="search-history-trash"
            @click="dictionaryStore.clearSearchHistory"
          >
            Clear search history
          </button>
        </div>
        <ul>
          <li
            v-for="(term, index) in dictionaryStore.searchHistory"
            :key="index"
          >
            {{ term.term }}
          </li>
        </ul>
      </div>

      <div class="moe-search-results-header search-results-header">
        <div v-if="searchExecuted" class="results-count">
          {{ dictionaryStore.searchResults.length }} result<span
            v-if="dictionaryStore.searchResults.length != 1"
            >s</span
          >
          found
        </div>
        <!-- <button class="reset-voice" @click="resetVoice">Reset Voice</button> -->
      </div>
    </div>

    <!-- Phonetic search hint -->
    <section v-if="searchMode === 'phonetic'" class="phonetic-hint">
      <div class="hint-content">
        <p>💡 <strong>Phonetic Search Tips:</strong></p>
        <ul>
          <li>Use Taiwanese romanization (Tâi-lô) like "tshuē" for 搜</li>
          <li>Try partial matches: "tsh" will find words starting with "tsh"</li>
          <li>Common patterns: "a̍" (a with dot below), "o͘" (o with dot above)</li>
        </ul>
      </div>
    </section>

    <ul
      v-if="dictionaryStore.searchResults.length != 0"
      class="results moe-results"
    >
      <li>
        <div class="moe-title" v-if="dictionaryStore.searchResults.length">
          <div>Ministry of Education Taiwanese Dictionary of Common Words</div>
          <div>教育部臺灣台語常用詞辭典</div>
        </div>
      </li>
      <li
        v-for="word in dictionaryStore.searchResults"
        :key="word.id"
        class="entry moe-result-item"
      >
        <div
          v-if="word.romaji != null"
          :class="['word-item', 'moe-word-taigi', 'alphabetic', { 'phonetic-highlight': searchMode === 'phonetic' }]"
        >
          <!-- <header>Taiwanese Taigi</header> -->
          <p>{{ word.romaji }}</p>
          <audio
            v-if="word.audio_url"
            ref="audio"
            :src="`${word.audio_url}`"
            controls
          ></audio>

          <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" />
        </div>

        <div class="moe-english-chinese">
          <div
            v-if="word.chinese != null"
            class="word-item moe-word-chinese logographic"
          >
            <span class="">{{ word.chinese }}</span>
            <div class="pinyin-zhuyin">
              <span class="pinyin">{{ pinyin(word.chinese).join(" ") }}</span>
              <span class="zhuyin">{{ word.zhuyin }}</span>
            </div>
            <IconPlayAudio @click="readChinese(word.chinese)"></IconPlayAudio>
          </div>
          <div
            v-if="word.english != null"
            class="word-item moe-word-english alphabetic"
          >
            {{ word.english }}
            <IconPlayAudio @click="readEnglish(word.english)" />
          </div>
        </div>
        <ul>
          <li v-for="def in word.definitions" :key="def.id">
            <ul>
              <li class="alphabetic">{{ def.def_english }}</li>
              <li class="logographic">{{ def.def_chinese }}</li>
            </ul>
          </li>
        </ul>
        <button class="edit-word" @click="openEditDialog(word)">
          Edit word
        </button>
      </li>
    </ul>
    <!-- CC - CEDICDT -->

    <ul v-if="wordsCedict.length" class="results-cedict">
      <h2 class="section-header cedict-header">
        CC-CEDICT (Creative Commons Chinese English Dictionary)
      </h2>
      <li
        class="cedict-item"
        v-for="(wordcedict, index) in wordsCedict"
        :key="index"
      >
        <p v-if="wordcedict.traditional != null" class="cedict-traditional">
          {{ wordcedict.traditional }}
        </p>
        <p class="cedict-traditional" v-if="wordcedict.traditional === null">
          {{ wordcedict.chinese }}
        </p>

        <IconPlayAudio
          v-if="wordcedict.traditional"
          @click="readChinese(wordcedict.traditional)"
        ></IconPlayAudio>
        <IconPlayAudio
          v-if="wordcedict.traditional === null && wordcedict.chinese != null"
          @click="readChinese(wordcedict.chinese)"
        ></IconPlayAudio>

        <div class="pinyin-zhuyin cedict-pinyin-zhuyin">
          <p class="cedict-pinyin pinyin">
            {{ pinyin(wordcedict.traditional).join(" ") }}
          </p>
          <p class="cedict-zhuyin zhuyin">
            {{ fromPinyin(pinyin(wordcedict.traditional).join(" ")).join(" ") }}
          </p>
        </div>
        <p class="cedict-english">{{ wordcedict.english_cedict }}</p>
      </li>
    </ul>
    <EditWord
      :visible="showDialog"
      :word="word"
      @close="closeDialog()"
      @word-updated="refreshSearchResults"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/supabase";
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import { speakChinese, speakEnglish } from "@/utils";
import EditWord from "./EditWord.vue";
import Loader from "@/components/utility/Loader.vue";
import fromPinyin from "zhuyin";

import { useDictionaryStore } from "../stores/dictionaryStore";

const words = ref([]);
const wordsCedict = ref([]);
const searchQuery = ref("");
const exactSearch = ref(false);
const searchMode = ref("all");
const word = ref(null);
const showDialog = ref(false);
const newDefinition = ref({
  partofspeech: "",
  def_english: "",
  def_chinese: "",
});
const loading = ref(false);
const searchExecuted = ref(false);
const searchHistory = ref([]);

const dictionaryStore = useDictionaryStore();

onMounted(() => {
  dictionaryStore.loadFromIndexedDB();
});

const clearInput = () => {
  searchQuery.value = "";
  words.value = [];
  wordsCedict.value = [];
  searchExecuted.value = false;
  dictionaryStore.searchResults = [];
};

const openEditDialog = (selectedWord) => {
  console.log(selectedWord);
  showDialog.value = true;
  document.body.style.overflow = "hidden";
  word.value = {
    ...selectedWord,
    definitions: selectedWord.definitions || [], // Initialize as an empty array if undefined
  };
};

const closeDialog = () => {
  showDialog.value = false;
  document.body.style.overflow = "scroll";
};
const refreshSearchResults = async () => {
  searchWords();
};

const searchWords = async () => {
  if (searchQuery.value.length != 0) {
    try {
      //save history
      // saveSearch(searchQuery.value);
      dictionaryStore.addToHistory(searchQuery.value);

      loading.value = true; // Start loading
      searchExecuted.value = true;
      
      // Determine search pattern based on exactSearch setting
      const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;
      
      let query = supabase
        .from("words")
        .select(
          `id, english, chinese, romaji, audioid, pinyin, zhuyin, taiwanese, audio_url, english_mknoll, definitions (defid, def_english, def_chinese)`
        );

      // Apply search mode filters
      switch (searchMode.value) {
        case "phonetic":
          // Search only Taiwanese romanization (romaji)
          query = query.or(`romaji.ilike.${searchPattern}`);
          break;
        case "chinese":
          // Search only Chinese characters
          query = query.or(`chinese.ilike.${searchPattern}`);
          break;
        case "english":
          // Search only English
          query = query.or(`english.ilike.${searchPattern},english_mknoll.ilike.${searchPattern}`);
          break;
        default:
          // Search all fields (original behavior)
          query = query.or(
            `chinese.ilike.${searchPattern},english.ilike.${searchPattern},english_mknoll.ilike.${searchPattern},romaji.ilike.${searchPattern},taiwanese.ilike.${searchPattern}`
          );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching words:", error.message);
      } else {
        // words.value = data;
        dictionaryStore.setSearchResults(data);
        // words.value = dictionaryStore.searchResults;
      }
      // cross reference cedict (only for Chinese mode or all mode)
      if (searchMode.value === "chinese" || searchMode.value === "all") {
        searchWordsAndCedict(searchQuery.value);
      } else {
        wordsCedict.value = [];
      }
    } catch (err) {
      console.error("Error in searchWords:", err.message);
    } finally {
      loading.value = false; // stop loading
    }
  } else {
    console.log("empty search field!");
  }
};

const searchWordsAndCedict = async (searchTerm) => {
  try {
    const { data, error } = await supabase.rpc("search_words_cedict", {
      search_term: searchTerm,
    });

    if (error) {
      console.error("Error fetching search results:", error.message);
      return [];
    }

    wordsCedict.value = data;

    console.log("Search results:", data);
    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return [];
  }
};

const readChinese = (text) => speakChinese(text);
const readEnglish = (text) => speakEnglish(text);
const resetVoice = () => window.speechSynthesis.cancel();

const getPlaceholderText = () => {
  switch (searchMode.value) {
    case "phonetic":
      return "Search phonetic (Taiwanese romanization) · 台羅搜尋";
    case "chinese":
      return "Search Chinese characters · 中文搜尋";
    case "english":
      return "Search English · 英文搜尋";
    default:
      return "Search English, Chinese, Taiwanese · 中文或英文搜尋";
  }
};
</script>

<style scoped>
.search-history {
  padding: 0 5vw 5vw;
}
.search-history-header {
  display: flex;
  align-items: center;
}

/*

search mode selector

*/

.search-mode-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 1rem;
  padding-left: 0;
  label {
    white-space: nowrap;
    color: var(--frenchGray);
  }
}

.search-mode-select {
  background-color: var(--black);
  color: var(--frenchGray);
  border: 1px solid var(--gunmetal);
  border-radius: 0.25rem;
  padding: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    border-color: var(--frenchGray);
  }
  
  &:focus {
    outline: none;
    border-color: white;
  }
}

/*

phonetic search hint

*/

.phonetic-hint {
  background-color: var(--black);
  margin: 0 5vw;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.hint-content {
  color: var(--frenchGray);
  font-size: 0.9rem;
}

.hint-content p {
  margin: 0 0 0.5rem 0;
}

.hint-content ul {
  margin: 0;
  padding-left: 1.5rem;
}

.hint-content li {
  margin: 0.25rem 0;
}

/*

search options layout

*/

.search-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5vw;
  flex-wrap: wrap;
  gap: 1rem;
}

/*

phonetic highlight

*/

.phonetic-highlight {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem;
  border-left: 4px solid var(--frenchGray);
}
</style>
