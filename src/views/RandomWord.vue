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
}
.rw-header {
    background-color: var(--rw-header-background);
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}
.rw-header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
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
.rw-history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.rw-history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rw-history-word {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.rw-history-romaji {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--primary-color, white);
}

.rw-history-english {
    font-size: 0.9rem;
    color: var(--secondary-color, #ccc);
}

.rw-history-chinese {
    font-size: 1rem;
    color: var(--primary-color, white);
}

.rw-history-favorite {
    margin-left: 1rem;
    flex-shrink: 0;
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
