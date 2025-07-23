<template>
  <div class="moe-word-detail">
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
      <p>The MOE dictionary entry you're looking for could not be found.</p>
      <button @click="$router.push({ name: 'dictionary' })" class="back-button">
        Back to Dictionary
      </button>
    </div>

    <div v-else-if="word" class="word-content">
      <div class="word-header">
        <button @click="goBack" class="back-button">
          ← Back
        </button>
        <h1>Ministry of Education Dictionary</h1>
      </div>

      <!-- MOE Word Display -->
      <div class="word-section">
        <div class="word-card">
          <MoeResultCard 
            :word="word"
            :primaryLanguage="primaryLanguage"
            :searchQuery="word.chinese || word.english || word.romaji"
            @readChinese="readChinese"
            @readEnglish="readEnglish"
            @openEditDialog="openEditDialog"
            @addDefinition="openAddDefinitionDialog"
          />
        </div>
      </div>

      <!-- Community Definitions for this word -->
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
import { speakChinese, speakEnglish, detectSearchLanguage } from '@/utils';
import { useCommunityStore } from '@/stores/communityStore';

import Loader from '@/components/utility/Loader.vue';
import MoeResultCard from '@/components/cards/MoeResultCard.vue';
import CommunityDefinitionCard from '@/components/cards/CommunityDefinitionCard.vue';
import EditWord from './EditWord.vue';
import CommunityDefinitionForm from '@/components/CommunityDefinitionForm.vue';

const route = useRoute();
const router = useRouter();
const communityStore = useCommunityStore();

// Component state
const loading = ref(false);
const error = ref(null);
const word = ref(null);
const communityDefinitions = ref([]);
const primaryLanguage = ref('unknown');

// Dialog state
const showDialog = ref(false);
const showAddDefinitionDialog = ref(false);
const selectedWord = ref(null);
const selectedWordForDefinition = ref(null);

// Props validation
const props = defineProps({
  id: {
    type: String,
    required: true,
    validator: (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num > 0;
    }
  }
});

// Fetch MOE word data by ID
const fetchWordById = async (wordId) => {
  if (!wordId) {
    error.value = 'Invalid word ID provided';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const numericId = parseInt(wordId);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error('Invalid word ID format');
    }

    // Fetch word from MOE dictionary
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

    if (moeError && moeError.code !== 'PGRST116') {
      throw moeError;
    }

    word.value = moeData;

    if (moeData) {
      // Detect primary language based on the word content
      const searchTerm = moeData.chinese || moeData.english || moeData.romaji || '';
      primaryLanguage.value = detectSearchLanguage(searchTerm).language;
      
      // Fetch community definitions
      await fetchCommunityDefinitions(moeData);
    }

  } catch (err) {
    console.error('Error fetching MOE word:', err);
    error.value = err.message || 'Failed to load word details';
  } finally {
    loading.value = false;
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
.moe-word-detail {
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
  font-size: 1.8rem;
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
  .moe-word-detail {
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