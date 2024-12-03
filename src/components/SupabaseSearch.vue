<template>
  <div id="supasearch">
    <div class="search-header">
      <div class="search-words">
        <input
          type="text"
          v-model="searchQuery"
          @keyup.enter="searchWords"
          placeholder="Search for a word..."
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
          <label for="exact-search">Exact Search</label>
        </div>
        <div class="search-actions">
          <button class="search-button" @click="searchWords">Search</button>
        </div>
      </div>

      <div class="search-results-header">
        <Loader v-if="loading" />
        <div v-else>
          <div v-if="searchExecuted" class="results-count">
            {{ words.length }} result<span v-if="words.length != 1">s</span>
            found
          </div>
        </div>
        <!-- <button class="reset-voice" @click="resetVoice">Reset Voice</button> -->
      </div>
    </div>

    <ul class="results">
      <li v-for="word in words" :key="word.id" class="entry">
        <div class="word">
          <div
            v-if="word.romaji != null"
            class="word-item word-taigi alphabetic"
          >
            {{ word.romaji }}
            <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" />
          </div>
          <div
            v-if="word.taiwanese != null"
            class="word-item word-taigi alphabetic"
          >
            {{ word.taiwanese }}
          </div>
          <div
            v-if="word.chinese != null"
            class="word-item word-chinese logographic"
          >
            {{ word.chinese }}
            <IconPlayAudio @click="readChinese(word.chinese)"></IconPlayAudio>
          </div>
        </div>
        <div
          v-if="word.english != null"
          class="word-item word-english alphabetic"
        >
          {{ word.english }}
          <IconPlayAudio @click="readEnglish(word.english)" />
        </div>
        <div
          v-if="word.english_mknoll != null"
          class="word-item word-english alphabetic"
        >
          {{ word.english_mknoll }}
          <IconPlayAudio @click="readEnglish(word.english_mknoll)" />
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

    <EditWord :visible="showDialog" :word="word" @close="closeDialog()" />
  </div>
</template>

<script>
import { ref } from "vue";
import { supabase } from "/src/supabase";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import IconPlayAudio from "./icons/IconPlayAudio.vue";
import { speakChinese, speakEnglish } from "@/utils";
import EditWord from "./EditWord.vue";
import Loader from "./utility/Loader.vue";

export default {
  components: {
    AudioPlayerTaigi,
    IconPlayAudio,
    EditWord,
    Loader,
  },
  setup() {
    const words = ref([]);
    const searchQuery = ref("");
    const exactSearch = ref(true);
    const word = ref(null);
    const showDialog = ref(false);
    const newDefinition = ref({
      partofspeech: "",
      def_english: "",
      def_chinese: "",
    });
    const loading = ref(false);
    const searchExecuted = ref(false);

    const clearInput = () => {
      searchQuery.value = "";
      words.value = [];
      searchExecuted.value = false;
    };

    const openEditDialog = (selectedWord) => {
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

    const searchWords = async () => {
      try {
        loading.value = true; // Start loading
        searchExecuted.value = true;
        let query = supabase
          .from("words")
          .select(
            `id, english, chinese, romaji, audioid, taiwanese, english_mknoll, definitions (defid, def_english, def_chinese)`
          );

        if (exactSearch.value) {
          // Perform exact match search
          query = query.or(
            `chinese.eq.${searchQuery.value},english.eq.${searchQuery.value},english_mknoll.eq.${searchQuery.value},romaji.eq.${searchQuery.value},taiwanese.eq.${searchQuery.value}`
          );
        } else {
          // Perform partial match search
          query = query.or(
            `chinese.ilike.%${searchQuery.value}%,english.ilike.%${searchQuery.value}%,english_mknoll.ilike.%${searchQuery.value}%,romaji.ilike.%${searchQuery.value}%,taiwanese.ilike.%${searchQuery.value}%`
          );
        }

        const { data, error } = await query;

        // console.log(data);
        if (error) {
          console.error("Error fetching words:", error.message);
        } else {
          words.value = data;
        }
      } catch (err) {
        console.error("Error in searchWords:", err.message);
      } finally {
        loading.value = false; // stop loading
      }
    };

    const readChinese = (text) => speakChinese(text);
    const readEnglish = (text) => speakEnglish(text);
    const resetVoice = () => window.speechSynthesis.cancel();

    return {
      words,
      searchQuery,
      exactSearch,
      word,
      showDialog,
      newDefinition,
      clearInput,
      openEditDialog,
      EditWord,
      Loader,
      loading,
      closeDialog,
      searchWords,
      searchExecuted,
      readChinese,
      readEnglish,
      resetVoice,
    };
  },
};
</script>

<style scoped>
/* 

search

*/
#supasearch {
  padding-bottom: 2rem;
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

/* 

results

*/
.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5vw;
}
.results {
  margin: 0 5vw;
}
.results-count {
  padding: 0.5rem 0;
}

/* 

entry

*/

.entry {
  margin: 1rem 0;
  padding: 1rem 0;
  border-top: 1px solid var(--gunmetal);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}
.word,
.word-item {
  display: flex;
  align-items: center;
}
.word {
  gap: 2rem;
  row-gap: 0;
  flex-wrap: wrap;
}
.word-item {
  padding: 0.5rem 0;
  gap: 0.5rem;
  /* border: 1px solid; */
}
.word-taigi,
.word-chinese {
  font-size: 3rem;
}
.word-english {
  font-size: 1.5rem;
}

.edit-word {
  cursor: pointer;
  border: none;
  display: block;
  width: 100px;
  margin-top: 1rem;
}
</style>
