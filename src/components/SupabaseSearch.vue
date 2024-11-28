<template>
  <div id="supasearch">
    <div class="search-words">
      <input
        type="text"
        v-model="searchQuery"
        @keyup.enter="searchWords"
        placeholder="Search for a word..."
        class="text-field search-words-text-field"
        autocapitalize="off"
      />
      <div class="exact-search-container">
        <input id="exact-search" type="checkbox" v-model="exactSearch" />
        <label for="exact-search">Exact Search</label>
      </div>
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

    <div v-if="showDialog" class="edit-dialog">
      <button @click="closeDialog">Close</button>
      <form @submit.prevent="updateWord">
        <div>
          <label for="romaji">Romaji</label>
          <input v-model="word.romaji" type="text" id="romaji" />
        </div>
        <div>
          <label for="romaji">Taiwanese</label>
          <input v-model="word.taiwanese" type="text" id="taiwanese" />
        </div>
        <div>
          <label for="english">English</label>
          <input v-model="word.english" type="text" id="english" />
        </div>
        <div>
          <label for="english_mknoll">English Mary Knoll</label>
          <input
            v-model="word.english_mknoll"
            type="text"
            id="english_mknoll"
          />
        </div>
        <div>
          <label for="chinese">Chinese</label>
          <input v-model="word.chinese" type="text" id="chinese" />
        </div>
        <div>
          <label for="classification">Classification:</label>
          <input
            v-model="word.classification"
            type="text"
            id="classification"
          />
        </div>
        <button type="submit">Save Word</button>
      </form>
      <div v-if="word.definitions.length > 0">
        <div
          v-for="(definition, index) in word.definitions"
          :key="definition.defid"
        >
          <form @submit.prevent="updateDefinition(definition.defid, index)">
            <div>
              <label for="def_english">English Definition:</label>
              <textarea
                v-model="definition.def_english"
                id="def_english"
              ></textarea>
            </div>
            <div>
              <label for="def_chinese">Chinese Definition:</label>
              <input
                v-model="definition.def_chinese"
                type="text"
                id="def_chinese"
              />
            </div>
            <div>
              <label for="partofspeech">Part of Speech:</label>
              <input
                v-model="definition.partofspeech"
                type="text"
                id="partofspeech"
              />
            </div>
            <button type="submit">Save Definition</button>
            <!-- Delete button -->
            <button
              type="button"
              @click="deleteDefinition(definition.defid, index)"
            >
              Delete Definition
            </button>
          </form>
        </div>
      </div>
      <div>
        add a new definition
        <form @submit.prevent="addDefinition(word.id)">
          <div>
            <label for="partofspeech">Part of Speech:</label>
            <input v-model="newDefinition.partofspeech" id="partofspeech" />
          </div>
          <div>
            <label for="def_english">English Definition:</label>
            <textarea
              v-model="newDefinition.def_english"
              id="def_english"
            ></textarea>
          </div>
          <div>
            <label for="def_chinese">Chinese Definition:</label>
            <textarea
              v-model="newDefinition.def_chinese"
              id="def_chinese"
            ></textarea>
          </div>
          <button type="submit">Add Definition</button>
        </form>
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
    const exactSearch = ref(true);
    const word = ref(null);
    const showDialog = ref(false);
    const newDefinition = ref({
      partofspeech: "",
      def_english: "",
      def_chinese: "",
    });

    // const fetchWords = async () => {
    //   const { data, error } = await supabase
    //     .from("words")
    //     .select(`id, english, definitions (defid, def_english)`);
    //   if (error) console.error(error);
    //   else words.value = data;
    // };

    const clearInput = () => {
      searchQuery.value = "";
      words.value = [];
    };

    const openEditDialog = (selectedWord) => {
      showDialog.value = true;
      word.value = {
        ...selectedWord,
        definitions: selectedWord.definitions || [], // Initialize as an empty array if undefined
      };
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

    const addDefinition = async (wordId) => {
      try {
        // Validate input
        if (!wordId) {
          throw new Error("No word ID provided.");
        }

        // Prepare the new definition object
        const newDef = {
          wordid: wordId, // Associate with the correct word
          partofspeech: newDefinition.value.partofspeech,
          def_english: newDefinition.value.def_english,
          def_chinese: newDefinition.value.def_chinese,
        };

        // Insert the new definition into the 'definitions' table
        const { data, error } = await supabase
          .from("definitions")
          .insert([newDef])
          .select(); // Use `.select()` to fetch the inserted data

        if (error) {
          console.error("Error adding definition:", error.message);
          return;
        }

        // Update the UI with the new definition
        if (data && data.length > 0) {
          const addedDefinition = data[0]; // Get the newly added definition

          // Ensure word.definitions is reactive and update it
          if (!word.value.definitions) {
            word.value.definitions = [];
          }
          word.value.definitions.push(addedDefinition); // Add the new definition to the UI

          // Reset the new definition form
          newDefinition.value = {
            partofspeech: "",
            def_english: "",
            def_chinese: "",
          };

          console.log("Definition added successfully:", addedDefinition);
        }
      } catch (err) {
        console.error("Error in addDefinition:", err.message);
      }
    };

    const deleteDefinition = async (defid, index) => {
      try {
        // Remove the definition from the database
        const { data, error } = await supabase
          .from("definitions")
          .delete()
          .eq("defid", defid);

        if (error) {
          console.error("Error deleting definition:", error.message);
          return;
        }

        // Update the local definitions array
        word.value.definitions.splice(index, 1);
        console.log("Definition deleted successfully:", data);
      } catch (err) {
        console.error("Error in deleteDefinition:", err.message);
      }
    };

    const searchWords = async () => {
      try {
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
        if (error) {
          console.error("Error fetching words:", error.message);
        } else {
          words.value = data;
        }
      } catch (err) {
        console.error("Error in searchWords:", err.message);
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
      closeDialog,
      updateWord,
      updateDefinition,
      deleteDefinition,
      addDefinition,
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
#supasearch {
  padding-bottom:2rem;
}
.search-words {
  padding: 0 5vw;
}
.search-words-text-field {
  width: 100%;
  border: none;
  border-bottom: 3px solid;
  margin-bottom: 0.5rem;
  padding: 1rem;
  background-color: transparent;
}
.search-actions {
  display: flex;
  gap: 0.5rem;
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
  transition: 1s all ease-in-out;
}
</style>
