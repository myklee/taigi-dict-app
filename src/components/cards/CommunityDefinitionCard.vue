<template>
  <div 
    class="community-definition-card"
    :class="{ 
      'low-score': definition.voteScore < -5,
      'hidden': isHidden,
      'pending': definition.status === 'pending',
      'rejected': definition.status === 'rejected'
    }"
  >
    <!-- Community badge -->
    <div class="community-badge">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="community-icon"
      >
        <path
          d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
          fill="currentColor"
        />
        <path
          d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z"
          fill="currentColor"
        />
        <path
          d="M5 15L5.5 17L7 17.5L5.5 18L5 20L4.5 18L3 17.5L4.5 17L5 15Z"
          fill="currentColor"
        />
      </svg>
      <span class="community-label">Community</span>
    </div>

    <!-- Status indicator for pending/rejected content -->
    <div v-if="definition.status !== 'approved'" class="status-indicator">
      <span class="status-badge" :class="definition.status">
        {{ statusText }}
      </span>
    </div>

    <!-- Main content -->
    <div class="definition-content">
      <!-- Definition text -->
      <div class="definition-text">
        <p class="definition">{{ definition.definition }}</p>
        
        <!-- Usage example -->
        <div v-if="definition.usageExample" class="usage-example">
          <span class="usage-label">Example:</span>
          <span class="usage-text">{{ definition.usageExample }}</span>
        </div>

        <!-- Context -->
        <div v-if="definition.context" class="context">
          <span class="context-label">Context:</span>
          <span class="context-text">{{ definition.context }}</span>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="definition.tags && definition.tags.length > 0" class="tags">
        <span 
          v-for="tag in definition.tags" 
          :key="tag" 
          class="tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- Footer with author info and voting -->
    <div class="definition-footer">
      <!-- Author and metadata -->
      <div class="author-info">
        <div class="author-details">
          <span class="author-name">{{ definition.username }}</span>
          <span class="reputation" :class="reputationClass">
            {{ definition.authorReputation }} rep
          </span>
        </div>
        <div class="metadata">
          <time 
            :datetime="definition.createdAt.toISOString()"
            :title="formatFullDate(definition.createdAt)"
            class="submission-date"
          >
            {{ formatRelativeDate(definition.createdAt) }}
          </time>
          <span v-if="definition.updatedAt > definition.createdAt" class="edited-indicator">
            (edited)
          </span>
        </div>
      </div>

      <!-- Voting buttons -->
      <div class="voting-section">
        <VotingButtons
          :definition-id="definition.id"
          :vote-score="definition.voteScore"
          :upvotes="definition.upvotes"
          :downvotes="definition.downvotes"
          :user-vote="definition.userVote"
          :author-id="definition.userId"
          :disabled="definition.status !== 'approved'"
          @vote-submitted="handleVoteSubmitted"
          @vote-updated="handleVoteUpdated"
          @login-required="$emit('login-required')"
          @error="handleVotingError"
        />
      </div>
    </div>

    <!-- Moderator notes (visible to moderators) -->
    <div 
      v-if="definition.moderatorNotes && canViewModeratorNotes" 
      class="moderator-notes"
    >
      <div class="moderator-notes-header">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            fill="currentColor"
          />
        </svg>
        <span>Moderator Notes</span>
      </div>
      <p class="moderator-notes-text">{{ definition.moderatorNotes }}</p>
    </div>

    <!-- Hidden content overlay -->
    <div v-if="isHidden && !showHidden" class="hidden-overlay">
      <div class="hidden-content">
        <p class="hidden-message">
          This content has been hidden due to low community score ({{ definition.voteScore }}).
        </p>
        <button 
          class="show-hidden-button"
          @click="showHidden = true"
          type="button"
        >
          Show Content
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import VotingButtons from '@/components/VotingButtons.vue';

const props = defineProps({
  definition: {
    type: Object,
    required: true
  },
  hideThreshold: {
    type: Number,
    default: -5
  }
});

const emit = defineEmits([
  'vote-submitted',
  'vote-updated', 
  'login-required',
  'voting-error'
]);

// Store instances
const authStore = useAuthStore();

// Local state
const showHidden = ref(false);

// Computed properties
const isHidden = computed(() => {
  return props.definition.voteScore <= props.hideThreshold;
});

const statusText = computed(() => {
  switch (props.definition.status) {
    case 'pending':
      return 'Pending Review';
    case 'rejected':
      return 'Rejected';
    case 'hidden':
      return 'Hidden';
    default:
      return '';
  }
});

const reputationClass = computed(() => {
  const rep = props.definition.authorReputation;
  if (rep >= 1000) return 'high-reputation';
  if (rep >= 100) return 'medium-reputation';
  if (rep >= 10) return 'low-reputation';
  return 'new-user';
});

const canViewModeratorNotes = computed(() => {
  const user = authStore.user;
  return user && (user.role === 'moderator' || user.role === 'admin');
});

// Methods
function formatRelativeDate(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
}

function formatFullDate(date) {
  return date.toLocaleString();
}

function handleVoteSubmitted(voteData) {
  emit('vote-submitted', voteData);
}

function handleVoteUpdated(voteData) {
  emit('vote-updated', voteData);
}

function handleVotingError(error) {
  emit('voting-error', error);
}
</script>

<style scoped>
.community-definition-card {
  position: relative;
  background: var(--moeItemBg);
  border: 1px solid var(--slateGray);
  border-left: 4px solid #3498db; /* Blue accent for community content */
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.community-definition-card:hover {
  border-color: var(--frenchGray);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.community-definition-card.low-score {
  border-left-color: #e74c3c; /* Red accent for low-scored content */
  opacity: 0.8;
}

.community-definition-card.pending {
  border-left-color: #f39c12; /* Orange accent for pending content */
}

.community-definition-card.rejected {
  border-left-color: #e74c3c; /* Red accent for rejected content */
  opacity: 0.6;
}

.community-definition-card.hidden {
  opacity: 0.4;
}

/* Community badge */
.community-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #3498db;
  font-size: 0.875rem;
  font-weight: 500;
}

.community-icon {
  flex-shrink: 0;
}

.community-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Status indicator */
.status-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.pending {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  border: 1px solid #f39c12;
}

.status-badge.rejected {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.status-badge.hidden {
  background: rgba(172, 171, 181, 0.2);
  color: var(--frenchGray);
  border: 1px solid var(--frenchGray);
}

/* Main content */
.definition-content {
  margin-bottom: 1rem;
}

.definition-text {
  margin-bottom: 0.75rem;
}

.definition {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--white);
  margin-bottom: 0.5rem;
}

.usage-example,
.context {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.usage-label,
.context-label {
  font-weight: 600;
  color: var(--frenchGray);
  margin-right: 0.5rem;
}

.usage-text,
.context-text {
  color: var(--white);
  font-style: italic;
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid #3498db;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Footer */
.definition-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gunmetal);
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.author-name {
  font-weight: 600;
  color: var(--white);
  font-size: 0.875rem;
}

.reputation {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.reputation.new-user {
  background: rgba(172, 171, 181, 0.2);
  color: var(--frenchGray);
}

.reputation.low-reputation {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.reputation.medium-reputation {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.reputation.high-reputation {
  background: rgba(155, 89, 182, 0.2);
  color: #9b59b6;
}

.metadata {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--frenchGray);
}

.submission-date {
  cursor: help;
}

.edited-indicator {
  font-style: italic;
  opacity: 0.8;
}

.voting-section {
  flex-shrink: 0;
}

/* Moderator notes */
.moderator-notes {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(52, 152, 219, 0.1);
  border: 1px solid #3498db;
  border-radius: 0.375rem;
}

.moderator-notes-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #3498db;
  font-size: 0.875rem;
  font-weight: 600;
}

.moderator-notes-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--white);
  margin: 0;
}

/* Hidden content overlay */
.hidden-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 29, 41, 0.95);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.hidden-content {
  text-align: center;
  padding: 1rem;
}

.hidden-message {
  color: var(--frenchGray);
  margin-bottom: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.show-hidden-button {
  background: var(--slateGray);
  color: var(--white);
  border: 1px solid var(--frenchGray);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-hidden-button:hover {
  background: var(--frenchGray);
  border-color: var(--white);
}

/* Mobile responsive design */
@media (max-width: 768px) {
  .community-definition-card {
    padding: var(--card-padding-sm);
    margin-bottom: var(--space-6); /* Increased spacing for thumb navigation */
  }

  .definition-footer {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
  }

  .author-details {
    flex-wrap: wrap;
  }

  .voting-section {
    align-self: center;
  }

  .status-indicator {
    position: static;
    margin-bottom: var(--space-3);
    align-self: flex-start;
  }

  .tags {
    gap: var(--space-2);
  }

  .tag {
    font-size: var(--font-size-xs);
    padding: var(--space-1) var(--space-2);
    min-height: var(--space-8); /* Ensure touch-friendly size */
  }

  /* Touch-friendly interactions */
  .community-definition-card {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .show-hidden-button {
    padding: var(--space-4) var(--space-6);
    font-size: var(--font-size-base);
    min-height: var(--touch-target-min);
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Ensure proper spacing between interactive elements */
  .community-badge {
    margin-bottom: var(--space-4);
  }
  
  .definition-content {
    margin-bottom: var(--space-4);
  }
}

/* Touch device specific optimizations */
@media (hover: none) and (pointer: coarse) {
  .community-definition-card:active {
    transform: scale(0.99);
    transition: transform 100ms ease;
  }
  
  .show-hidden-button:active {
    transform: scale(0.95);
    transition: transform 100ms ease;
  }
  
  /* Increase spacing between interactive elements on touch devices */
  .tags {
    gap: var(--space-3);
  }
  
  .definition-footer {
    gap: var(--space-5);
  }
}

/* Thumb-friendly navigation zones */
@media (max-width: 767px) and (orientation: portrait) {
  .status-indicator {
    /* Position status in thumb-friendly zone */
    margin-bottom: var(--space-4);
  }
}

/* Landscape mobile optimizations */
@media (max-width: 767px) and (orientation: landscape) {
  .community-definition-card {
    padding: var(--space-3) var(--space-4);
  }
  
  .definition-footer {
    flex-direction: row;
    align-items: center;
    gap: var(--space-4);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .community-definition-card {
    border-width: 2px;
  }

  .community-badge,
  .tag,
  .reputation,
  .status-badge {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .community-definition-card,
  .show-hidden-button {
    transition: none;
  }

  .community-definition-card:hover {
    transform: none;
  }
}

/* Focus styles for accessibility */
.show-hidden-button:focus-visible {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .community-definition-card {
    border: 1px solid #000;
    box-shadow: none;
    break-inside: avoid;
  }

  .voting-section,
  .hidden-overlay {
    display: none;
  }

  .definition,
  .usage-text,
  .context-text,
  .author-name {
    color: #000 !important;
  }
}
</style>