<template>
  <div class="community-submission-manager">
    <!-- Submission Form -->
    <div v-if="currentStep === 'form'" class="submission-step">
      <CommunityDefinitionForm
        :word-id="wordId"
        :initial-data="draftData"
        @success="handleSubmissionSuccess"
        @cancel="handleCancel"
        @draft-saved="handleDraftSaved"
      />
    </div>

    <!-- Submission Status -->
    <div v-else-if="currentStep === 'status'" class="submission-step">
      <div class="status-container">
        <div class="status-header">
          <div class="status-icon" :class="statusIconClass">
            {{ statusIconText }}
          </div>
          <h2 class="status-title">{{ statusTitle }}</h2>
          <p class="status-message">{{ statusMessage }}</p>
        </div>

        <!-- Submission Details -->
        <div v-if="submissionData" class="submission-details">
          <div class="detail-item">
            <span class="detail-label">Submission ID:</span>
            <span class="detail-value">{{ submissionData.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-badge" :class="statusBadgeClass">
              {{ submissionData.status }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Submitted:</span>
            <span class="detail-value">{{ formatDate(submissionData.createdAt) }}</span>
          </div>
          <div v-if="submissionData.moderatorNotes" class="detail-item">
            <span class="detail-label">Notes:</span>
            <span class="detail-value">{{ submissionData.moderatorNotes }}</span>
          </div>
        </div>

        <!-- Progress Indicator -->
        <div v-if="submissionData?.status === 'pending'" class="progress-indicator">
          <div class="progress-steps">
            <div class="step completed">
              <div class="step-icon">✓</div>
              <span class="step-label">Submitted</span>
            </div>
            <div class="step active">
              <div class="step-icon">⏳</div>
              <span class="step-label">Under Review</span>
            </div>
            <div class="step">
              <div class="step-icon">📝</div>
              <span class="step-label">Decision</span>
            </div>
          </div>
          <p class="progress-note">
            Your submission is being reviewed by the community. This typically takes 1-3 days.
          </p>
        </div>

        <!-- Actions -->
        <div class="status-actions">
          <button
            v-if="canEdit"
            class="btn-secondary"
            @click="editSubmission"
          >
            Edit Submission
          </button>
          <button
            v-if="canWithdraw"
            class="btn-danger"
            @click="withdrawSubmission"
          >
            Withdraw Submission
          </button>
          <button
            class="btn-primary"
            @click="handleContinue"
          >
            {{ continueButtonText }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="currentStep === 'error'" class="submission-step">
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Submission Failed</h2>
        <p class="error-message">{{ errorMessage }}</p>
        
        <!-- Error Details -->
        <div v-if="errorDetails" class="error-details">
          <details>
            <summary>Error Details</summary>
            <pre>{{ errorDetails }}</pre>
          </details>
        </div>

        <!-- Retry Actions -->
        <div class="error-actions">
          <button class="btn-secondary" @click="goBackToForm">
            Go Back
          </button>
          <button class="btn-primary" @click="retrySubmission">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Offline Indicator -->
    <div v-if="isOffline" class="offline-indicator">
      <div class="offline-content">
        <span class="offline-icon">📡</span>
        <span class="offline-text">
          You're offline. Your changes are being saved locally and will sync when you're back online.
        </span>
      </div>
    </div>

    <!-- Draft Status -->
    <div v-if="hasDraft && currentStep === 'form'" class="draft-indicator">
      <div class="draft-content">
        <span class="draft-icon">💾</span>
        <span class="draft-text">
          Draft saved {{ formatRelativeTime(draftTimestamp) }}
        </span>
        <button class="clear-draft-btn" @click="clearDraft">
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import CommunityDefinitionForm from './CommunityDefinitionForm.vue';

// Props
const props = defineProps({
  wordId: {
    type: String,
    required: true
  },
  initialStep: {
    type: String,
    default: 'form',
    validator: (value) => ['form', 'status', 'error'].includes(value)
  },
  submissionId: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['complete', 'cancel', 'status-change']);

// Stores
const communityStore = useCommunityStore();
const authStore = useAuthStore();

// State
const currentStep = ref(props.initialStep);
const submissionData = ref(null);
const errorMessage = ref('');
const errorDetails = ref('');
const draftData = ref({});
const draftTimestamp = ref(null);
const isOffline = ref(!navigator.onLine);

// Computed properties
const statusTitle = computed(() => {
  if (!submissionData.value) return '';
  
  switch (submissionData.value.status) {
    case 'pending':
      return 'Submission Under Review';
    case 'approved':
      return 'Submission Approved!';
    case 'rejected':
      return 'Submission Rejected';
    case 'hidden':
      return 'Submission Hidden';
    default:
      return 'Submission Status';
  }
});

const statusMessage = computed(() => {
  if (!submissionData.value) return '';
  
  switch (submissionData.value.status) {
    case 'pending':
      return 'Your definition has been submitted and is awaiting community review.';
    case 'approved':
      return 'Congratulations! Your definition has been approved and is now visible to all users.';
    case 'rejected':
      return 'Your submission has been rejected. Please review the feedback and consider resubmitting.';
    case 'hidden':
      return 'Your submission has been hidden due to community reports or moderation.';
    default:
      return '';
  }
});

const statusIconText = computed(() => {
  if (!submissionData.value) return '';
  
  switch (submissionData.value.status) {
    case 'pending':
      return '⏳';
    case 'approved':
      return '✅';
    case 'rejected':
      return '❌';
    case 'hidden':
      return '👁️‍🗨️';
    default:
      return '📄';
  }
});

const statusIconClass = computed(() => {
  if (!submissionData.value) return '';
  
  switch (submissionData.value.status) {
    case 'pending':
      return 'status-pending';
    case 'approved':
      return 'status-approved';
    case 'rejected':
      return 'status-rejected';
    case 'hidden':
      return 'status-hidden';
    default:
      return '';
  }
});

const statusBadgeClass = computed(() => {
  if (!submissionData.value) return '';
  
  switch (submissionData.value.status) {
    case 'pending':
      return 'badge-pending';
    case 'approved':
      return 'badge-approved';
    case 'rejected':
      return 'badge-rejected';
    case 'hidden':
      return 'badge-hidden';
    default:
      return '';
  }
});

const canEdit = computed(() => {
  return submissionData.value?.status === 'pending' || 
         submissionData.value?.status === 'rejected';
});

const canWithdraw = computed(() => {
  return submissionData.value?.status === 'pending';
});

const continueButtonText = computed(() => {
  switch (submissionData.value?.status) {
    case 'approved':
      return 'View Definition';
    case 'rejected':
      return 'Submit New Definition';
    default:
      return 'Continue';
  }
});

const hasDraft = computed(() => {
  return Object.keys(draftData.value).length > 0 && draftTimestamp.value;
});

// Methods
const handleSubmissionSuccess = (data) => {
  submissionData.value = data;
  currentStep.value = 'status';
  emit('status-change', 'submitted', data);
  
  // Clear any draft data
  clearDraft();
};

const handleSubmissionError = (error) => {
  errorMessage.value = error.message || 'An unexpected error occurred';
  errorDetails.value = error.details ? JSON.stringify(error.details, null, 2) : '';
  currentStep.value = 'error';
  emit('status-change', 'error', error);
};

const handleCancel = () => {
  emit('cancel');
};

const handleDraftSaved = (data) => {
  draftData.value = data;
  draftTimestamp.value = data.timestamp;
};

const handleContinue = () => {
  switch (submissionData.value?.status) {
    case 'approved':
      // Navigate to the definition view
      emit('complete', { action: 'view', data: submissionData.value });
      break;
    case 'rejected':
      // Go back to form for new submission
      currentStep.value = 'form';
      submissionData.value = null;
      break;
    default:
      emit('complete', { action: 'continue', data: submissionData.value });
  }
};

const editSubmission = () => {
  // Load current submission data into form
  if (submissionData.value) {
    draftData.value = {
      definition: submissionData.value.definition,
      usageExample: submissionData.value.usageExample,
      tags: submissionData.value.tags || [],
      context: submissionData.value.context
    };
  }
  currentStep.value = 'form';
};

const withdrawSubmission = async () => {
  if (!submissionData.value) return;
  
  if (confirm('Are you sure you want to withdraw this submission? This action cannot be undone.')) {
    try {
      const result = await communityStore.deleteDefinition(submissionData.value.id);
      if (result.success) {
        emit('complete', { action: 'withdrawn', data: submissionData.value });
      } else {
        handleSubmissionError(result.error);
      }
    } catch (error) {
      handleSubmissionError(error);
    }
  }
};

const goBackToForm = () => {
  currentStep.value = 'form';
  errorMessage.value = '';
  errorDetails.value = '';
};

const retrySubmission = () => {
  // This would trigger a retry of the last submission
  goBackToForm();
};

const clearDraft = () => {
  const draftKey = `community-definition-draft-${props.wordId}`;
  localStorage.removeItem(draftKey);
  draftData.value = {};
  draftTimestamp.value = null;
};

const loadDraft = () => {
  try {
    const draftKey = `community-definition-draft-${props.wordId}`;
    const draftJson = localStorage.getItem(draftKey);
    if (draftJson) {
      const parsed = JSON.parse(draftJson);
      
      // Only load if draft is less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        draftData.value = parsed;
        draftTimestamp.value = parsed.timestamp;
      } else {
        clearDraft();
      }
    }
  } catch (error) {
    console.error('Failed to load draft:', error);
  }
};

const loadSubmissionStatus = async () => {
  if (props.submissionId) {
    try {
      // Fetch submission status from store
      const definitions = communityStore.communityDefinitions;
      const submission = definitions.find(def => def.id === props.submissionId);
      
      if (submission) {
        submissionData.value = submission;
        currentStep.value = 'status';
      } else {
        // Try to fetch from server
        const result = await communityStore.fetchDefinitionsForWord(props.wordId);
        if (result.success) {
          const submission = result.data.find(def => def.id === props.submissionId);
          if (submission) {
            submissionData.value = submission;
            currentStep.value = 'status';
          }
        }
      }
    } catch (error) {
      console.error('Failed to load submission status:', error);
    }
  }
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

// Network status handling
const handleOnline = () => {
  isOffline.value = false;
};

const handleOffline = () => {
  isOffline.value = true;
};

// Lifecycle
onMounted(() => {
  loadDraft();
  loadSubmissionStatus();
  
  // Listen for network status changes
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});

// Watch for submission data changes
watch(
  () => submissionData.value,
  (newData) => {
    if (newData) {
      emit('status-change', newData.status, newData);
    }
  }
);
</script>

<style scoped>
.community-submission-manager {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.submission-step {
  min-height: 400px;
}

/* Status Container */
.status-container {
  background: var(--raisinBlack);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}

.status-header {
  margin-bottom: 2rem;
}

.status-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.status-icon.status-pending {
  background-color: #fbbf24;
  color: #92400e;
}

.status-icon.status-approved {
  background-color: #10b981;
  color: white;
}

.status-icon.status-rejected {
  background-color: #ef4444;
  color: white;
}

.status-icon.status-hidden {
  background-color: var(--slateGray);
  color: white;
}

.status-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--white);
}

.status-message {
  margin: 0;
  color: var(--frenchGray);
  font-size: 1rem;
  line-height: 1.5;
}

/* Submission Details */
.submission-details {
  background: var(--gunmetal);
  border-radius: 6px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--slateGray);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: var(--frenchGray);
}

.detail-value {
  color: var(--white);
  text-align: right;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.badge-pending {
  background-color: #fbbf24;
  color: #92400e;
}

.badge-approved {
  background-color: #10b981;
  color: white;
}

.badge-rejected {
  background-color: #ef4444;
  color: white;
}

.badge-hidden {
  background-color: var(--slateGray);
  color: white;
}

/* Progress Indicator */
.progress-indicator {
  margin: 2rem 0;
}

.progress-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
}

.step.completed,
.step.active {
  opacity: 1;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--gunmetal);
  color: var(--white);
  font-size: 1.2rem;
}

.step.completed .step-icon {
  background-color: #10b981;
}

.step.active .step-icon {
  background-color: #3b82f6;
}

.step-label {
  font-size: 0.8rem;
  color: var(--frenchGray);
}

.progress-note {
  color: var(--slateGray);
  font-size: 0.9rem;
  font-style: italic;
  margin: 0;
}

/* Actions */
.status-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: var(--gunmetal);
  color: var(--white);
  border: 1px solid var(--slateGray);
}

.btn-secondary:hover {
  background-color: var(--slateGray);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

/* Error Container */
.error-container {
  background: var(--raisinBlack);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ef4444;
}

.error-message {
  margin: 0 0 1rem 0;
  color: var(--frenchGray);
  font-size: 1rem;
  line-height: 1.5;
}

.error-details {
  margin: 1rem 0;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: var(--slateGray);
  font-size: 0.9rem;
}

.error-details pre {
  background: var(--gunmetal);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8rem;
  color: var(--frenchGray);
  margin-top: 0.5rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

/* Indicators */
.offline-indicator,
.draft-indicator {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
}

.offline-content,
.draft-content {
  background: var(--gunmetal);
  color: var(--white);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 0.9rem;
}

.offline-indicator .offline-content {
  background: #f59e0b;
  color: #92400e;
}

.clear-draft-btn {
  background: none;
  border: none;
  color: var(--slateGray);
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: underline;
  padding: 0;
  margin-left: 0.5rem;
}

.clear-draft-btn:hover {
  color: var(--white);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .status-container,
  .error-container {
    padding: 1.5rem;
    margin: 0 1rem;
  }
  
  .status-actions,
  .error-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary,
  .btn-danger {
    width: 100%;
    padding: 1rem;
  }
  
  .progress-steps {
    gap: 1rem;
  }
  
  .step-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .offline-indicator,
  .draft-indicator {
    position: static;
    margin: 1rem;
  }
  
  .submission-details {
    padding: 1rem;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .detail-value {
    text-align: left;
  }
}
</style>