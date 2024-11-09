<template>
  <div id="supasearch">
    <!-- Search Field -->
    <input
      type="text"
      v-model="searchQuery"
      @keyup.enter="searchWords(searchQuery)"
      placeholder="Search for a word..."
      class="text-field search-words"
    />

    <button @click="searchWords">Search</button>
    <button @click="clearInput">Clear</button>
    <!-- Trigger search on click -->
    {{ words.length }}
    <ul class="results">
      <li v-for="word in words" :key="word.id" class="word">
        <div class="word-item word-english">{{ word.english }}</div>
        <div class="word-item word-english">{{ word.chinese }}</div>
        <div class="word-item word-english">
          {{ word.romaji }}
          <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" />
        </div>
        <small>{{ word.id }}</small>
        <button @click="openDialog(word.id)">Edit</button>
        <ul>
          <li v-for="def in word.definitions" :key="def.id">
            {{ def.defid }}
            <ol>
              <li>{{ def.def_english }}</li>
              <li>{{ def.def_chinese }}</li>
            </ol>
          </li>
        </ul>
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
          <label for="chinese">Chinese</label>
          <input v-model="word.chinese" type="text" id="chinese" />
        </div>
        <!-- <div>
            <label for="romaji">Romaji</label>
            <input v-model="word.romaji" type="text" id="romaji" />
          </div> -->
        <div>
          <label for="english">English</label>
          <input v-model="word.english" type="text" id="english" />
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

      <hr />

      <!-- Definitions Edit Form -->
      <h3>Definitions</h3>
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
        <hr />
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from "/src/supabase";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import IconPlayAudio from "./icons/IconPlayAudio.vue";

export default {
  data() {
    return {
      words: [],
      searchQuery: "", // To store the user's search input
      searchResults: [],
      word: null,
      showDialog: false,
      selectedWordId: null,
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
      // this.words = [];
    },
    // async addWord(word, definition) {
    //   const { data: wordData, error: wordError } = await supabase
    //     .from("words")
    //     .insert([{ word }])
    //     .select();

    //   if (wordError) {
    //     console.error(wordError);
    //     return;
    //   }

    //   const wordId = wordData[0].id;

    //   const { error: definitionError } = await supabase
    //     .from("definitions")
    //     .insert([{ word_id: wordId, definition }]);

    //   if (definitionError) console.error(definitionError);
    // },

    //open dialog
    async openDialog(id) {
      this.showDialog = true;
      this.selectedWordId = id;
      const { data, error } = await supabase
        .from("words")
        .select(
          "id, chinese, romaji, classification, english, definitions (defid, def_english, def_chinese)"
        )
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching word:", error.message);
      } else {
        this.word = data;
        console.log(this.word);
      }
    },

    // Fetch the word and its definitions when clicking on a word
    async editWord(id) {
      const { data, error } = await supabase
        .from("words")
        .select(
          "id, chinese, romaji, classification, english, definitions (defid, def_english, def_chinese, partofspeech)"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching word:", error.message);
      } else {
        this.word = data; // Set the word and its definitions
      }
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
        .ilike("english", `%${this.searchQuery}%`); // Case-insensitive partial match

      if (error) {
        console.error(error);
      } else {
        this.words = data;
        console.log(this.words);
      }
    },
  },
};
</script>
