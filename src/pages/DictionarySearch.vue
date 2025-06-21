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
          placeholder="Search English, Chinese, Taiwanese · 中文或英文搜尋"
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
        <div class="exact-search-container">
          <input
            id="exact-search"
            type="checkbox"
            v-model="exactSearch"
            @change="searchWords"
          />
          <label for="exact-search">Strict search</label>
        </div>
        <div class="actions">
          <button v-if="!showRandomWord" @click="showRandomWord = true">
            Show random word</button
          ><button v-if="showRandomWord" @click="showRandomWord = false">
            Hide random word
          </button>
          <button class="clear-cache" @click="clearCache()">Clear cache</button>
        </div>
        <div class="search-actions">
          <button class="search-button" @click="searchWords">Search</button>
        </div>
      </div>
    </section>

    <RandomWord v-if="showRandomWord" />

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
            class="word-item moe-word-taigi alphabetic"
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
const showRandomWord = ref(false);
const showDialog = ref(false);
const showDialogMknoll = ref(false);
const selectedWord = ref(null);
const selectedWordMknoll = ref(null);

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

const clearInput = () => {
  searchQuery.value = "";
  searchWords();
};

const clearCache = async () => {
  await dictionaryStore.clearSearchHistory();
  await dictionaryStore.clearRandomWordHistory();
  await dictionaryStore.setSearchResults([]);
  await dictionaryStore.setCedictResults([]);
  await dictionaryStore.setMknollResults([]);
  await dictionaryStore.setCrossRefCedict([]);
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

    // Search MOE dictionary
    const { data: moeResults, error: moeError } = await supabase
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
      `)
      .or(
        `chinese.ilike.${searchPattern},english.ilike.${searchPattern},romaji.ilike.${searchPattern}`
      )
      .limit(50);

    if (moeError) throw moeError;

    // Search Mary Knoll dictionary
    const { data: mknollResults, error: mknollError } = await supabase
      .from("maryknoll")
      .select("*")
      .or(
        `taiwanese.ilike.${searchPattern},chinese.ilike.${searchPattern},english_mknoll.ilike.${searchPattern}`
      )
      .limit(20);

    if (mknollError) throw mknollError;

    // Search CC-CEDICT
    const { data: cedictResults, error: cedictError } = await supabase
      .from("cedict")
      .select("*")
      .or(
        `traditional.ilike.${searchPattern},simplified.ilike.${searchPattern},english_cedict.ilike.${searchPattern}`
      )
      .limit(20);

    if (cedictError) throw cedictError;

    // Cross-reference search
    const { data: crossRefResults, error: crossRefError } = await supabase
      .from("cedict")
      .select("*")
      .or(
        `traditional.ilike.${searchPattern},simplified.ilike.${searchPattern}`
      )
      .limit(10);

    if (crossRefError) throw crossRefError;

    // Update store
    await dictionaryStore.setSearchResults(moeResults || []);
    await dictionaryStore.setMknollResults(mknollResults || []);
    await dictionaryStore.setCedictResults(cedictResults || []);
    await dictionaryStore.setCrossRefCedict(crossRefResults || []);

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
#dictionary-search {
  padding-top: 200px;
}
.search-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100vw;
  padding-top: 2rem;
  z-index: 10000;
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
}
.reset-voice {
  justify-self: end;
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