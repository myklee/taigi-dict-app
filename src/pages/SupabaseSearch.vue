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
          placeholder="Search english and chinese · 中文或英文搜尋"
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
          <IconTrash @click="dictionaryStore.clearSearchHistory" />
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
        <div class="moe-title" v-if="dictionaryStore.searchResults.length">
          <div>Ministry of Education Taiwanese Dictionary of Common Words</div>
          <div>教育部臺灣台語常用詞辭典</div>
        </div>

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

    <ul
      v-if="dictionaryStore.searchResults.length != 0"
      class="results moe-results"
    >
      <li
        v-for="word in dictionaryStore.searchResults"
        :key="word.id"
        class="entry moe-result-item"
      >
        <div
          v-if="word.romaji != null"
          class="word-item moe-word-taigi alphabetic"
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
        <IconEdit
          class="edit-word"
          title="Edit entry"
          @click="openEditDialog(word)"
        />
      </li>
    </ul>
    <!-- driect mknoll results-->
    <div class="mknoll-search-results-header search-results-header">
      <div class="mknoll-title" v-if="dictionaryStore.mknollResults.length">
        <div>Mary Knoll Dictionary</div>
        <!-- <div>教育部臺灣台語常用詞辭典</div> -->
      </div>

      <div v-if="searchExecuted" class="results-count">
        {{ dictionaryStore.mknollResults.length }} result<span
          v-if="dictionaryStore.mknollResults.length != 1"
          >s</span
        >
        found
      </div>
      <!-- <button class="reset-voice" @click="resetVoice">Reset Voice</button> -->
    </div>
    <ul class="mknoll-results">
      <li v-for="(word, index) in dictionaryStore.mknollResults" :key="index">
        <div class="mknoll-taiwanese">{{ word.taiwanese }}</div>
        <div class="mknoll-english">{{ word.english_mknoll }}</div>
        <div class="mknoll-chinese">{{ word.chinese }}</div>
      </li>
    </ul>

    <!-- driect ccedict results-->
    <div class="cedict-search-results-header search-results-header">
      <div class="cedict-title" v-if="dictionaryStore.cedictResults.length">
        <div>CC-CEDICT (Creative Commons Chinese English Dictionary)</div>
      </div>
      <div v-if="searchExecuted" class="results-count">
        {{ dictionaryStore.cedictResults.length }} result<span
          v-if="dictionaryStore.cedictResults.length != 1"
          >s</span
        >
        found
      </div>
    </div>
    <ul class="cedict-results">
      <li v-for="(word, index) in dictionaryStore.cedictResults" :key="index">
        {{ word.traditional }}
        {{ word.english_cedict }}
      </li>
    </ul>

    <!-- cross ref cedict-->
    <ul
      v-if="dictionaryStore.crossRefResults.length > 0"
      class="cedict-crossref"
    >
      <div class="section-header cedict-header">CC-CEDICT Cross reference</div>
      <div>{{ dictionaryStore.crossRefResults.length }} results found</div>
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
    <div class="admin">
      <button class="clear-cache" @click="clearCache()">Clear cache</button>
    </div>
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
import { updatePinyinInBatches } from "@/addpinyinbopo";
import pinyin from "pinyin"; // For Pinyin
import fromPinyin from "zhuyin";
import { updateZhuyinInBatches } from "@/addzhuyin";
import { useDictionaryStore } from "../stores/dictionaryStore";
import IconTrash from "@/components/icons/IconTrash.vue";
import IconEdit from "@/components/icons/IconEdit.vue";

const searchQuery = ref("");
const exactSearch = ref(false);
const word = ref(null);
const showDialog = ref(false);
const loading = ref(false);
const searchExecuted = ref(false);

const dictionaryStore = useDictionaryStore();

onMounted(() => {
  dictionaryStore.loadFromIndexedDB();
});

const clearInput = () => {
  searchQuery.value = "";
  searchExecuted.value = false;
  // dictionaryStore.searchResults = [];
};

const clearCache = () => {
  const dbName = "DictionaryDB"; // Replace with your database name
  const request = indexedDB.deleteDatabase(dbName);

  request.onsuccess = () => {
    console.log(`Database '${dbName}' deleted successfully`);
  };

  request.onerror = (event) => {
    console.error("Error deleting database:", event.target.error);
  };

  request.onblocked = () => {
    console.warn(
      "Delete request is blocked. Close all tabs accessing the database."
    );
  };
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
      //save search history
      dictionaryStore.addToHistory(searchQuery.value);
      loading.value = true; // Start loading
      searchExecuted.value = true;

      //primary MOE query
      let query = supabase
        .from("words")
        .select(
          `id, english, chinese, romaji, audioid, pinyin, zhuyin, taiwanese, audio_url, english_mknoll, definitions (defid, def_english, def_chinese)`
        );

      if (exactSearch.value) {
        // Perform exact match search
        query = query.or(
          `chinese.ilike.${searchQuery.value},english.ilike.${searchQuery.value},english_mknoll.ilike.${searchQuery.value},romaji.ilike.${searchQuery.value},taiwanese.ilike.${searchQuery.value}`
        );
      } else {
        // Perform partial match search
        query = query.or(
          `chinese.ilike.%${searchQuery.value}%,english.ilike.%${searchQuery.value}%,english_mknoll.ilike.%${searchQuery.value}%,romaji.ilike.%${searchQuery.value}%,taiwanese.ilike.%${searchQuery.value}%`
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

      // cross reference cedict
      crossRefCedict(searchQuery.value);
    } catch (err) {
      console.error("Error in searchWords:", err.message);
    } finally {
      loading.value = false; // stop loading
    }

    //query cedict directly
    const { data: cedictData, error: cedictError } = await supabase
      .from("cedict")
      .select("*")
      .or(
        `english_cedict.ilike.%${searchQuery.value}%,traditional.ilike.%${searchQuery.value}%`
      );
    if (cedictError) {
      console.error("Error fetching words:", cedictError.message);
    } else {
      console.log(cedictData);
      // cedictResults.value = cedictData;
      dictionaryStore.setCedictResults(cedictData);
    }

    //query mknoll directly
    const { data: mknollData, error: mknollError } = await supabase
      .from("maryknoll")
      .select("*")
      .or(
        `english_mknoll.ilike.%${searchQuery.value}%,chinese.ilike.%${searchQuery.value}%,taiwanese.ilike.%${searchQuery.value}%`
      );
    if (mknollError) {
      console.error("Error fetching words:", mknollError.message);
    } else {
      console.log(mknollData);
      // cedictResults.value = cedictData;
      dictionaryStore.setMknollResults(mknollData);
    }
  } else {
    console.log("empty search field!");
  }
};

const crossRefCedict = async (searchTerm) => {
  try {
    const { data, error } = await supabase.rpc("search_words_cedict", {
      search_term: searchTerm,
    });

    if (error) {
      console.error("Error fetching search results:", error.message);
      return [];
    }
    dictionaryStore.setCrossRefCedict(data);
    // wordsCedict.value = data;

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
</script>

<style scoped>
/*

search

*/
#supasearch {
  padding: 2rem 0;
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
  padding: 0 5vw;
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
  /* display: none; */
}
.moe-result-item {
  padding: 0rem 0 2rem 0;
  background-color: var(--black);
  /* border-top: 1px solid var(--gunmetal); */
  border-radius: 0.25rem;
  display: flex;
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
  .pinyin-zhuyin {
    gap: 0;
  }
}

/*

CCEDICT results


*/
.cedict-crossref {
  padding: 5vw;
  li.cedict-item {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    border-bottom: 1px solid var(--gunmetal);
  }
}
.cedict-header {
  /* display: none; */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
.cedict-traditional {
  font-size: 1.5rem;
  white-space: nowrap;
}
.cedict-pinyin-zhuyin {
  display: flex;
  flex-direction: column;
}
</style>
