<template>
  <Loader :loading="loading && !randomWordData" />

  <div v-if="randomWordData" class="rw">
    <h4>Random word</h4>
    <div class="rw-content" v-if="randomWordData">
      <div class="rw-words">
        <div class="rw-words-main">
          <div
            v-if="randomWordData.romaji"
            class="rw-word-item rw-taigi alphabetic"
          >
            {{ randomWordData.romaji }}
            <AudioPlayerTaigi
              v-if="randomWordData.audioid"
              :audioID="randomWordData.audioid"
            />
          </div>
          <div
            v-if="randomWordData.taiwanese"
            class="rw-word-item rw-taigi alphabetic"
          >
            {{ randomWordData.taiwanese }}
          </div>
          <div
            v-if="randomWordData.chinese"
            class="rw-word-item rw-chinese logographic"
          >
            {{ randomWordData.chinese }}

            <div class="pinyin-zhuyin">
              <span class="pinyin">{{
                pinyin(randomWordData.chinese).join(" ")
              }}</span>
              <span class="zhuyin">{{ randomWordData.zhuyin }}</span>
            </div>
            <IconPlayAudio
              v-if="randomWordData.chinese"
              @click="readChinese(randomWordData.chinese)"
            />
          </div>
        </div>
        <div
          v-if="randomWordData.english"
          class="rw-word-item rw-english alphabetic"
        >
          {{ randomWordData.english }}
          <IconPlayAudio
            v-if="randomWordData.english"
            @click="readEnglish(randomWordData.english)"
          />
        </div>
        <div
          v-if="randomWordData.english_mknoll"
          class="rw-word-item rw-english alphabetic"
        >
          {{ randomWordData.english_mknoll }}
          <IconPlayAudio
            v-if="randomWordData.english_mknoll"
            @click="readEnglish(randomWordData.english_mknoll)"
          />
        </div>
      </div>
      <div
        v-for="(definition, index) in randomWordData.definitions"
        :key="definition.defid"
        class="rw-definitions"
      >
        <ul>
          <li class="logographic">{{ definition.def_chinese }}</li>
          <li class="alphabetic">{{ definition.def_english }}</li>
        </ul>
      </div>
    </div>
    <button class="button-get-random" @click="fetchRandomWordAndDefinitions">
      Get random word
    </button>

    <!-- random word history-->
    <div v-if="dictionaryStore.randomWordHistory.length > 1" class="rw-history">
      <h3>History</h3>
      <ul>
        <li
          v-for="(word, index) in dictionaryStore.randomWordHistory"
          :key="index"
          :class="`rw-${index}`"
        >
          {{ word.romaji }} {{ word.english }} {{ word.chinese }}
          <!-- {{ dictionaryStore.randomWordHistory }} -->
        </li>
      </ul>
      <button @click="dictionaryStore.clearRandomWordHistory">
        Clear random word history
      </button>
    </div>
    <EditWord :visible="showDialog" :word="word" @close="closeDialog()" />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "@/supabase";
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import { speakChinese } from "@/utils";
import { speakEnglish } from "@/utils";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import Loader from "@/components/utility/Loader.vue";
import EditWord from "./EditWord.vue";
import pinyin from "pinyin";
import { useDictionaryStore } from "@/stores/dictionaryStore";

const randomWordData = ref(null);

const loading = ref(true);

const dictionaryStore = useDictionaryStore();

const fetchRandomWordAndDefinitions = async () => {
  try {
    // if (randomWordData.value != null) {
    //   dictionaryStore.addToRandomHistory(randomWordData);
    // }
    loading.value = true; // Start loading
    // Step 1: Get the total count of words
    const { count } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true });

    const randomOffset = Math.floor(Math.random() * count);

    // Step 2: Fetch a random word using the random offset
    const { data: wordData, error: wordError } = await supabase
      .from("words")
      .select("*")
      .not("romaji", "is", null) // Filter for rows where romaji is not null
      .range(randomOffset, randomOffset)
      .limit(1);

    if (wordError) throw new Error(wordError.message);

    console.log(wordData);
    const randomWord = wordData[0];

    // fetch definitions associated with the random word
    const { data: definitionsData, error: definitionsError } = await supabase
      .from("definitions")
      .select("*")
      .eq("wordid", randomWord.id);

    if (definitionsError) throw new Error(definitionsError.message);

    // Combine word and definitions in one object
    randomWord.definitions = definitionsData;

    if (randomWordData) {
      randomWordData.value = randomWord;
      console.log(randomWordData);
      dictionaryStore.addToRandomHistory(randomWord);
    }
  } catch (error) {
    console.error("Error fetching random word and definitions:", error.message);
    fetchRandomWordAndDefinitions();
  } finally {
    loading.value = false; // End loading
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
h4 {
  padding: 0.25rem 0.5rem;
  background-color: var(--rw-header-background);
}
.rw {
  border: 4px solid;
  margin: 5vw;
  background-color: var(--rw-background);
}
.rw-content {
  padding: 0rem 1rem 1rem;
}
.rw-words-main,
.rw-word-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.rw-words {
  margin: 1rem 0;
}
.rw-words-main {
  gap: 2rem;
  row-gap: 0;
}
.rw-word-item {
  gap: 0.5rem;
  .pinyin-zhuyin {
    font-size: 1rem;
  }
}
.rw-taigi,
.rw-chinese {
  font-size: 3rem;
}
.rw-english {
  font-size: 1.5rem;
  margin-top: 1rem;
}
.rw-definitions {
  margin-bottom: 1rem;
}
.button-get-random {
  margin: 0 1rem 1rem;
}
.rw-history {
  padding: 0 1rem 1rem;
}
.rw-0 {
  display: none;
}
</style>
