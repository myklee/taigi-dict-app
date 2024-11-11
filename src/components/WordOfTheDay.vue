<template>
  <div>
    <div v-if="randomWord">
      <h2>Word of the day</h2>
      <div class="wod">
        <div>{{ randomWord.english }}</div>
        <div>
          {{ randomWord.chinese }}<IconPlayAudio @click="readChinese(randomWord.chinese)" />
        </div>
        <div>
          {{ randomWord.romaji
          }}<AudioPlayerTaigi :audioID="randomWord.audioid" />
        </div>
      </div>
    </div>
    <button @click="fetchRandomWord">Get a different word</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "/src/supabase";
import AudioPlayerTaigi from "./AudioPlayerTaigi.vue";
import { speakChinese } from "@/utils";
import IconPlayAudio from "./icons/IconPlayAudio.vue";

// Reactive variable to hold the random word result
const randomWord = ref(null);

// Function to fetch a random word from Supabase
const fetchRandomWord = async () => {
  try {
    // Step 1: Get the total count of words
    const { count } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true });

    // Step 2: Generate a random offset based on the count
    const randomOffset = Math.floor(Math.random() * count);

    // Step 3: Fetch a random word using the random offset
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .range(randomOffset, randomOffset); // range uses inclusive start and end

    // Check for errors
    if (error) throw new Error(error.message);

    // Set the random word
    randomWord.value = data[0];
    console.log(randomWord);
  } catch (error) {
    console.error("Error fetching random word:", error.message);
  }
};
onMounted(fetchRandomWord);

const readChinese = async (text) => {
  speakChinese(text);
};
</script>

<style scoped></style>
