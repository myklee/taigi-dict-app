<template>
  <div class="edit-dialog" v-if="visible">
    <AudioRecorder :wordId="word.id" />
    <!-- delete audio -->

    <button v-if="word.audio_url" @click="deleteAudio(word.id, word.audio_url)">
      Delete Audio
    </button>

    <button class="close-dialog" @click="close">Close</button>
    <div class="edit-word">
      <form @submit.prevent="updateWord(word, index)">
        <div>
          <label for="romaji">Romaji</label>
          <input v-model="word.romaji" type="text" id="romaji" />
        </div>
        <div>
          <label for="taiwanese">Taiwanese</label>
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
    </div>
    <div class="definitions" v-if="word.definitions.length > 0">
      <div
        v-for="(definition, index) in word.definitions"
        :key="definition.defid"
        class="definition-container"
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
          <button
            type="button"
            @click="deleteDefinition(definition.defid, index)"
          >
            Delete Definition
          </button>
        </form>
      </div>
    </div>
    <div class="add-definition">
      <h4>Add a new definition</h4>
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
</template>

<script>
import { ref, watch } from "vue";
import { supabase } from "@/supabase";
import AudioRecorder from "./AudioRecorder.vue";

export default {
  props: {
    visible: Boolean,
    word: Object,
  },
  components: {
    AudioRecorder,
  },
  emits: [
    "close",
    "update-word",
    "update-definition",
    "delete-definition",
    "add-definition",
  ],
  setup(props, { emit }) {
    const newDefinition = ref({
      partofspeech: "",
      def_english: "",
      def_chinese: "",
    });

    console.log(props);

    const close = () => emit("close");

    const updateWord = async (word, index) => {
      console.log(word);

      const { data, error } = await supabase.from("words").upsert({
        id: word.id,
        chinese: word.chinese,
        romaji: word.romaji,
        classification: word.classification,
        english: word.english,
      });

      if (error) console.error("Error updating word:", error.message);
      else console.log("Word updated successfully:", data);

      // Emit event to notify the parent about the update
      emit("word-updated", word);
    };

    const updateDefinition = async (defid, index) => {
      const definition = props.word.definitions[index];
      const { data, error } = await supabase.from("definitions").upsert({
        defid: defid,
        wordid: props.word.id,
        partofspeech: definition.partofspeech,
        def_english: definition.def_english,
        def_chinese: definition.def_chinese,
      });

      if (error) console.error("Error updating definition:", error.message);
      else console.log("Definition updated successfully:", data);
    };
    const deleteAudio = async (wordId, audioUrl) => {
      try {
        // Delete the audio file from Supabase storage
        const { error: deleteError } = await supabase.storage
          .from("audio-files") // Replace 'audio' with the correct bucket name
          .remove([`${audioUrl}`]); // Replace with the correct file path

        if (deleteError) {
          throw deleteError;
        }

        // Remove the audio URL reference from the database (or set it to null)
        await supabase
          .from("words") // Replace 'words' with your table name
          .update({ audio_url: null })
          .eq("id", wordId);

        // Update the local state to reflect the change
        props.word.audio_url = null;
        console.log("Audio deleted successfully!");
      } catch (error) {
        console.error("Error deleting audio:", error);
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
        props.word.definitions.splice(index, 1);
        console.log("Definition deleted successfully:", data);
      } catch (err) {
        console.error("Error in deleteDefinition:", err.message);
      }
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

        // console.log(data);
        if (error) {
          console.error("Error adding definition:", error.message);
          return;
        }

        // Update the UI with the new definition
        if (data && data.length > 0) {
          const addedDefinition = data[0]; // Get the newly added definition

          // Ensure word.definitions is reactive and update it
          if (!props.word.definitions) {
            props.word.definitions = [];
          }
          props.word.definitions.push(addedDefinition); // Add the new definition to the UI

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

    return {
      AudioRecorder,
      close,
      deleteAudio,
      updateWord,
      updateDefinition,
      deleteDefinition,
      addDefinition,
      newDefinition,
    };
  },
};
</script>
<style scoped>
/*

Edit dialog

*/

.edit-dialog {
  position: fixed;
  top: 0;
  bottom: 0;
  height: 100vh;
  width: 100vw;
  transition: 1s all ease-in-out;
  overflow: scroll;
}
.definition-container {
  padding: 5vw;
}
.close-dialog {
  position: fixed;
  top: 0;
  right: 0;
  background-color: var(--app-background);
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
</style>
