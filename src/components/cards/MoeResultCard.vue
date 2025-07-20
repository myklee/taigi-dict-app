<template>
  <li class="entry moe-result-item">
    <div
      v-if="word.romaji != null"
      class="word-item moe-word-taigi alphabetic"
      @click="navigateToWordDetail"
      style="cursor: pointer;"
      title="Click to view full word details"
    >
      <p>{{ word.romaji }}</p>
      <audio
        v-if="word.audio_url"
        ref="audio"
        :src="`${word.audio_url}`"
        controls
      ></audio>

      <AudioPlayerTaigi v-if="word.audioid" :audioID="word.audioid" />
    </div>

    <div class="moe-english-chinese">
      <div
        v-if="word.chinese != null"
        class="word-item moe-word-chinese logographic"
      >
        <span class="">{{ word.chinese }}</span>
        <Pinyinzhuyin :han="word.chinese" />
        <IconPlayAudio @click="$emit('readChinese', word.chinese)"></IconPlayAudio>
      </div>
      <div
        v-if="word.english != null"
        class="word-item moe-word-english alphabetic"
      >
        {{ word.english }}
        <IconPlayAudio @click="$emit('readEnglish', word.english)" />
      </div>
    </div>
    <ul>
      <li v-for="def in word.definitions" :key="def.id">
        <ul>
          <li class="alphabetic">{{ def.def_english }}</li>
          <li class="logographic">{{ def.def_chinese }}</li>
        </ul>
      </li>
    </ul>
    <div class="word-actions" @click.stop>
      <IconHeart
        :isFavorited="favoritesStore.isFavorited(word.id)"
        @click="favoritesStore.toggleFavorite(word)"
        title="Add to favorites"
      />
      <IconAdd
        class="add-definition"
        title="Add community definition"
        @click="$emit('addDefinition', word)"
      />
      <IconEdit
        class="edit-word"
        title="Edit entry"
        @click="$emit('openEditDialog', word)"
      />
    </div>
  </li>
</template>

<script setup>
import { useRouter } from 'vue-router';
import AudioPlayerTaigi from "@/components/AudioPlayerTaigi.vue";
import Pinyinzhuyin from "@/components/utility/Pinyinzhuyin.vue";
import IconPlayAudio from "@/components/icons/IconPlayAudio.vue";
import IconEdit from "@/components/icons/IconEdit.vue";
import IconHeart from "@/components/icons/IconHeart.vue";
import IconAdd from "@/components/icons/IconAdd.vue";
import { useFavoritesStore } from "@/stores/favoritesStore";

const router = useRouter();
const favoritesStore = useFavoritesStore();

const props = defineProps({
  word: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['readChinese', 'readEnglish', 'openEditDialog', 'addDefinition']);

const navigateToWordDetail = () => {
  if (props.word.id) {
    router.push({ name: 'word-detail', params: { id: props.word.id.toString() } });
  }
};
</script>

<style scoped>
.moe-result-item {
  padding: 0rem 0 2rem 0;
  background-color: var(--black);
  border-radius: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  position: relative;
  .pinyin-zhuyin {
    font-size: 1rem;
  }
}

.moe-word-taigi {
  font-size: 3rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.moe-english-chinese {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.moe-word-chinese,
.moe-word-english {
  display: flex;
  align-items: center;
  gap: 0.66rem;
  font-size: 1rem;
}

.moe-word-chinese {
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
</style>