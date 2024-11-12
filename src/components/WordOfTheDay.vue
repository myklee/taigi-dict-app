<template>
  <div class="wod" v-if="randomWordData">
    <h4>Random word</h4>
    <div class="wod-words">
      <div class="wod-word-item">
        {{ randomWordData.english }}
        <IconPlayAudio
          v-if="randomWordData.english"
          @click="readEnglish(randomWordData.english)"
        />
      </div>
      <div class="wod-word-item">
        {{ randomWordData.chinese }}
        <IconPlayAudio
          v-if="randomWordData.chinese"
          @click="readChinese(randomWordData.chinese)"
        />
      </div>
      <div class="wod-word-item">
        {{ randomWordData.romaji }}
        <AudioPlayerTaigi
          v-if="randomWordData.audioid"
          :audioID="randomWordData.audioid"
        />
      </div>
    </div>
    <div
        v-for="(definition, index) in randomWordData.definitions"
        :key="definition.defid"
        class="wod-definitions"
      >
        {{ definition.def_chinese }}
        {{ definition.def_english }}
      </div>
    <button @click="fetchRandomWordAndDefinitions">Get a different word</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "/src/supabase";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import { speakChinese } from "@/utils";
import { speakEnglish } from "@/utils";
import IconPlayAudio from "./icons/IconPlayAudio.vue";

const randomWordData = ref(null);

const fetchRandomWordAndDefinitions = async () => {
  try {
    // Step 1: Get the total count of words
    const { count } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true });

    const randomOffset = Math.floor(Math.random() * count);

    // Step 2: Fetch a random word using the random offset
    const { data: wordData, error: wordError } = await supabase
      .from("words")
      .select("*")
      .range(randomOffset, randomOffset)
      .limit(1);

    if (wordError) throw new Error(wordError.message);

    const randomWord = wordData[0];

    // Step 3: Fetch definitions associated with the random word
    const { data: definitionsData, error: definitionsError } = await supabase
      .from("definitions")
      .select("*")
      .eq("wordid", randomWord.id);

    if (definitionsError) throw new Error(definitionsError.message);

    // Combine word and definitions in one object
    randomWord.definitions = definitionsData;
    randomWordData.value = randomWord;
  } catch (error) {
    console.error("Error fetching random word and definitions:", error.message);
  }
};

onMounted(fetchRandomWordAndDefinitions);

async function getDefinitionsForWord(wordId) {
  const { data, error } = await supabase
    .from("definitions")
    .select("*")
    .eq("wordid", wordId); // Match definitions with the random word's ID

  if (error) {
    console.error("Error fetching definitions:", error);
    return [];
  }

  return data; // Return the list of definitions
}

const readChinese = async (text) => {
  speakChinese(text);
};
const readEnglish = async (text) => {
  speakEnglish(text);
};
</script>

<style scoped>
.wod {
  border: px solid;
  margin: 2rem;
}
.wod-words,
.wod-word-item {
  display: flex;
  align-items: center;
}
.wod-words {
  gap: 1rem;
}
</style>
