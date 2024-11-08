<template>
  <div>
    <!-- Edit Word and Definitions Form -->
    <div v-if="word">
      <h2>Edit Word: {{ word.chinese }}</h2>

      <!-- Word Edit Form -->
      <form @submit.prevent="updateWord">
        <div>
          <label for="chinese">Chinese:</label>
          <input v-model="word.chinese" type="text" id="chinese" />
        </div>
        <div>
          <label for="romaji">Romaji:</label>
          <input v-model="word.romaji" type="text" id="romaji" />
        </div>
        <div>
          <label for="english">English:</label>
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
            <input
              v-model="definition.def_english"
              type="text"
              id="def_english"
            />
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

    <!-- Word List -->
    <div v-for="w in words" :key="w.id">
      <span>{{ w.chinese }}</span>
      <button @click="editWord(w.id)">Edit</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      word: null, // Word being edited
      words: [], // List of words to display for selection
    };
  },
  methods: {
    // Fetch the word with its definitions
    async fetchWord(id) {
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
        this.word = data; // Set word and definitions
      }
    },

    // Trigger edit for a specific word
    editWord(id) {
      this.fetchWord(id); // Fetch the word and its definitions for editing
    },

    // Update the word in the 'words' table
    async updateWord() {
      const { data, error } = await supabase.from("words").upsert({
        id: this.word.id, // Ensure correct word ID is updated
        chinese: this.word.chinese,
        romaji: this.word.romaji,
        classification: this.word.classification,
        english: this.word.english,
      });

      if (error) {
        console.error("Error updating word:", error.message);
      } else {
        console.log("Word updated successfully:", data);
        this.fetchWords(); // Optionally refresh word list
      }
    },

    // Update a definition in the 'definitions' table
    async updateDefinition(defid, index) {
      const definition = this.word.definitions[index];

      const { data, error } = await supabase.from("definitions").upsert({
        defid: defid, // Ensure we're updating the correct definition
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

    // Fetch all words (for listing purposes)
    async fetchWords() {
      const { data, error } = await supabase
        .from("words")
        .select("id, chinese");

      if (error) {
        console.error("Error fetching words:", error.message);
      } else {
        this.words = data; // Set the words list
      }
    },
  },
  mounted() {
    this.fetchWords(); // Fetch the word list when the component mounts
  },
};
</script>
