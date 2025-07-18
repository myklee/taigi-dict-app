<template>
  <div class="voting-buttons" :class="{ 'disabled': !canVote }">
    <!-- Upvote Button -->
    <button
      class="vote-button upvote-button"
      :class="{ 
        'active': currentUserVote === 'upvote',
        'disabled': !canVote || loading
      }"
      @click="handleVote('upvote')"
      :disabled="!canVote || loading"
      :aria-label="`Upvote this definition. Current upvotes: ${currentUpvotes}`"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="vote-icon"
      >
        <path
          d="M12 4l8 8h-6v8h-4v-8H4l8-8z"
          :fill="currentUserVote === 'upvote' ? '#27ae60' : 'none'"
          :stroke="currentUserVote === 'upvote' ? '#27ae60' : 'currentColor'"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
      <span class="vote-count">{{ currentUpvotes }}</span>
    </button>

    <!-- Vote Score Display -->
    <div class="vote-score" :class="scoreClass">
      {{ currentVoteScore }}
    </div>

    <!-- Downvote Button -->
    <button
      class="vote-button downvote-button"
      :class="{ 
        'active': currentUserVote === 'downvote',
        'disabled': !canVote || loading
      }"
      @click="handleVote('downvote')"
      :disabled="!canVote || loading"
      :aria-label="`Downvote this definition. Current downvotes: ${currentDownvotes}`"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="vote-icon"
      >
        <path
          d="M12 20l-8-8h6V4h4v8h6l-8 8z"
          :fill="currentUserVote === 'downvote' ? '#e74c3c' : 'none'"
          :stroke="currentUserVote === 'downvote' ? '#e74c3c' : 'currentColor'"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
      <span class="vote-count">{{ currentDownvotes }}</span>
    </button>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
    </div>
  </div>

  <!-- Login prompt modal -->
  <div v-if="showLoginPrompt" class="login-prompt-overlay" @click="closeLoginPrompt">
    <div class="login-prompt" @click.stop>
      <h3>Sign in to vote</h3>
      <p>You need to be logged in to vote on community definitions.</p>
      <div class="login-prompt-actions">
        <button class="login-button" @click="$emit('login-required')">
          Sign In
        </button>
        <button class="cancel-button" @click="closeLoginPrompt">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';

const props = defineProps({
  definitionId: {
    type: String,
    required: true
  },
  voteScore: {
    type: Number,
    default: 0
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  userVote: {
    type: String,
    default: null,
    validator: (value) => value === null || ['upvote', 'downvote'].includes(value)
  },
  authorId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['vote-submitted', 'vote-updated', 'login-required', 'error']);

// Store instances
const authStore = useAuthStore();
const communityStore = useCommunityStore();

// Local state
const loading = ref(false);
const showLoginPrompt = ref(false);
const error = ref(null);

// Real-time vote data (overrides props when updated)
const realtimeVoteScore = ref(props.voteScore);
const realtimeUpvotes = ref(props.upvotes);
const realtimeDownvotes = ref(props.downvotes);
const realtimeUserVote = ref(props.userVote);

// Real-time subscription cleanup function
let unsubscribeVoteUpdates = null;

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentUserId = computed(() => authStore.user?.id);

const canVote = computed(() => {
  if (props.disabled) return false;
  if (!isAuthenticated.value) return false;
  if (currentUserId.value === props.authorId) return false; // Prevent self-voting
  return true;
});

const scoreClass = computed(() => {
  if (realtimeVoteScore.value > 0) return 'positive';
  if (realtimeVoteScore.value < 0) return 'negative';
  return 'neutral';
});

// Use real-time data when available, fallback to props
const currentVoteScore = computed(() => realtimeVoteScore.value);
const currentUpvotes = computed(() => realtimeUpvotes.value);
const currentDownvotes = computed(() => realtimeDownvotes.value);
const currentUserVote = computed(() => realtimeUserVote.value);

// Methods
async function handleVote(voteType) {
  try {
    error.value = null;

    // Check authentication
    if (!isAuthenticated.value) {
      showLoginPrompt.value = true;
      return;
    }

    // Check if user can vote
    if (!canVote.value) {
      if (currentUserId.value === props.authorId) {
        error.value = 'You cannot vote on your own content';
        emit('error', error.value);
        return;
      }
      return;
    }

    loading.value = true;

    // If user already voted with the same type, remove the vote
    if (currentUserVote.value === voteType) {
      const result = await communityStore.removeVote(props.definitionId);
      if (result.success) {
        emit('vote-submitted', {
          definitionId: props.definitionId,
          voteType: null,
          previousVote: voteType
        });
      } else {
        throw new Error(result.error?.message || 'Failed to remove vote');
      }
    } else {
      // Submit new vote or change existing vote
      const result = await communityStore.submitVote(props.definitionId, voteType);
      if (result.success) {
        emit('vote-submitted', {
          definitionId: props.definitionId,
          voteType: voteType,
          previousVote: currentUserVote.value
        });
      } else {
        throw new Error(result.error?.message || 'Failed to submit vote');
      }
    }
  } catch (err) {
    console.error('Vote submission error:', err);
    error.value = err.message;
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
}

function closeLoginPrompt() {
  showLoginPrompt.value = false;
}

// Handle real-time vote updates
function handleVoteUpdate(updateData) {
  if (updateData.definitionId === props.definitionId) {
    // Get updated vote summary from store
    const voteSummary = communityStore.getVoteSummary(props.definitionId);
    
    // Update local state with real-time data
    realtimeVoteScore.value = voteSummary.score;
    realtimeUpvotes.value = voteSummary.upvotes;
    realtimeDownvotes.value = voteSummary.downvotes;
    realtimeUserVote.value = voteSummary.userVote;

    // Emit update event for parent components
    emit('vote-updated', {
      definitionId: props.definitionId,
      voteScore: voteSummary.score,
      upvotes: voteSummary.upvotes,
      downvotes: voteSummary.downvotes,
      userVote: voteSummary.userVote
    });
  }
}

// Watch for prop changes and update real-time state
watch(() => props.voteScore, (newValue) => {
  realtimeVoteScore.value = newValue;
});

watch(() => props.upvotes, (newValue) => {
  realtimeUpvotes.value = newValue;
});

watch(() => props.downvotes, (newValue) => {
  realtimeDownvotes.value = newValue;
});

watch(() => props.userVote, (newValue) => {
  realtimeUserVote.value = newValue;
});

// Watch for authentication changes
watch(isAuthenticated, (newValue) => {
  if (newValue && showLoginPrompt.value) {
    showLoginPrompt.value = false;
  }
});

// Lifecycle hooks
onMounted(() => {
  // Subscribe to real-time vote updates
  unsubscribeVoteUpdates = communityStore.onVoteUpdate(handleVoteUpdate);
});

onUnmounted(() => {
  // Clean up real-time subscription
  if (unsubscribeVoteUpdates) {
    unsubscribeVoteUpdates();
  }
});
</script>

<style scoped>
.voting-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  user-select: none;
}

.vote-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid var(--slateGray);
  border-radius: 0.5rem;
  background: var(--button-background);
  color: var(--button-text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 3rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.vote-button:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.vote-button:active:not(.disabled) {
  transform: translateY(0);
}

.vote-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-button.active.upvote-button {
  border-color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.vote-button.active.downvote-button {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.vote-icon {
  transition: all 0.2s ease;
}

.vote-button:hover:not(.disabled) .vote-icon {
  transform: scale(1.1);
}

.vote-count {
  font-size: 0.75rem;
  font-weight: 600;
}

.vote-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.vote-score.positive {
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
}

.vote-score.negative {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.vote-score.neutral {
  color: var(--frenchGray);
  background: rgba(172, 171, 181, 0.1);
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--slateGray);
  border-top: 2px solid var(--white);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Login prompt modal */
.login-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.login-prompt {
  background: var(--rw-background);
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  border: 1px solid var(--slateGray);
}

.login-prompt h3 {
  margin-bottom: 0.5rem;
  color: var(--white);
  font-size: 1.25rem;
}

.login-prompt p {
  margin-bottom: 1.5rem;
  color: var(--frenchGray);
  line-height: 1.5;
}

.login-prompt-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.login-button,
.cancel-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.login-button {
  background: #27ae60;
  border-color: #27ae60;
  color: white;
}

.login-button:hover {
  background: #219a52;
  border-color: #219a52;
}

.cancel-button {
  background: transparent;
  border-color: var(--slateGray);
  color: var(--frenchGray);
}

.cancel-button:hover {
  background: var(--slateGray);
  color: var(--white);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .voting-buttons {
    gap: 0.375rem;
  }

  .vote-button {
    padding: 0.625rem 0.5rem;
    min-width: 2.75rem;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .vote-button:hover:not(.disabled) {
    transform: none; /* Disable hover transform on mobile */
  }

  .vote-button:active:not(.disabled) {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.1);
  }

  .vote-score {
    min-width: 2rem;
    padding: 0.25rem;
    font-size: 0.8125rem;
  }

  .login-prompt {
    margin: 1rem;
    padding: 1.25rem;
  }

  .login-prompt-actions {
    flex-direction: column;
  }

  .login-button,
  .cancel-button {
    width: 100%;
    padding: 0.875rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .vote-button {
    border-width: 2px;
  }

  .vote-button.active.upvote-button {
    background: #27ae60;
    color: white;
  }

  .vote-button.active.downvote-button {
    background: #e74c3c;
    color: white;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .vote-button,
  .vote-icon,
  .spinner {
    transition: none;
    animation: none;
  }

  .vote-button:hover:not(.disabled) {
    transform: none;
  }

  .vote-button:active:not(.disabled) {
    transform: none;
  }
}

/* Focus styles for accessibility */
.vote-button:focus-visible {
  outline: 2px solid #27ae60;
  outline-offset: 2px;
}

.login-button:focus-visible,
.cancel-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Disabled state */
.voting-buttons.disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>