<template>
  <div id="supasearch">
    <div class="search-words">
      <!-- Search Field -->
      <input
        type="text"
        v-model="searchQuery"
        @keyup.enter="searchWords(searchQuery)"
        placeholder="Search for a word..."
        class="text-field search-words-text-field"
      />

      <div class="search-actions">
        <button @click="searchWords">Search</button>
        <button @click="clearInput">Clear</button>
        <button @click="resetVoice">Reset Voice</button>
      </div>
      <div v-if="this.words.length" class="results-count">
        {{ words.length }} results found
      </div>
    </div>
    <!-- Trigger search on click -->

    <ul class="results">
      <li v-for="word in words" :key="word.id" class="entry">
        <!-- <span>{{ word.id }}</span> -->
        <div class="word">
          <div class="word-item word-taigi">
            {{ word.romaji }}
            <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" />
          </div>
          <div class="word-item word-chinese">
            {{ word.chinese }}
            <IconPlayAudio @click="readChinese(word.chinese)"></IconPlayAudio>
          </div>
          <!-- <small>{{ word.id }}</small> -->
        </div>
        <div class="word-item word-english">
          {{ word.english }}
          <IconPlayAudio @click="readEnglish(word.english)" />
        </div>

        <ul>
          <li v-for="def in word.definitions" :key="def.id">
            <!-- <small>{{ def.defid }}</small> -->
            <ul>
              <li>{{ def.def_english }}</li>
              <li>{{ def.def_chinese }}</li>
            </ul>
          </li>
        </ul>
        <button class="edit-word" @click="openEditDialog(word, word.id)">
          Edit word
        </button>
      </li>
    </ul>

    <!-- 
    
    Edit Word and Definitions Form Dialog 
     
    -->

    <div v-if="showDialog" class="edit-dialog">
      <!-- <h2>Edit Word: {{ this.word.english }}</h2> -->
      <button @click="this.showDialog = false">Close</button>
      <!-- Word Edit Form -->
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
          <input
            v-model="word.classification"
            type="text"
            id="classification"
          />
        </div>
        <button type="submit">Save Word</button>
      </form>

      <!-- Definitions Edit Form -->
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
                type="textarea"
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
          </form>
        </div>
      </div>

      <!-- Add definitions -->
      <div v-else>
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
import { supabase } from "/src/supabase";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import IconPlayAudio from "./icons/IconPlayAudio.vue";
import { speakChinese } from "@/utils";
import { speakEnglish } from "@/utils";

export default {
  data() {
    return {
      words: [],
      searchQuery: "", // To store the user's search input
      searchResults: [],
      word: null,
      showDialog: false,
      selectedWordId: null,
      newDefinition: {
        partofspeech: "",
        def_english: "",
        def_chinese: "",
      },
    };
  },
  components: {
    AudioPlayerTaigi,
    IconPlayAudio,
  },
  async created() {
    // await this.fetchWords();
  },
  methods: {
    async fetchWords() {
      const { data, error } = await supabase.from("words").select(`
          id,
          english,
          definitions (defid, def_english)
        `);
      if (error) console.error(error);
      else this.words = data;
    },
    clearInput() {
      this.searchQuery = "";
      this.words = [];
    },

    //open edit dialog 
    async openEditDialog(word, id) {
      this.showDialog = true;
      this.selectedWordId = id; // what does this do for me?
      this.word = word;
      console.log(word);
    },

    // Update the word in the 'words' table
    async updateWord() {
      const { data, error } = await supabase.from("words").upsert({
        id: this.word.id, // Ensure the correct word ID is updated
        chinese: this.word.chinese,
        romaji: this.word.romaji,
        classification: this.word.classification,
        english: this.word.english,
      });

      if (error) {
        console.error("Error updating word:", error.message);
      } else {
        console.log("Word updated successfully:", data);
      }
    },

    // Update a definition in the 'definitions' table
    async updateDefinition(defid, index) {
      const definition = this.word.definitions[index];

      const { data, error } = await supabase.from("definitions").upsert({
        defid: defid, // Ensure the correct definition is updated
        wordid: this.word.id, // Reference to the word ID
        partofspeech: definition.partofspeech,
        def_english: definition.def_english,
        def_chinese: definition.def_chinese,
      });

      if (error) {
        console.error("Error updating definition:", error.message);
      } else {
        console.log("Definition updated successfully:", data);
      }
    },
    async addDefinition(wordid) {
      try {
        // Insert new definition into the definitions table
        const { data, error } = await supabase.from("definitions").insert([
          {
            wordid: this.word.id, // Associated word id
            partofspeech: this.newDefinition.partofspeech,
            def_english: this.newDefinition.def_english,
            def_chinese: this.newDefinition.def_chinese,
          },
        ]);
        console.log(this.word);
        if (error) throw new Error(error.message);

        // Update the definitions array with the new definition //  does this do anything?
        this.word.definitions.value.push(data[0]);

        // Reset form
        this.newDefinition.value.partofspeech = "";
        this.newDefinition.value.def_english = "";
        this.newDefinition.value.def_chinese = "";
      } catch (error) {
        console.error("Error adding definition:", error.message);
      }
    },
    async deleteWord(wordId) {
      // Delete definitions first
      const { error: definitionError } = await supabase
        .from("definitions")
        .delete()
        .eq("word_id", wordId);

      if (definitionError) {
        console.error(definitionError);
        return;
      }

      // Then delete the word
      const { error: wordError } = await supabase
        .from("words")
        .delete()
        .eq("id", wordId);

      if (wordError) console.error(wordError);
    },
    async searchWords() {
      const { data, error } = await supabase
        .from("words")
        .select(
          `id, english, chinese, romaji, audioid, definitions (defid, def_english, def_chinese)`
        )
        // .ilike('english', this.searchQuery)
        .or(
          `chinese.ilike.%${this.searchQuery}%,english.ilike.%${this.searchQuery}%`
        ); // Case-insensitive partial match

      if (error) {
        console.error(error);
      } else {
        this.words = data;
        console.log(this.words);
      }
    },
    async readChinese(text) {
      speakChinese(text);
    },
    async readEnglish(text) {
      speakEnglish(text);
    },
    async resetVoice() {
      window.speechSynthesis.cancel();
    },
    async randomWord() {
      // Step 1: Get the total count of words
      const { count } = await supabase
        .from("words")
        .select("*", { count: "exact", head: true });

      // Step 2: Generate a random offset
      const randomOffset = Math.floor(Math.random() * count);

      // Step 3: Fetch a random word using the offset
      const { data, error } = await supabase
        .from("words")
        .select("*")
        .range(randomOffset, randomOffset);

      if (error) {
        console.error("Error fetching random word:", error.message);
      } else {
        console.log("Random Word:", data[0]);
      }
    },
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
