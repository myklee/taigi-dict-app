<template>
  <div class="edit-dialog" v-if="visible">
    <Loader :loading="loading" />
    <AudioRecorder :wordId="word.id" :mknoll="true" />

    <button v-if="word.audio_url" @click="deleteAudio(word.id, word.audio_url)">
      Delete Audio
    </button>

    <button class="close-dialog" @click="close">Close</button>

    <div class="edit-moe-word">
      <form @submit.prevent="updateWord(word, index)">
        <div class="edit-moe-word edit-taiwanese">
          <label for="taiwanese">Taiwanese</label>
          <input v-model="word.taiwanese" type="text" id="taiwanese" />
        </div>
        <div class="edit-moe-word edit-chinese">
          <label for="chinese">Chinese</label>
          <input v-model="word.chinese" type="text" id="chinese" />
        </div>
        <div class="edit-moe-word edit-mknoll">
          <label for="english_mknoll">English</label>
          <input
            v-model="word.english_mknoll"
            type="text"
            id="english_mknoll"
          />
        </div>
        <button type="submit">Save Word</button>
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

const emit = defineEmits(["close", "update-word"]);

const close = () => emit("close");

const updateWord = async (word, index) => {
  loading.value = true;
  const { data, error } = await supabase.from("maryknoll").upsert({
    id: word.id,
    chinese: word.chinese,
    taiwanese: word.taiwanese,
    english_mknoll: word.english_mknoll,
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

function getFileNameFromUrl(url) {
  const parts = url.split("/");
  return parts.pop().split("?")[0]; // Removes any query parameters if present
}
const deleteAudio = async (wordId, audioUrl) => {
  loading.value = true;
  try {
    const filename = getFileNameFromUrl(audioUrl);
    console.log(filename);

    const { error: deleteError } = await supabase.storage
      .from("audio-files")
      .remove([filename]);
    if (deleteError) throw deleteError;

    //oqwvljqwtearyepyaslo.supabase.co/storage/v1/object/public/audio-files/audio-5944-1735999004081.webm

    https: await supabase
      .from("maryknoll")
      .update({ audio_url: null })
      .eq("id", wordId);

    props.word.audio_url = null;
    console.log("Audio deleted successfully!");
  } catch (error) {
    console.error("Error deleting audio:", error);
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
