<template>
  <div class="edit-dialog" v-if="visible">
    <Loader :loading="loading" />
    <AudioRecorder :wordId="word.id" />

    <button v-if="word.audio_url" @click="deleteAudio(word.id, word.audio_url)">
      Delete Audio
    </button>

    <button class="close-dialog" @click="close">Close</button>

    <div class="edit-moe-word">
      <form @submit.prevent="updateWord(word, index)">
        <div class="edit-moe-word edit-romaji">
          <label for="romaji">Romaji</label>
          <input v-model="word.romaji" type="text" id="romaji" />
        </div>
        <div class="edit-moe-word edit-english">
          <label for="english">English</label>
          <input v-model="word.english" type="text" id="english" />
        </div>
        <div class="edit-moe-word edit-chinese">
          <label for="chinese">Chinese</label>
          <input v-model="word.chinese" type="text" id="chinese" />
        </div>
        <div class="edit-moe-word edit-classification">
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

    <div class="edit-definitions-list" v-if="word.definitions.length > 0">
      <div
        v-for="(definition, index) in word.definitions"
        :key="definition.defid"
        class="edit-definition-container"
      >
        <form @submit.prevent="updateDefinition(definition.defid, index)">
          <div class="edit-def edit-english-def">
            <label for="def_english">English Definition:</label>
            <textarea
              v-model="definition.def_english"
              id="def_english"
            ></textarea>
          </div>
          <div class="edit-chinese-def">
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
        <div class="add-partofspeech">
          <label for="partofspeech">Part of Speech:</label>
          <input v-model="newDefinition.partofspeech" id="partofspeech" />
        </div>
        <div class="add-def-english">
          <label for="def_english">English Definition:</label>
          <textarea
            v-model="newDefinition.def_english"
            id="def_english"
          ></textarea>
        </div>
        <div class="add-def-chinese">
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

<script setup>
import { ref } from "vue";
import { supabase } from "@/supabase";
import AudioRecorder from "@/components/AudioRecorder.vue";
import Loader from "@/components/utility/Loader.vue";

const props = defineProps({
  visible: Boolean,
  word: Object,
});

const loading = ref(false);

const emit = defineEmits([
  "close",
  "update-word",
  "update-definition",
  "delete-definition",
  "add-definition",
]);

const newDefinition = ref({
  partofspeech: "",
  def_english: "",
  def_chinese: "",
});

const close = () => emit("close");

const updateWord = async (word, index) => {
  loading.value = true;
  const { data, error } = await supabase.from("words").upsert({
    id: word.id,
    chinese: word.chinese,
    romaji: word.romaji,
    classification: word.classification,
    english: word.english,
  });
  if (error) {
    console.error("Error updating word:", error.message);
    loading.value = false;
  } else {
    console.log("Word updated successfully:", data);
    loading.value = false;
    emit("word-updated", word);
  }
};

const updateDefinition = async (defid, index) => {
  loading.value = true;
  try {
    const definition = props.word.definitions[index];
    const { data, error } = await supabase.from("definitions").upsert({
      defid: defid,
      wordid: props.word.id,
      partofspeech: definition.partofspeech,
      def_english: definition.def_english,
      def_chinese: definition.def_chinese,
    });
    console.log("Definition updated successfully:", data);
  } catch (error) {
    console.error("Error updating definition:", error.message);
  } finally {
    loading.value = false;
  }
};

const deleteAudio = async (wordId, audioUrl) => {
  loading.value = true;
  try {
    const { error: deleteError } = await supabase.storage
      .from("audio-files")
      .remove([audioUrl]);
    if (deleteError) throw deleteError;

    await supabase.from("words").update({ audio_url: null }).eq("id", wordId);

    props.word.audio_url = null;
    console.log("Audio deleted successfully!");
  } catch (error) {
    console.error("Error deleting audio:", error);
  } finally {
    loading.value = false;
  }
};

const deleteDefinition = async (defid, index) => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("definitions")
      .delete()
      .eq("defid", defid);
    if (error) {
      console.error("Error deleting definition:", error.message);
      loading.value = false;
      return;
    }
    props.word.definitions.splice(index, 1);
    console.log("Definition deleted successfully:", data);
  } catch (err) {
    console.error("Error in deleteDefinition:", err.message);
  } finally {
    loading.value = false;
  }
};

const addDefinition = async (wordId) => {
  loading.value = false;
  try {
    const newDef = {
      wordid: wordId,
      partofspeech: newDefinition.value.partofspeech,
      def_english: newDefinition.value.def_english,
      def_chinese: newDefinition.value.def_chinese,
    };

    const { data, error } = await supabase
      .from("definitions")
      .insert([newDef])
      .select();

    if (error) {
      console.error("Error adding definition:", error.message);
      loading.value = false;
      return;
    }

    if (data && data.length > 0) {
      const addedDefinition = data[0];
      props.word.definitions.push(addedDefinition);
      newDefinition.value = {
        partofspeech: "",
        def_english: "",
        def_chinese: "",
      };
      console.log("Definition added successfully:", addedDefinition);
    }
  } catch (err) {
    console.error("Error in addDefinition:", err.message);
  } finally {
    loading.value = false;
  }
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
.edit-defintions-list {
}
.edit-definition-container {
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
