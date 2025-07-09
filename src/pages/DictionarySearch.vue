<template>
  <Loader :loading="loading" />
  <!-- <button @click="updatepinyin">update pinyin</button> -->
  <!-- <button @click="processZhuyinColumn">update zhuyin</button> -->
  <div id="dictionary-search">
    <section class="search-header">
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
          @click="clearSearch"
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
            type="checkbox"
            id="exact-search"
            v-model="exactSearch"
            @change="searchWords"
          />
          <label for="exact-search">Strict search</label>
        </div>
        <div class="search-actions">
          <button class="search-button" @click="searchWords">Search</button>
        </div>
      </div>
    </section>

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

    <RandomWord v-if="dictionaryStore.showRandomWord" />

    <!-- moe search results -->
    <section v-if="dictionaryStore.searchResults.length">
      <header class="moe-search-results-header search-results-header">
        <h4 class="moe-title">
          Ministry of Education Taiwanese Dictionary of Common Words
          教育部臺灣台語常用詞辭典
        </h4>

        <div v-if="searchExecuted" class="results-count">
          {{ dictionaryStore.searchResults.length }} result<span
            v-if="dictionaryStore.searchResults.length != 1"
            >s</span
          >
          found
        </div>
      </header>
      <ul class="results moe-results">
        <li
          v-for="word in dictionaryStore.searchResults"
          :key="word.id"
          class="entry moe-result-item"
        >
          <div
            v-if="word.romaji != null"
            :class="['word-item', 'moe-word-taigi', 'alphabetic', { 'phonetic-highlight': searchMode === 'phonetic' }]"
          >
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
              <Pinyinzhuyin :han="word.chinese" />
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
          <IconEdit
            class="edit-word"
            title="Edit entry"
            @click="openEditDialog(word)"
          />
        </li>
      </ul>
    </section>

    <!-- driect mknoll results-->
    <section class="mknoll" v-if="dictionaryStore.mknollResults.length">
      <header class="mknoll-search-results-header search-results-header">
        <h4 class="mknoll-title">Mary Knoll Dictionary</h4>
      </header>
      <ul class="mknoll-results">
        <li v-for="(word, index) in dictionaryStore.mknollResults" :key="index">
          <div>
            <!-- {{ word.id }} -->
            {{ word.audio_url }}
            <div class="mknoll-taiwanese">
              {{ word.taiwanese }}
            </div>
            <div class="mknoll-chinese">
              {{ word.chinese }}
              <Pinyinzhuyin :han="word.chinese" />
            </div>
          </div>
          <div class="mknoll-english">
            {{ word.english_mknoll }}
            <audio
              v-if="word.audio_url"
              ref="audio"
              :src="`${word.audio_url}`"
              controls
            ></audio>
          </div>
          <IconEdit title="Edit entry" @click="openEditDialogMknoll(word)" />
        </li>
      </ul>
    </section>

    <!-- driect ccedict results-->

    <section v-if="dictionaryStore.cedictResults.length">
      <header class="cedict-search-results-header search-results-header">
        <h4 class="cedict-title">
          CC-CEDICT (Creative Commons Chinese English Dictionary)
        </h4>
      </header>
      <ul class="cedict-results">
        <li v-for="(word, index) in dictionaryStore.cedictResults" :key="index">
          <div>
            {{ word.traditional }}
            <Pinyinzhuyin :han="word.traditional" />
          </div>
          <div>{{ word.english_cedict }}</div>
        </li>
      </ul>
    </section>
    <!-- cross ref cedict-->

    <section v-if="dictionaryStore.crossRefResults.length > 0">
      <header class="search-results-header">
        <h4 class="section-header cedict-header">CC-CEDICT Cross reference</h4>
      </header>
      <ul class="cedict-crossref">
        <li
          class="cedict-item"
          v-for="(wordcedict, index) in dictionaryStore.crossRefResults"
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
            <Pinyinzhuyin :han="wordcedict.traditional" />
          </div>
          <div class="cedict-english">
            {{ wordcedict.english_cedict }}
          </div>
        </li>
      </ul>
    </section>

    <EditWord
      :visible="showDialog"
      :word="selectedWord"
      @close="closeDialog()"
    />
    <EditWordMknoll
      :visible="showDialogMknoll"
      :word="selectedWordMknoll"
      @close="closeDialogMknoll()"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useDictionaryStore } from "@/stores/dictionaryStore";
import { supabase } from "@/supabase";
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import { speakChinese } from "@/utils";
import { speakEnglish } from "@/utils";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import Loader from "@/components/utility/Loader.vue";
import EditWord from "./EditWord.vue";
import EditWordMknoll from "./EditWordMknoll.vue";
import RandomWord from "./RandomWord.vue";
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import IconEdit from "@/components/icons/IconEdit.vue";

const dictionaryStore = useDictionaryStore();
const searchQuery = ref("");
const exactSearch = ref(false);
const loading = ref(false);
const searchExecuted = ref(false);
const showDialog = ref(false);
const showDialogMknoll = ref(false);
const selectedWord = ref(null);
const selectedWordMknoll = ref(null);
const searchMode = ref("all");

const closeDialog = () => {
  showDialog.value = false;
  document.body.style.overflow = "scroll";
};

const closeDialogMknoll = () => {
  showDialogMknoll.value = false;
  document.body.style.overflow = "scroll";
};

const openEditDialog = (word) => {
  selectedWord.value = word;
  showDialog.value = true;
  document.body.style.overflow = "hidden";
};

const openEditDialogMknoll = (word) => {
  selectedWordMknoll.value = word;
  showDialogMknoll.value = true;
  document.body.style.overflow = "hidden";
};

const clearSearch = () => {
  searchQuery.value = "";
  searchWords();
};

const searchWords = async () => {
  if (!searchQuery.value.trim()) {
    searchExecuted.value = false;
    return;
  }

  loading.value = true;
  searchExecuted.value = true;

  try {
    // Add to search history
    await dictionaryStore.addToHistory(searchQuery.value);

    // Determine search pattern based on exactSearch setting
    const searchPattern = exactSearch.value ? searchQuery.value : `%${searchQuery.value}%`;

    // Build search query based on search mode
    let moeSearchQuery = supabase
      .from("words")
      .select(`
        *,
        definitions (
          defid,
          wordid,
          partofspeech,
          def_chinese,
          def_english
        )
      `);

    let mknollSearchQuery = supabase
      .from("maryknoll")
      .select("*");

    let cedictSearchQuery = supabase
      .from("cedict")
      .select("*");

    // Apply search mode filters
    switch (searchMode.value) {
      case "phonetic":
        // Search only Taiwanese romanization (romaji)
        moeSearchQuery = moeSearchQuery.or(`romaji.ilike.${searchPattern}`);
        mknollSearchQuery = mknollSearchQuery.or(`taiwanese.ilike.${searchPattern}`);
        cedictSearchQuery = cedictSearchQuery.or(`pinyin.ilike.${searchPattern}`);
        break;
      case "chinese":
        // Search only Chinese characters
        moeSearchQuery = moeSearchQuery.or(`chinese.ilike.${searchPattern}`);
        mknollSearchQuery = mknollSearchQuery.or(`chinese.ilike.${searchPattern}`);
        cedictSearchQuery = cedictSearchQuery.or(`traditional.ilike.${searchPattern},simplified.ilike.${searchPattern}`);
        break;
      case "english":
        // Search only English
        moeSearchQuery = moeSearchQuery.or(`english.ilike.${searchPattern}`);
        mknollSearchQuery = mknollSearchQuery.or(`english_mknoll.ilike.${searchPattern}`);
        cedictSearchQuery = cedictSearchQuery.or(`english_cedict.ilike.${searchPattern}`);
        break;
      default:
        // Search all fields (original behavior)
        moeSearchQuery = moeSearchQuery.or(`chinese.ilike.${searchPattern},english.ilike.${searchPattern},romaji.ilike.${searchPattern}`);
        mknollSearchQuery = mknollSearchQuery.or(`taiwanese.ilike.${searchPattern},chinese.ilike.${searchPattern},english_mknoll.ilike.${searchPattern}`);
        cedictSearchQuery = cedictSearchQuery.or(`traditional.ilike.${searchPattern},simplified.ilike.${searchPattern},english_cedict.ilike.${searchPattern}`);
    }

    // Execute searches
    const { data: moeResults, error: moeError } = await moeSearchQuery.limit(50);
    if (moeError) throw moeError;

    const { data: mknollResults, error: mknollError } = await mknollSearchQuery.limit(20);
    if (mknollError) throw mknollError;

    const { data: cedictResults, error: cedictError } = await cedictSearchQuery.limit(20);
    if (cedictError) throw cedictError;

    // Cross-reference search (only for Chinese mode or all mode)
    let crossRefResults = [];
    if (searchMode.value === "chinese" || searchMode.value === "all") {
      const { data: crossRefData, error: crossRefError } = await supabase
        .from("cedict")
        .select("*")
        .or(`traditional.ilike.${searchPattern},simplified.ilike.${searchPattern}`)
        .limit(10);
      
      if (crossRefError) throw crossRefError;
      crossRefResults = crossRefData || [];
    }

    // Update store
    await dictionaryStore.setSearchResults(moeResults || []);
    await dictionaryStore.setMknollResults(mknollResults || []);
    await dictionaryStore.setCedictResults(cedictResults || []);
    await dictionaryStore.setCrossRefCedict(crossRefResults);

  } catch (error) {
    console.error("Search error:", error);
  } finally {
    loading.value = false;
  }
};

const readChinese = async (text) => {
  speakChinese(text);
};

const readEnglish = async (text) => {
  speakEnglish(text);
};

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

// Load data on mount
onMounted(async () => {
  await dictionaryStore.loadFromIndexedDB();
  await dictionaryStore.loadSearchHistoryFromSupabase();
});

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    searchExecuted.value = false;
  }
});
</script>

<style scoped>
/*

search

*/

.search-header {
  background-color: var(--raisinBlack);
}
.search-words {
  position: relative;
  padding: 0 5vw;
}
.search-words-text-field {
  width: 100%;
  border: none;
  border-bottom: 3px solid;
  padding: 1rem;
  background-color: transparent;
}
.clear-search {
  position: absolute;
  right: calc(5vw);
  background-color: transparent;
  color: var(--frenchGray);
  &:hover {
    color: white;
  }
  &::after {
    display: block;
    content: "+";
    font-size: 2.5rem;
    transform: rotate(45deg);
  }
}
.search-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5vw;
  flex-wrap: wrap;
  gap: 1rem;
}
.reset-voice {
  justify-self: end;
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

exact search checkbox

*/

.exact-search-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-right: 1rem;
  padding: 1rem;
  padding-left: 0;
  label {
    white-space: nowrap;
  }
}
.search-history {
  padding: 0 5vw 5vw;
}
.search-history-header {
  display: flex;
  align-items: center;
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

MOE results header

*/
.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1vh 5vw 0 5vw;
}
.moe-search-results-header {
  padding-top: 0;
}
.results {
  margin: 0 5vw;
  border-bottom: 1px solid var(--gunmetal);
}
.results-count {
  padding: 0.5rem 0;
}

/*

MOE result items

*/
.moe-title {
  padding-bottom: 1rem;
}
.moe-result-item {
  padding: 0rem 0 2rem 0;
  background-color: var(--black);
  border-radius: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  position: relative;
  .pinyin-zhuyin {
    font-size: 1rem;
  }
}
.moe-word-taigi {
  font-size: 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.phonetic-highlight {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem;
  border-left: 4px solid var(--frenchGray);
}
.moe-english-chinese {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}
.moe-word-chinese,
.moe-word-english {
  display: flex;
  align-items: center;
  gap: 0.66rem;
  font-size: 1rem;
}
.moe-word-chinese {
  font-size: 1.5rem;
  line-height: 100%;
}

/*

cedict, mknoll, crossref results


*/
.mknoll-results,
.cedict-results,
.cedict-crossref {
  padding: 1vw 5vw;
  li {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    border-bottom: 1px solid var(--gunmetal);
    word-break: break-all;
  }
}
.mknoll-results {
  li {
    display: flex;
    flex-direction: column;
    align-items: start;
  }
}
.cedict-pinyin-zhuyin {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
}

/* 

admin

*/
.admin {
  padding: 5vw;
}
</style> 