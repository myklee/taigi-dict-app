<template>
    <Loader :loading="loading && !randomWordData" />

    <div v-if="randomWordData" class="rw">
        <Loader :loading="loading"></Loader>
        <header class="rw-header">
            <h3>Random word</h3>
            <div class="rw-header-actions">
                <IconHeart
                    v-if="randomWordData && randomWordData.id"
                    :isFavorited="favoritesStore.isFavorited(randomWordData.id)"
                    @click="favoritesStore.toggleFavorite(randomWordData)"
                    title="Add to favorites"
                    class="rw-favorite"
                />
                <IconRefresh
                    class="rw-get-word"
                    color="#a5a5a5"
                    @click="fetchRandomWordAndDefinitions"
                />
                <IconEdit
                    v-if="randomWordData"
                    class="edit-rw"
                    @click="openEditDialog(randomWordData)"
                />
            </div>
        </header>

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
                            <span class="zhuyin">{{
                                randomWordData.zhuyin
                            }}</span>
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

        <!-- random word history-->
        <div
            v-if="dictionaryStore.randomWordHistory.length > 1"
            class="rw-history"
        >
            <div class="rw-history-header">
                <h3>Random word history</h3>
                <IconTrash @click="dictionaryStore.clearRandomWordHistory" />
            </div>
            <ul>
                <li
                    v-for="(word, index) in dictionaryStore.randomWordHistory"
                    :key="index"
                    :class="`rw-${index}`"
                    class="rw-history-item"
                >
                    <div class="rw-history-word">
                        <span class="rw-history-romaji">{{ word.romaji }}</span>
                        <span class="rw-history-english">{{
                            word.english
                        }}</span>
                        <span class="rw-history-chinese">{{
                            word.chinese
                        }}</span>
                    </div>
                    <IconHeart
                        :isFavorited="favoritesStore.isFavorited(word.id)"
                        @click="favoritesStore.toggleFavorite(word)"
                        title="Add to favorites"
                        class="rw-history-favorite"
                    />
                </li>
            </ul>
        </div>

        <EditWord
            :visible="showDialog"
            :word="randomWordData"
            @close="closeDialog()"
        />
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "@/supabase";
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import { speakChinese } from "@/utils";
import { speakEnglish } from "@/utils";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import IconRefresh from "@/components/icons/IconRefresh.vue";
import Loader from "@/components/utility/Loader.vue";
import EditWord from "./EditWord.vue";
import pinyin from "pinyin";
import { useDictionaryStore } from "@/stores/dictionaryStore";
import IconTrash from "@/components/icons/IconTrash.vue";
import IconEdit from "@/components/icons/IconEdit.vue";
import IconHeart from "@/components/icons/IconHeart.vue";
import { useFavoritesStore } from "@/stores/favoritesStore";

const randomWordData = ref(null);

const loading = ref(true);
const dictionaryStore = useDictionaryStore();
const favoritesStore = useFavoritesStore();
const showDialog = ref(false);
const closeDialog = () => {
    showDialog.value = false;
    document.body.style.overflow = "scroll";
};

const fetchRandomWordAndDefinitions = async () => {
    try {
        loading.value = true; // Start loading
        // Step 1: Get the total count of words
        const { count } = await supabase
            .from("words")
            .select("*", { count: "exact", head: true });

        if (!count || count === 0) {
            throw new Error("No words found in database");
        }

        const randomOffset = Math.floor(Math.random() * count);

        // Step 2: Fetch a random word using the random offset
        const { data: wordData, error: wordError } = await supabase
            .from("words")
            .select("*")
            .not("romaji", "is", null) // Filter for rows where romaji is not null
            .range(randomOffset, randomOffset)
            .limit(1);

        if (wordError) throw new Error(wordError.message);
        if (!wordData || wordData.length === 0) {
            throw new Error("No word data returned");
        }

        const randomWord = wordData[0];
        if (!randomWord || !randomWord.id) {
            throw new Error("Invalid word data - missing ID");
        }

        // fetch definitions associated with the random word
        const { data: definitionsData, error: definitionsError } =
            await supabase
                .from("definitions")
                .select("*")
                .eq("wordid", randomWord.id);

        if (definitionsError) throw new Error(definitionsError.message);

        // Combine word and definitions in one object
        randomWord.definitions = definitionsData || [];

        // Set the random word data
        randomWordData.value = randomWord;
        dictionaryStore.addToRandomHistory(randomWord);
    } catch (error) {
        console.error(
            "Error fetching random word and definitions:",
            error.message,
        );
        // Don't recursively call this function to avoid infinite loops
        // Instead, set loading to false and show an error state
    } finally {
        loading.value = false; // End loading
    }
};

onMounted(async () => {
    await favoritesStore.loadFromIndexedDB();
    await favoritesStore.loadFromSupabase();
    fetchRandomWordAndDefinitions();
});

const readChinese = async (text) => {
    speakChinese(text);
};
const readEnglish = async (text) => {
    speakEnglish(text);
};

const openEditDialog = (word) => {
    showDialog.value = true;
    document.body.style.overflow = "hidden";
};
</script>

<style scoped>
.rw {
    position: relative;
    border: 4px solid;
    margin: 5vw;
    background-color: var(--rw-background);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

/* Mobile-first responsive design */
@media (max-width: 767px) {
  .rw {
    margin: var(--space-4);
    border-width: 2px;
  }
}

@media (min-width: 768px) {
  .rw {
    margin: var(--space-8);
    border-radius: var(--radius-xl);
  }
}

@media (min-width: 1024px) {
  .rw {
    margin: var(--space-12);
  }
}
.rw-header {
    background-color: var(--rw-header-background);
    padding: var(--space-4) var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: var(--touch-target-comfortable);
}

/* Mobile-optimized header */
@media (max-width: 767px) {
  .rw-header {
    padding: var(--space-3) var(--space-4);
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  
  .rw-header h3 {
    font-size: var(--font-size-lg);
    flex: 1;
    min-width: 0;
  }
}

@media (min-width: 768px) {
  .rw-header {
    padding: var(--space-5) var(--space-6);
  }
  
  .rw-header h3 {
    font-size: var(--font-size-xl);
  }
}
.rw-header-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    flex-shrink: 0;
}

/* Mobile-optimized header actions */
@media (max-width: 767px) {
  .rw-header-actions {
    gap: var(--space-3);
  }
  
  .rw-header-actions > * {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: var(--transition-colors);
  }
  
  .rw-header-actions > *:hover {
    background: var(--surface-background-hover);
  }
  
  .rw-header-actions > *:active {
    transform: scale(0.95);
    transition: transform 100ms ease;
  }
}

@media (min-width: 768px) {
  .rw-header-actions {
    gap: var(--space-4);
  }
}
.rw-content {
    padding: var(--space-4);
}

.rw-words-main,
.rw-word-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

.rw-words {
    margin: var(--space-6) 0;
}

.rw-words-main {
    gap: var(--space-8);
    row-gap: var(--space-4);
}

.rw-word-item {
    gap: var(--space-3);
}

.rw-word-item .pinyin-zhuyin {
    font-size: var(--font-size-base);
}

.rw-taigi,
.rw-chinese {
    font-size: var(--font-size-5xl);
    line-height: var(--line-height-tight);
}

.rw-english {
    font-size: var(--font-size-2xl);
    margin-top: var(--space-4);
    line-height: var(--line-height-snug);
}

/* Mobile-first responsive typography and layout */
@media (max-width: 767px) {
  .rw-content {
    padding: var(--space-3) var(--space-4);
  }
  
  .rw-words {
    margin: var(--space-4) 0;
  }
  
  .rw-words-main {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
    row-gap: var(--space-4);
  }
  
  .rw-word-item {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
  
  .rw-taigi,
  .rw-chinese {
    font-size: var(--font-size-3xl);
    word-break: break-word;
  }
  
  .rw-english {
    font-size: var(--font-size-lg);
    margin-top: var(--space-3);
    word-break: break-word;
  }
  
  /* Optimize audio controls for mobile */
  .rw-word-item .audio-controls {
    width: 100%;
    justify-content: flex-start;
    margin-top: var(--space-2);
  }
  
  /* Better spacing for pronunciation elements */
  .pinyin-zhuyin {
    width: 100%;
    margin-top: var(--space-2);
  }
}

@media (min-width: 768px) {
  .rw-content {
    padding: var(--space-6);
  }
  
  .rw-words {
    margin: var(--space-8) 0;
  }
  
  .rw-words-main {
    gap: var(--space-10);
  }
  
  .rw-word-item {
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .rw-content {
    padding: var(--space-8);
  }
  
  .rw-taigi,
  .rw-chinese {
    font-size: var(--font-size-5xl);
  }
  
  .rw-english {
    font-size: var(--font-size-2xl);
  }
}
.rw-definitions {
    margin-bottom: var(--space-4);
    padding: var(--space-4);
    background: var(--surface-background-hover);
    border-radius: var(--radius-md);
    border: 1px solid var(--surface-border);
}

.rw-definitions ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.rw-definitions li {
    line-height: var(--line-height-relaxed);
}

.rw-definitions li.logographic {
    font-size: var(--font-size-base);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
}

.rw-definitions li.alphabetic {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
}

.rw-history {
    padding: var(--space-4);
    border-top: 1px solid var(--surface-border);
    background: var(--surface-background);
}

/* Mobile-optimized definitions and history */
@media (max-width: 767px) {
  .rw-definitions {
    margin-bottom: var(--space-3);
    padding: var(--space-3);
  }
  
  .rw-definitions li.logographic {
    font-size: var(--font-size-sm);
  }
  
  .rw-definitions li.alphabetic {
    font-size: var(--font-size-xs);
  }
  
  .rw-history {
    padding: var(--space-3) var(--space-4);
  }
}

@media (min-width: 768px) {
  .rw-definitions {
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }
  
  .rw-history {
    padding: var(--space-6);
  }
}
.rw-history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--surface-border);
}

.rw-history-header h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
}

.rw-history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--surface-border);
    transition: var(--transition-colors);
    border-radius: var(--radius-md);
    margin: var(--space-1) calc(var(--space-1) * -1);
    padding-left: var(--space-1);
    padding-right: var(--space-1);
}

.rw-history-item:hover {
    background: var(--surface-background-hover);
}

.rw-history-item:last-child {
    border-bottom: none;
}

.rw-history-word {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
    min-width: 0;
}

.rw-history-romaji {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    word-break: break-word;
}

.rw-history-english {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    word-break: break-word;
}

.rw-history-chinese {
    font-size: var(--font-size-base);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    word-break: break-word;
}

.rw-history-favorite {
    margin-left: var(--space-3);
    flex-shrink: 0;
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: var(--transition-colors);
}

.rw-history-favorite:hover {
    background: var(--surface-background-hover);
}

/* Mobile-optimized history */
@media (max-width: 767px) {
  .rw-history-header {
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
  }
  
  .rw-history-header h3 {
    font-size: var(--font-size-base);
  }
  
  .rw-history-item {
    padding: var(--space-4) var(--space-2);
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }
  
  .rw-history-word {
    gap: var(--space-2);
  }
  
  .rw-history-romaji {
    font-size: var(--font-size-base);
  }
  
  .rw-history-english {
    font-size: var(--font-size-xs);
  }
  
  .rw-history-chinese {
    font-size: var(--font-size-sm);
  }
  
  .rw-history-favorite {
    align-self: flex-end;
    margin-left: 0;
    margin-top: var(--space-2);
  }
}

@media (min-width: 768px) {
  .rw-history-header {
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-4);
  }
  
  .rw-history-item {
    padding: var(--space-4) var(--space-2);
  }
  
  .rw-history-favorite {
    margin-left: var(--space-4);
  }
}

.rw-0 {
    display: none;
}
.rw-favorite {
    transition: all 0.2s ease;
}

.rw-favorite:hover {
    transform: scale(1.1);
}
</style>
