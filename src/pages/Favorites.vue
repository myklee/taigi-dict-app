<template>
  <div id="favorites-page">
    <Loader :loading="loading" />
    
    <section class="favorites-header">
      <h2>Favorites 我的最愛</h2>
      <div class="favorites-count" v-if="favoritesStore.favorites.length">
        {{ favoritesStore.favorites.length }} word<span v-if="favoritesStore.favorites.length !== 1">s</span> saved
      </div>
      <button 
        v-if="favoritesStore.favorites.length > 0" 
        @click="clearAllFavorites"
        class="clear-favorites-btn"
      >
        Clear All
      </button>
    </section>

    <section v-if="favoritesStore.favorites.length === 0" class="empty-favorites">
      <div class="empty-message">
        <IconHeart :isFavorited="false" />
        <h3>No favorites yet</h3>
        <p>Start exploring the dictionary and click the heart icon to save words you'd like to remember!</p>
      </div>
    </section>

    <section v-else class="favorites-list">
      <ul class="results favorites-results">
        <li
          v-for="favorite in favoritesStore.favorites"
          :key="favorite.id"
          class="entry favorite-item"
        >
          <div
            v-if="favorite.word_data.romaji != null"
            :class="['word-item', 'favorite-word-taigi', 'alphabetic']"
          >
            <p>{{ favorite.word_data.romaji }}</p>
            <audio
              v-if="favorite.word_data.audio_url"
              ref="audio"
              :src="`${favorite.word_data.audio_url}`"
              controls
            ></audio>
            <AudioPlayerTaigi v-if="favorite.word_data.audioid" :audioID="favorite.word_data.audioid" />
          </div>

          <div class="favorite-english-chinese">
            <div
              v-if="favorite.word_data.chinese != null"
              class="word-item favorite-word-chinese logographic"
            >
              <span class="">{{ favorite.word_data.chinese }}</span>
              <Pinyinzhuyin :han="favorite.word_data.chinese" />
              <IconPlayAudio @click="readChinese(favorite.word_data.chinese)"></IconPlayAudio>
            </div>
            <div
              v-if="favorite.word_data.english != null"
              class="word-item favorite-word-english alphabetic"
            >
              {{ favorite.word_data.english }}
              <IconPlayAudio @click="readEnglish(favorite.word_data.english)" />
            </div>
          </div>
          
          <ul v-if="favorite.word_data.definitions">
            <li v-for="def in favorite.word_data.definitions" :key="def.id">
              <ul>
                <li class="alphabetic">{{ def.def_english }}</li>
                <li class="logographic">{{ def.def_chinese }}</li>
              </ul>
            </li>
          </ul>
          
          <div class="word-actions">
            <IconHeart
              :isFavorited="true"
              @click="favoritesStore.removeFavorite(favorite.word_data.id)"
              title="Remove from favorites"
            />
          </div>
          
          <div class="favorite-date">
            Added {{ formatDate(favorite.created_at) }}
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { speakChinese, speakEnglish } from "@/utils";
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import IconHeart from "@/components/icons/IconHeart.vue";
import Loader from "@/components/utility/Loader.vue";
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";

const favoritesStore = useFavoritesStore();
const loading = ref(false);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const clearAllFavorites = async () => {
  if (confirm('Are you sure you want to remove all favorites? This action cannot be undone.')) {
    loading.value = true;
    await favoritesStore.clearFavorites();
    loading.value = false;
  }
};

const readChinese = (text) => {
  speakChinese(text);
};

const readEnglish = (text) => {
  speakEnglish(text);
};

onMounted(async () => {
  loading.value = true;
  await favoritesStore.loadFromIndexedDB();
  await favoritesStore.loadFromSupabase();
  loading.value = false;
});
</script>

<style scoped>
#favorites-page {
  min-height: 100vh;
}

.favorites-header {
  background-color: var(--raisinBlack);
  padding: 2rem 5vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.favorites-header h2 {
  margin: 0;
  color: white;
}

.favorites-count {
  color: var(--frenchGray);
  font-size: 0.9rem;
}

.clear-favorites-btn {
  background-color: var(--gunmetal);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.clear-favorites-btn:hover {
  background-color: #e74c3c;
}

.empty-favorites {
  padding: 5rem 5vw;
  text-align: center;
}

.empty-message {
  max-width: 400px;
  margin: 0 auto;
  color: var(--frenchGray);
}

.empty-message h3 {
  margin: 1rem 0;
  color: white;
}

.empty-message p {
  line-height: 1.5;
}

.favorites-list {
  padding: 2rem 0;
}

.favorites-results {
  margin: 0 5vw;
}

.favorite-item {
  background-color: var(--black);
  border-radius: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  position: relative;
  border: 1px solid var(--gunmetal);
}

.favorite-word-taigi {
  font-size: 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.favorite-english-chinese {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.favorite-word-chinese,
.favorite-word-english {
  display: flex;
  align-items: center;
  gap: 0.66rem;
  font-size: 1rem;
}

.favorite-word-chinese {
  font-size: 1.5rem;
  line-height: 100%;
}

.word-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.favorite-date {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gunmetal);
  color: var(--frenchGray);
  font-size: 0.8rem;
}

.pinyin-zhuyin {
  font-size: 1rem;
}
</style>