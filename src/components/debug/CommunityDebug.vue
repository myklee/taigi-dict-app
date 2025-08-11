<template>
  <div class="community-debug">
    <h3>Community Definitions Debug</h3>
    
    <div class="debug-section">
      <h4>Authentication Status</h4>
      <p>User authenticated: {{ isAuthenticated }}</p>
      <p>User ID: {{ userId }}</p>
      <p>User role: {{ userRole }}</p>
    </div>

    <div class="debug-section">
      <h4>Community Store Status</h4>
      <p>Store initialized: {{ storeInitialized }}</p>
      <p>Can moderate: {{ canModerate }}</p>
      <p>User profile: {{ userProfile ? 'Loaded' : 'Not loaded' }}</p>
    </div>

    <div class="debug-section">
      <h4>Database Test</h4>
      <button @click="testDatabaseConnection" :disabled="testing">
        {{ testing ? 'Testing...' : 'Test Database Connection' }}
      </button>
      <div v-if="dbTestResult">
        <p>Result: {{ dbTestResult.success ? 'Success' : 'Failed' }}</p>
        <p v-if="dbTestResult.error">Error: {{ dbTestResult.error }}</p>
        <p v-if="dbTestResult.data">Found {{ dbTestResult.data.length }} definitions</p>
      </div>
    </div>

    <div class="debug-section">
      <h4>Search Test</h4>
      <input v-model="testSearchTerm" placeholder="Enter search term" />
      <button @click="testSearch" :disabled="searching">
        {{ searching ? 'Searching...' : 'Test Search' }}
      </button>
      <div v-if="searchResult">
        <p>Result: {{ searchResult.success ? 'Success' : 'Failed' }}</p>
        <p v-if="searchResult.error">Error: {{ searchResult.error }}</p>
        <p v-if="searchResult.data">Found {{ searchResult.data.length }} definitions</p>
        <div v-if="searchResult.data && searchResult.data.length > 0">
          <h5>Sample Results:</h5>
          <ul>
            <li v-for="def in searchResult.data.slice(0, 3)" :key="def.id">
              {{ def.definition }} (Score: {{ def.voteScore }}, Status: {{ def.status }})
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="debug-section">
      <h4>Submit Test Definition</h4>
      <div v-if="!isAuthenticated">
        <p>You need to be logged in to submit a test definition.</p>
      </div>
      <div v-else>
        <input v-model="testDefinition.wordId" placeholder="Word ID (e.g., 'test')" />
        <textarea v-model="testDefinition.definition" placeholder="Definition"></textarea>
        <button @click="submitTestDefinition" :disabled="submitting">
          {{ submitting ? 'Submitting...' : 'Submit Test Definition' }}
        </button>
        <div v-if="submitResult">
          <p>Result: {{ submitResult.success ? 'Success' : 'Failed' }}</p>
          <p v-if="submitResult.error">Error: {{ submitResult.error.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { supabase } from '@/supabase';

const authStore = useAuthStore();
const communityStore = useCommunityStore();

// Reactive state
const testing = ref(false);
const searching = ref(false);
const submitting = ref(false);
const dbTestResult = ref(null);
const searchResult = ref(null);
const submitResult = ref(null);
const testSearchTerm = ref('test');
const testDefinition = ref({
  wordId: 'test',
  definition: 'This is a test definition for debugging purposes.'
});

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated);
const userId = computed(() => authStore.user?.id);
const userRole = computed(() => communityStore.userProfile?.role);
const canModerate = computed(() => communityStore.canModerate);
const userProfile = computed(() => communityStore.userProfile);
const storeInitialized = computed(() => !!communityStore.userProfile);

// Methods
const testDatabaseConnection = async () => {
  testing.value = true;
  dbTestResult.value = null;
  
  try {
    // Test direct database query
    const { data, error } = await supabase
      .from('community_definitions_with_scores')
      .select('*')
      .limit(10);
    
    if (error) {
      dbTestResult.value = { success: false, error: error.message };
    } else {
      dbTestResult.value = { success: true, data };
    }
  } catch (err) {
    dbTestResult.value = { success: false, error: err.message };
  } finally {
    testing.value = false;
  }
};

const testSearch = async () => {
  searching.value = true;
  searchResult.value = null;
  
  try {
    const result = await communityStore.searchDefinitions({
      searchTerm: testSearchTerm.value,
      status: ['approved', 'pending'],
      sortBy: 'score',
      sortOrder: 'desc',
      limit: 10,
      offset: 0
    });
    
    searchResult.value = result;
  } catch (err) {
    searchResult.value = { success: false, error: err.message };
  } finally {
    searching.value = false;
  }
};

const submitTestDefinition = async () => {
  submitting.value = true;
  submitResult.value = null;
  
  try {
    const result = await communityStore.submitDefinition({
      wordId: testDefinition.value.wordId,
      definition: testDefinition.value.definition,
      usageExample: 'This is a test usage example.',
      tags: ['test', 'debug'],
      context: 'Testing community definitions functionality'
    });
    
    submitResult.value = result;
  } catch (err) {
    submitResult.value = { success: false, error: { message: err.message } };
  } finally {
    submitting.value = false;
  }
};

// Initialize on mount
onMounted(async () => {
  if (isAuthenticated.value && !storeInitialized.value) {
    await communityStore.initialize();
  }
});
</script>

<style scoped>
.community-debug {
  background: var(--black);
  border: 1px solid var(--gunmetal);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  color: var(--white);
}

.debug-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--raisinBlack);
  border-radius: 0.25rem;
}

.debug-section h4 {
  color: var(--frenchGray);
  margin-bottom: 0.5rem;
}

.debug-section p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.debug-section button {
  background: var(--slateGray);
  color: var(--white);
  border: 1px solid var(--frenchGray);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  margin: 0.5rem 0.5rem 0.5rem 0;
}

.debug-section button:hover:not(:disabled) {
  background: var(--frenchGray);
}

.debug-section button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.debug-section input,
.debug-section textarea {
  background: var(--gunmetal);
  color: var(--white);
  border: 1px solid var(--slateGray);
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.25rem 0;
  width: 100%;
  max-width: 300px;
}

.debug-section textarea {
  height: 80px;
  resize: vertical;
}

.debug-section ul {
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.debug-section li {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}
</style>