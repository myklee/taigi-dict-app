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
        <div v-if="searchExecuted" class="results-count">
          {{ words.length }} result<span v-if="words.length != 1">s</span>
          found
        </div>
        <!-- <button class="reset-voice" @click="resetVoice">Reset Voice</button> -->
      </div>
    </div>

    <ul class="results moe-results">
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
            <div class="pinyin-zhuyin">
              <span class="pinyin">{{ pinyin(word.chinese).join(" ") }}</span>
              <span class="zhuyin">{{ word.zhuyin }}</span>
            </div>
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
    <!-- CC - CEDICDT -->

    <ul v-if="wordsCedict.length" class="results-cedict">
      <h2>CC-CEDICT (Creative Commons Chinese English Dictionary)</h2>
      <li
        class="cedit-item"
        v-for="(wordcedict, index) in wordsCedict"
        :key="index"
      >
        <p class="cedict-traditional">
          {{ wordcedict.traditional }}
        </p>
        <div>
          <IconPlayAudio
            @click="readChinese(wordcedict.traditional)"
          ></IconPlayAudio>
        </div>
        <div class="pinyin-zhuyin cedict-pinyin-zhuyin">
          <p class="cedict-pinyin">
            {{ pinyin(wordcedict.traditional).join(" ") }}
          </p>
          <p class="cedict-zhuyin">
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

<script>
import { ref } from "vue";
import { supabase } from "/src/supabase.js";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import IconPlayAudio from "./icons/IconPlayAudio.vue";
import { speakChinese, speakEnglish } from "@/utils";
import EditWord from "./EditWord.vue";
import Loader from "./utility/Loader.vue";
import { updatePinyinInBatches } from "@/addpinyinbopo";
import pinyin from "pinyin"; // For Pinyin
import fromPinyin from "zhuyin";
import { updateZhuyinInBatches } from "@/addzhuyin";

export default {
  components: {
    AudioPlayerTaigi,
    IconPlayAudio,
    EditWord,
    Loader,
  },
  setup() {
    const words = ref([]);
    const wordsCedict = ref([]);
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
      wordsCedict.value = [];
      searchExecuted.value = false;
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
          loading.value = true; // Start loading
          searchExecuted.value = true;
          let query = supabase
            .from("words")
            .select(
              `id, english, chinese, romaji, audioid, pinyin, zhuyin, taiwanese, english_mknoll, definitions (defid, def_english, def_chinese)`
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
            words.value = data;
          }
          // cross reference cedict
          searchWordsAndCedict(searchQuery.value);
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

        console.log(data);

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

    return {
      clearInput,
      closeDialog,
      EditWord,
      exactSearch,
      fromPinyin,
      loading,
      newDefinition,
      openEditDialog,
      pinyin,
      readChinese,
      readEnglish,
      resetVoice,
      refreshSearchResults,
      searchWords,
      searchExecuted,
      searchWordsAndCedict,
      searchQuery,
      showDialog,
      words,
      wordsCedict,
      word,
    };
  },
};
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

MOE entry

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
/* 

CCEDICT results 


*/
.results-cedict {
  padding: 5vw;
  li {
    margin: 1rem 0;
    display: flex;
    gap: 1rem;
  }
}
.cedict-traditional {
  font-size: 1.5rem;
}
.cedict-pinyin-zhuyin {
  display: flex;
  flex-direction: column;
}
</style>
