<template>
  <div id="supasearch">
    <div class="search-words">
      <input
        type="text"
        v-model="searchQuery"
        @keyup.enter="searchWords"
        placeholder="Search for a word..."
        class="text-field search-words-text-field"
      />
      <div class="search-actions">
        <button @click="searchWords">Search</button>
        <button @click="clearInput">Clear</button>
        <button @click="resetVoice">Reset Voice</button>
      </div>
      <div v-if="words.length" class="results-count">
        {{ words.length }} results found
      </div>
    </div>

    <ul class="results">
      <li v-for="word in words" :key="word.id" class="entry">
        <div class="word">
          <div class="word-item word-taigi">
            {{ word.romaji }}
            <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" />
          </div>
          <div class="word-item word-chinese">
            {{ word.chinese }}
            <IconPlayAudio @click="readChinese(word.chinese)"></IconPlayAudio>
          </div>
        </div>
        <div class="word-item word-english">
          {{ word.english }}
          <IconPlayAudio @click="readEnglish(word.english)" />
        </div>
        <ul>
          <li v-for="def in word.definitions" :key="def.id">
            <ul>
              <li>{{ def.def_english }}</li>
              <li>{{ def.def_chinese }}</li>
            </ul>
          </li>
        </ul>
        <button class="edit-word" @click="openEditDialog(word)">Edit word</button>
      </li>
    </ul>

    <div v-if="showDialog" class="edit-dialog">
      <button @click="closeDialog">Close</button>
      <form @submit.prevent="updateWord">
        <div>
          <label for="romaji">Romaji</label>
          <input v-model="word.romaji" type="text" id="romaji" />
        </div>
        <div>
          <label for="english">English</label>
          <input v-model="word.english" type="text" id="english" />
        </div>
        <div>
          <label for="chinese">Chinese</label>
          <input v-model="word.chinese" type="text" id="chinese" />
        </div>
        <div>
          <label for="classification">Classification:</label>
          <input v-model="word.classification" type="text" id="classification" />
        </div>
        <button type="submit">Save Word</button>
      </form>
      <div v-if="word.definitions.length > 0">
        <div v-for="(definition, index) in word.definitions" :key="definition.defid">
          <form @submit.prevent="updateDefinition(definition.defid, index)">
            <div>
              <label for="def_english">English Definition:</label>
              <textarea v-model="definition.def_english" id="def_english"></textarea>
            </div>
            <div>
              <label for="def_chinese">Chinese Definition:</label>
              <input v-model="definition.def_chinese" type="text" id="def_chinese" />
            </div>
            <div>
              <label for="partofspeech">Part of Speech:</label>
              <input v-model="definition.partofspeech" type="text" id="partofspeech" />
            </div>
            <button type="submit">Save Definition</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { supabase } from "/src/supabase";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import IconPlayAudio from "./icons/IconPlayAudio.vue";
import { speakChinese, speakEnglish } from "@/utils";

export default {
  components: {
    AudioPlayerTaigi,
    IconPlayAudio,
  },
  setup() {
    const words = ref([]);
    const searchQuery = ref("");
    const word = ref(null);
    const showDialog = ref(false);
    const newDefinition = ref({
      partofspeech: "",
      def_english: "",
      def_chinese: "",
    });

    const fetchWords = async () => {
      const { data, error } = await supabase
        .from("words")
        .select(`id, english, definitions (defid, def_english)`);
      if (error) console.error(error);
      else words.value = data;
    };

    const clearInput = () => {
      searchQuery.value = "";
      words.value = [];
    };

    const openEditDialog = (selectedWord) => {
      showDialog.value = true;
      word.value = selectedWord;
    };

    const closeDialog = () => {
      showDialog.value = false;
    };

    const updateWord = async () => {
      const { data, error } = await supabase.from("words").upsert({
        id: word.value.id,
        chinese: word.value.chinese,
        romaji: word.value.romaji,
        classification: word.value.classification,
        english: word.value.english,
      });

      if (error) console.error("Error updating word:", error.message);
      else console.log("Word updated successfully:", data);
    };

    const updateDefinition = async (defid, index) => {
      const definition = word.value.definitions[index];
      const { data, error } = await supabase.from("definitions").upsert({
        defid: defid,
        wordid: word.value.id,
        partofspeech: definition.partofspeech,
        def_english: definition.def_english,
        def_chinese: definition.def_chinese,
      });

      if (error) console.error("Error updating definition:", error.message);
      else console.log("Definition updated successfully:", data);
    };

    const searchWords = async () => {
      const { data, error } = await supabase
        .from("words")
        .select(`id, english, chinese, romaji, audioid, definitions (defid, def_english, def_chinese)`)
        .or(`chinese.ilike.%${searchQuery.value}%,english.ilike.%${searchQuery.value}%`);
      if (error) console.error(error);
      else words.value = data;
    };

    const readChinese = (text) => speakChinese(text);
    const readEnglish = (text) => speakEnglish(text);
    const resetVoice = () => window.speechSynthesis.cancel();

    return {
      words,
      searchQuery,
      word,
      showDialog,
      newDefinition,
      fetchWords,
      clearInput,
      openEditDialog,
      closeDialog,
      updateWord,
      updateDefinition,
      searchWords,
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
.search-words {
  padding: 0 5vw;
}
.search-words-text-field {
  width: 100%;
  border: none;
  border-bottom: 3px solid;
  margin-bottom: 0.5rem;
  padding: 1rem;
}
.search-actions {
  display: flex;
  gap: 0.5rem;
}

/* 

results

*/
.results {
  margin: 0 5vw;
  color: black;
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
  border-top: 1px solid;
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

Edit dialog  

*/

.edit-dialog {
  position: fixed;
  top: 0;
  height: 100vh;
  width: 100vw;
  background-color: white;
  transition: 1s all ease-in-out;
}
</style>
