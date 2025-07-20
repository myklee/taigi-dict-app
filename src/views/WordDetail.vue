<template>
  <div class="word-detail">
    <Loader :loading="loading" />
    
    <div v-if="error" class="error-message">
      <h2>Error</h2>
      <p>{{ error }}</p>
      <button @click="$router.push({ name: 'dictionary' })" class="back-button">
        Back to Dictionary
      </button>
    </div>

    <div v-else-if="!loading && !word" class="not-found">
      <h2>Word Not Found</h2>
      <p>The word you're looking for could not be found.</p>
      <button @click="$router.push({ name: 'dictionary' })" class="back-button">
        Back to Dictionary
      </button>
    </div>

    <div v-else-if="word" class="word-content">
      <div class="word-header">
        <button @click="goBack" class="back-button">
          ← Back
        </button>
        <h1>Word Detail</h1>
      </div>

      <!-- MOE Word Display -->
      <div v-if="word" class="word-section">
        <h2>Ministry of Education Dictionary</h2>
        <div class="word-card">
          <MoeResultCard 
            :word="word"
            @readChinese="readChinese"
            @readEnglish="readEnglish"
            @openEditDialog="openEditDialog"
            @addDefinition="openAddDefinitionDialog"
          />
        </div>
      </div>

      <!-- Mknoll Results if available -->
      <div v-if="mknollWord" class="word-section">
        <h2>Maryknoll Dictionary</h2>
        <div class="word-card">
          <MknollResultCard 
            :word="mknollWord"
            @openEditDialog="openEditDialogMknoll"
            @addDefinition="openAddDefinitionDialog"
          />
        </div>
      </div>

      <!-- CEDICT Results if available -->
      <div v-if="cedictWords.length > 0" class="word-section">
        <h2>CEDICT Dictionary</h2>
        <div class="word-cards">
          <CedictResultCard 
            v-for="cedictWord in cedictWords"
            :key="cedictWord.id"
            :word="cedictWord"
            @readChinese="readChinese"
            @addDefinition="openAddDefinitionDialog"
          />
        </div>
      </div>

      <!-- Community Definitions -->
      <div v-if="communityDefinitions.length > 0" class="word-section">
        <h2>Community Definitions</h2>
        <div class="word-cards">
          <CommunityDefinitionCard
            v-for="definition in communityDefinitions"
            :key="definition.id"
            :definition="definition"
            @vote-submitted="handleCommunityVoteSubmitted"
            @vote-updated="handleCommunityVoteUpdated"
            @voting-error="handleCommunityVotingError"
            @login-required="handleLoginRequired"
          />
        </div>
      </div>
    </div>

    <!-- Edit Dialogs -->
    <EditWord
      :visible="showDialog"
      :word="selectedWord"
      @close="closeDialog"
    />
    <EditWordMknoll
      :visible="showDialogMknoll"
      :word="selectedWordMknoll"
      @close="closeDialogMknoll"
    />
    <CommunityDefinitionForm
      :visible="showAddDefinitionDialog"
      :word="selectedWordForDefinition"
      @close="closeAddDefinitionDialog"
      @submit="handleDefinitionSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import { speakChinese, speakEnglish } from '@/utils';
import { useCommunityStore } from '@/stores/communityStore';

import Loader from '@/components/utility/Loader.vue';
import MoeResultCard from '@/components/cards/MoeResultCard.vue';
import MknollResultCard from '@/components/cards/MknollResultCard.vue';
import CedictResultCard from '@/components/cards/CedictResultCard.vue';
import CommunityDefinitionCard from '@/components/cards/CommunityDefinitionCard.vue';
import EditWord from './EditWord.vue';
import EditWordMknoll from './EditWordMknoll.vue';
import CommunityDefinitionForm from '@/components/CommunityDefinitionForm.vue';

const route = useRoute();
const router = useRouter();
const communityStore = useCommunityStore();

// Component state
const loading = ref(false);
const error = ref(null);
const word = ref(null);
const mknollWord = ref(null);
const cedictWords = ref([]);
const communityDefinitions = ref([]);

// Dialog state
const showDialog = ref(false);
const showDialogMknoll = ref(false);
const showAddDefinitionDialog = ref(false);
const selectedWord = ref(null);
const selectedWordMknoll = ref(null);
const selectedWordForDefinition = ref(null);

// Props validation
const props = defineProps({
  id: {
    type: String,
    required: true,
    validator: (value) => {
      // Basic validation - should be a positive integer
      const num = parseInt(value);
      return !isNaN(num) && num > 0;
    }
  }
});

// Fetch word data by ID
const fetchWordById = async (wordId) => {
  if (!wordId) {
    error.value = 'Invalid word ID provided';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Validate ID format
    const numericId = parseInt(wordId);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error('Invalid word ID format');
    }

    // Fetch main word from MOE dictionary
    const { data: moeData, error: moeError } = await supabase
      .from('words')
      .select(`
        *,
        definitions (
          defid,
          wordid,
          partofspeech,
          def_chinese,
          def_english
        )
      `)
      .eq('id', numericId)
      .single();

    if (moeError && moeError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw moeError;
    }

    word.value = moeData;

    // If we found a word, search for related entries in other dictionaries
    if (moeData) {
      await fetchRelatedEntries(moeData);
    } else {
      // If no MOE word found, this is a 404
      error.value = null; // Let the template handle the "not found" case
    }

  } catch (err) {
    console.error('Error fetching word:', err);
    error.value = err.message || 'Failed to load word details';
  } finally {
    loading.value = false;
  }
};

// Fetch related entries from other dictionaries
const fetchRelatedEntries = async (moeWord) => {
  try {
    // Search Maryknoll dictionary for related entries
    if (moeWord.chinese || moeWord.english || moeWord.romaji) {
      const mknollSearchTerms = [];
      if (moeWord.chinese) mknollSearchTerms.push(`chinese.ilike.%${moeWord.chinese}%`);
      if (moeWord.english) mknollSearchTerms.push(`english_mknoll.ilike.%${moeWord.english}%`);
      if (moeWord.romaji) mknollSearchTerms.push(`taiwanese.ilike.%${moeWord.romaji}%`);

      if (mknollSearchTerms.length > 0) {
        const { data: mknollData } = await supabase
          .from('maryknoll')
          .select('*')
          .or(mknollSearchTerms.join(','))
          .limit(5);

        if (mknollData && mknollData.length > 0) {
          mknollWord.value = mknollData[0]; // Take the first match
        }
      }
    }

    // Search CEDICT for related entries
    if (moeWord.chinese) {
      const { data: cedictData } = await supabase
        .from('cedict')
        .select('*')
        .or(`traditional.ilike.%${moeWord.chinese}%,simplified.ilike.%${moeWord.chinese}%`)
        .limit(5);

      cedictWords.value = cedictData || [];
    }

    // Search community definitions
    await fetchCommunityDefinitions(moeWord);

  } catch (err) {
    console.error('Error fetching related entries:', err);
    // Don't set error here as the main word loaded successfully
  }
};

// Fetch community definitions for the word
const fetchCommunityDefinitions = async (moeWord) => {
  try {
    const searchFilters = {
      sortBy: 'score',
      sortOrder: 'desc',
      status: ['approved'],
      limit: 10
    };

    // Search using the word's terms
    const searchTerms = [moeWord.chinese, moeWord.english, moeWord.romaji]
      .filter(Boolean)
      .join(' ');

    if (searchTerms) {
      const result = await communityStore.searchDefinitions({
        ...searchFilters,
        searchTerm: searchTerms
      });

      if (result.success) {
        communityDefinitions.value = result.data;
      }
    }
  } catch (err) {
    console.error('Error fetching community definitions:', err);
  }
};

// Navigation functions
const goBack = () => {
  // Try to go back in history, fallback to dictionary
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push({ name: 'dictionary' });
  }
};

// Audio functions
const readChinese = (text) => {
  speakChinese(text);
};

const readEnglish = (text) => {
  speakEnglish(text);
};

// Dialog functions
const openEditDialog = (wordData) => {
  selectedWord.value = wordData;
  showDialog.value = true;
  document.body.style.overflow = 'hidden';
};

const closeDialog = () => {
  showDialog.value = false;
  selectedWord.value = null;
  document.body.style.overflow = 'scroll';
};

const openEditDialogMknoll = (wordData) => {
  selectedWordMknoll.value = wordData;
  showDialogMknoll.value = true;
  document.body.style.overflow = 'hidden';
};

const closeDialogMknoll = () => {
  showDialogMknoll.value = false;
  selectedWordMknoll.value = null;
  document.body.style.overflow = 'scroll';
};

const openAddDefinitionDialog = (wordData) => {
  selectedWordForDefinition.value = wordData;
  showAddDefinitionDialog.value = true;
  document.body.style.overflow = 'hidden';
};

const closeAddDefinitionDialog = () => {
  showAddDefinitionDialog.value = false;
  selectedWordForDefinition.value = null;
  document.body.style.overflow = 'scroll';
};

const handleDefinitionSubmit = async () => {
  closeAddDefinitionDialog();
  // Refresh community definitions
  if (word.value) {
    await fetchCommunityDefinitions(word.value);
  }
};

// Community event handlers
const handleCommunityVoteSubmitted = (voteData) => {
  console.log('Community vote submitted:', voteData);
};

const handleCommunityVoteUpdated = (voteData) => {
  console.log('Community vote updated:', voteData);
  const definition = communityDefinitions.value.find(def => def.id === voteData.definitionId);
  if (definition) {
    definition.voteScore = voteData.voteScore;
    definition.upvotes = voteData.upvotes;
    definition.downvotes = voteData.downvotes;
    definition.userVote = voteData.userVote;
  }
};

const handleCommunityVotingError = (error) => {
  console.error('Community voting error:', error);
};

const handleLoginRequired = () => {
  console.log('Login required for community features');
};

// Watch for route parameter changes
watch(() => route.params.id, (newId) => {
  if (newId && newId !== props.id) {
    fetchWordById(newId);
  }
});

// Load word on mount
onMounted(() => {
  fetchWordById(props.id);
});
</script>

<style scoped>
.word-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.word-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--frenchGray);
}

.word-header h1 {
  margin: 0;
  color: var(--white);
}

.back-button {
  background-color: var(--frenchGray);
  color: var(--white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--white);
  color: var(--black);
}

.word-section {
  margin-bottom: 3rem;
}

.word-section h2 {
  color: var(--white);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--frenchGray);
}

.word-card,
.word-cards {
  background-color: var(--raisinBlack);
  border-radius: 0.5rem;
  padding: 1rem;
}

.word-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-message,
.not-found {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--white);
}

.error-message h2,
.not-found h2 {
  color: var(--red);
  margin-bottom: 1rem;
}

.error-message p,
.not-found p {
  margin-bottom: 2rem;
  color: var(--frenchGray);
}

@media (max-width: 768px) {
  .word-detail {
    padding: 0.5rem;
  }
  
  .word-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .word-section {
    margin-bottom: 2rem;
  }
}
</style>