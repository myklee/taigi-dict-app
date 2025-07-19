<template>
  <div class="moderation-panel">
    <!-- Header -->
    <div class="panel-header">
      <h2 class="panel-title">Community Moderation</h2>
      <div class="header-stats">
        <span class="stat-item">
          <span class="stat-number">{{ moderationQueue.length }}</span>
          <span class="stat-label">Pending</span>
        </span>
        <span class="stat-item">
          <span class="stat-number">{{ selectedItems.length }}</span>
          <span class="stat-label">Selected</span>
        </span>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-bar">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search definitions, words, or authors..."
          class="search-input"
          @input="debouncedSearch"
        />
        <button @click="clearSearch" class="clear-search-btn" v-if="searchTerm">
          ×
        </button>
      </div>

      <div class="filter-controls">
        <select v-model="statusFilter" @change="applyFilters" class="filter-select">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All Status</option>
        </select>

        <select v-model="sortBy" @change="applyFilters" class="filter-select">
          <option value="created_at">Date Submitted</option>
          <option value="vote_score">Vote Score</option>
          <option value="username">Author</option>
          <option value="word_id">Word</option>
        </select>

        <select v-model="sortOrder" @change="applyFilters" class="filter-select">
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>

        <input
          v-model="dateFrom"
          type="date"
          class="date-input"
          @change="applyFilters"
          placeholder="From date"
        />

        <input
          v-model="dateTo"
          type="date"
          class="date-input"
          @change="applyFilters"
          placeholder="To date"
        />
      </div>
    </div>

    <!-- Bulk Actions -->
    <div class="bulk-actions" v-if="selectedItems.length > 0">
      <div class="bulk-actions-left">
        <button @click="selectAll" class="bulk-btn secondary">
          {{ selectedItems.length === moderationQueue.length ? 'Deselect All' : 'Select All' }}
        </button>
        <span class="selection-count">{{ selectedItems.length }} item(s) selected</span>
      </div>

      <div class="bulk-actions-right">
        <button
          @click="showBulkApproveModal = true"
          class="bulk-btn approve"
          :disabled="loading"
        >
          Bulk Approve ({{ selectedItems.length }})
        </button>
        <button
          @click="showBulkRejectModal = true"
          class="bulk-btn reject"
          :disabled="loading"
        >
          Bulk Reject ({{ selectedItems.length }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading moderation queue...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchQueue" class="retry-btn">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && moderationQueue.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No items in moderation queue</h3>
      <p>All submissions have been reviewed or no submissions match your filters.</p>
    </div>

    <!-- Moderation Queue List -->
    <div v-if="!loading && !error && moderationQueue.length > 0" class="queue-list">
      <div
        v-for="item in moderationQueue"
        :key="item.id"
        class="queue-item"
        :class="{ selected: selectedItems.includes(item.id) }"
      >
        <div class="item-header">
          <div class="item-header-left">
            <input
              type="checkbox"
              :checked="selectedItems.includes(item.id)"
              @change="toggleSelection(item.id)"
              class="item-checkbox"
            />
            <div class="item-meta">
              <span class="word-id">{{ item.word_id }}</span>
              <span class="status-badge" :class="item.status">{{ item.status }}</span>
              <span class="vote-score" :class="getVoteScoreClass(item.voteScore)">
                {{ item.voteScore >= 0 ? '+' : '' }}{{ item.voteScore }}
              </span>
            </div>
          </div>

          <div class="item-header-right">
            <span class="author-info">
              by {{ item.username }}
              <span class="reputation">({{ item.authorReputation }} rep)</span>
            </span>
            <span class="submission-date">{{ formatDate(item.createdAt) }}</span>
          </div>
        </div>

        <div class="item-content">
          <div class="definition-text">
            <strong>Definition:</strong> {{ item.definition }}
          </div>
          
          <div v-if="item.usage_example" class="usage-example">
            <strong>Usage:</strong> {{ item.usage_example }}
          </div>

          <div v-if="item.context" class="context">
            <strong>Context:</strong> {{ item.context }}
          </div>

          <div v-if="item.tags && item.tags.length > 0" class="tags">
            <strong>Tags:</strong>
            <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <div v-if="item.moderator_notes" class="moderator-notes">
            <strong>Moderator Notes:</strong> {{ item.moderator_notes }}
          </div>
        </div>

        <div class="item-actions">
          <button
            @click="openApproveModal(item)"
            class="action-btn approve"
            :disabled="loading"
          >
            Approve
          </button>
          <button
            @click="openRejectModal(item)"
            class="action-btn reject"
            :disabled="loading"
          >
            Reject
          </button>
          <button
            @click="viewDetails(item)"
            class="action-btn secondary"
          >
            View Details
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="moderationQueue.length > 0" class="pagination">
      <button
        @click="previousPage"
        :disabled="currentPage === 1 || loading"
        class="page-btn"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages || loading"
        class="page-btn"
      >
        Next
      </button>
    </div>

    <!-- Approve Modal -->
    <div v-if="showApproveModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Approve Definition</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Word:</strong> {{ selectedItem?.word_id }}</p>
          <p><strong>Definition:</strong> {{ selectedItem?.definition }}</p>
          <div class="form-group">
            <label for="approve-notes">Moderator Notes (optional):</label>
            <textarea
              id="approve-notes"
              v-model="moderatorNotes"
              placeholder="Add any notes about this approval..."
              class="notes-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeModals" class="modal-btn secondary">Cancel</button>
          <button @click="approveItem" class="modal-btn approve" :disabled="loading">
            {{ loading ? 'Approving...' : 'Approve' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Reject Definition</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Word:</strong> {{ selectedItem?.word_id }}</p>
          <p><strong>Definition:</strong> {{ selectedItem?.definition }}</p>
          <div class="form-group">
            <label for="reject-notes">Reason for Rejection (required):</label>
            <textarea
              id="reject-notes"
              v-model="moderatorNotes"
              placeholder="Please provide a reason for rejecting this definition..."
              class="notes-textarea"
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeModals" class="modal-btn secondary">Cancel</button>
          <button
            @click="rejectItem"
            class="modal-btn reject"
            :disabled="loading || !moderatorNotes.trim()"
          >
            {{ loading ? 'Rejecting...' : 'Reject' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Approve Modal -->
    <div v-if="showBulkApproveModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Bulk Approve Definitions</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>You are about to approve <strong>{{ selectedItems.length }}</strong> definitions.</p>
          <div class="form-group">
            <label for="bulk-approve-notes">Moderator Notes (optional):</label>
            <textarea
              id="bulk-approve-notes"
              v-model="bulkModerationNotes"
              placeholder="Add notes for all approved items..."
              class="notes-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeModals" class="modal-btn secondary">Cancel</button>
          <button @click="bulkApprove" class="modal-btn approve" :disabled="loading">
            {{ loading ? 'Approving...' : `Approve ${selectedItems.length} Items` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Reject Modal -->
    <div v-if="showBulkRejectModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Bulk Reject Definitions</h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>You are about to reject <strong>{{ selectedItems.length }}</strong> definitions.</p>
          <div class="form-group">
            <label for="bulk-reject-notes">Reason for Rejection (required):</label>
            <textarea
              id="bulk-reject-notes"
              v-model="bulkModerationNotes"
              placeholder="Please provide a reason for rejecting these definitions..."
              class="notes-textarea"
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeModals" class="modal-btn secondary">Cancel</button>
          <button
            @click="bulkReject"
            class="modal-btn reject"
            :disabled="loading || !bulkModerationNotes.trim()"
          >
            {{ loading ? 'Rejecting...' : `Reject ${selectedItems.length} Items` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useCommunityStore } from '@/stores/communityStore'

export default {
  name: 'CommunityModerationPanel',
  setup() {
    const communityStore = useCommunityStore()

    // Reactive state
    const searchTerm = ref('')
    const statusFilter = ref('pending')
    const sortBy = ref('created_at')
    const sortOrder = ref('desc')
    const dateFrom = ref('')
    const dateTo = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const selectedItems = ref([])
    const searchTimeout = ref(null)

    // Modal state
    const showApproveModal = ref(false)
    const showRejectModal = ref(false)
    const showBulkApproveModal = ref(false)
    const showBulkRejectModal = ref(false)
    const selectedItem = ref(null)
    const moderatorNotes = ref('')
    const bulkModerationNotes = ref('')

    // Computed properties
    const moderationQueue = computed(() => communityStore.moderationQueue)
    const loading = computed(() => communityStore.loading)
    const error = computed(() => communityStore.error)
    const canModerate = computed(() => communityStore.canModerate)

    const totalPages = computed(() => {
      return Math.ceil(moderationQueue.value.length / itemsPerPage.value)
    })

    // Methods
    const fetchQueue = async () => {
      const filters = {
        status: statusFilter.value === 'all' ? ['pending', 'approved', 'rejected'] : [statusFilter.value],
        searchTerm: searchTerm.value.trim(),
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        dateFrom: dateFrom.value,
        dateTo: dateTo.value,
        limit: itemsPerPage.value,
        offset: (currentPage.value - 1) * itemsPerPage.value
      }

      await communityStore.fetchModerationQueue(filters)
    }

    const applyFilters = () => {
      currentPage.value = 1
      selectedItems.value = []
      fetchQueue()
    }

    const debouncedSearch = () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      searchTimeout.value = setTimeout(() => {
        applyFilters()
      }, 300)
    }

    const clearSearch = () => {
      searchTerm.value = ''
      applyFilters()
    }

    const toggleSelection = (itemId) => {
      const index = selectedItems.value.indexOf(itemId)
      if (index > -1) {
        selectedItems.value.splice(index, 1)
      } else {
        selectedItems.value.push(itemId)
      }
    }

    const selectAll = () => {
      if (selectedItems.value.length === moderationQueue.value.length) {
        selectedItems.value = []
      } else {
        selectedItems.value = moderationQueue.value.map(item => item.id)
      }
    }

    const openApproveModal = (item) => {
      selectedItem.value = item
      moderatorNotes.value = ''
      showApproveModal.value = true
    }

    const openRejectModal = (item) => {
      selectedItem.value = item
      moderatorNotes.value = ''
      showRejectModal.value = true
    }

    const closeModals = () => {
      showApproveModal.value = false
      showRejectModal.value = false
      showBulkApproveModal.value = false
      showBulkRejectModal.value = false
      selectedItem.value = null
      moderatorNotes.value = ''
      bulkModerationNotes.value = ''
    }

    const approveItem = async () => {
      if (!selectedItem.value) return

      const result = await communityStore.approveDefinition(
        selectedItem.value.id,
        moderatorNotes.value.trim()
      )

      if (result.success) {
        closeModals()
        // Remove from selected items if it was selected
        const index = selectedItems.value.indexOf(selectedItem.value.id)
        if (index > -1) {
          selectedItems.value.splice(index, 1)
        }
      }
    }

    const rejectItem = async () => {
      if (!selectedItem.value || !moderatorNotes.value.trim()) return

      const result = await communityStore.rejectDefinition(
        selectedItem.value.id,
        moderatorNotes.value.trim()
      )

      if (result.success) {
        closeModals()
        // Remove from selected items if it was selected
        const index = selectedItems.value.indexOf(selectedItem.value.id)
        if (index > -1) {
          selectedItems.value.splice(index, 1)
        }
      }
    }

    const bulkApprove = async () => {
      if (selectedItems.value.length === 0) return

      const result = await communityStore.bulkApproveDefinitions(
        selectedItems.value,
        bulkModerationNotes.value.trim()
      )

      if (result.success) {
        selectedItems.value = []
        closeModals()
      }
    }

    const bulkReject = async () => {
      if (selectedItems.value.length === 0 || !bulkModerationNotes.value.trim()) return

      const result = await communityStore.bulkRejectDefinitions(
        selectedItems.value,
        bulkModerationNotes.value.trim()
      )

      if (result.success) {
        selectedItems.value = []
        closeModals()
      }
    }

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        fetchQueue()
      }
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        fetchQueue()
      }
    }

    const viewDetails = (item) => {
      // This could open a detailed view or navigate to the definition
      console.log('View details for:', item)
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getVoteScoreClass = (score) => {
      if (score > 0) return 'positive'
      if (score < 0) return 'negative'
      return 'neutral'
    }

    // Lifecycle
    onMounted(() => {
      if (canModerate.value) {
        fetchQueue()
      }
    })

    // Watch for permission changes
    watch(canModerate, (newValue) => {
      if (newValue) {
        fetchQueue()
      }
    })

    return {
      // State
      searchTerm,
      statusFilter,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
      currentPage,
      selectedItems,
      showApproveModal,
      showRejectModal,
      showBulkApproveModal,
      showBulkRejectModal,
      selectedItem,
      moderatorNotes,
      bulkModerationNotes,

      // Computed
      moderationQueue,
      loading,
      error,
      canModerate,
      totalPages,

      // Methods
      fetchQueue,
      applyFilters,
      debouncedSearch,
      clearSearch,
      toggleSelection,
      selectAll,
      openApproveModal,
      openRejectModal,
      closeModals,
      approveItem,
      rejectItem,
      bulkApprove,
      bulkReject,
      previousPage,
      nextPage,
      viewDetails,
      formatDate,
      getVoteScoreClass
    }
  }
}
</script>

<style scoped>
.moderation-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.panel-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Filters */
.filters-section {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.search-bar {
  position: relative;
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
}

.filter-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select,
.date-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 120px;
}

.filter-select:focus,
.date-input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Bulk Actions */
.bulk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eff6ff;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #bfdbfe;
}

.bulk-actions-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bulk-actions-right {
  display: flex;
  gap: 12px;
}

.bulk-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.bulk-btn.secondary {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.bulk-btn.approve {
  background: #10b981;
  color: white;
}

.bulk-btn.reject {
  background: #ef4444;
  color: white;
}

.bulk-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bulk-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-count {
  font-size: 14px;
  color: #6b7280;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #ef4444;
  margin-bottom: 16px;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.empty-state .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 8px;
}

.empty-state p {
  color: #6b7280;
}

/* Queue List */
.queue-list {
  space-y: 16px;
}

.queue-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.queue-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.queue-item.selected {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.item-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-checkbox {
  width: 16px;
  height: 16px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.word-id {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.vote-score {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.vote-score.positive {
  background: #d1fae5;
  color: #065f46;
}

.vote-score.negative {
  background: #fee2e2;
  color: #991b1b;
}

.vote-score.neutral {
  background: #f3f4f6;
  color: #374151;
}

.item-header-right {
  text-align: right;
  font-size: 14px;
  color: #6b7280;
}

.author-info {
  display: block;
  margin-bottom: 4px;
}

.reputation {
  font-size: 12px;
  color: #9ca3af;
}

.submission-date {
  font-size: 12px;
}

/* Item Content */
.item-content {
  margin-bottom: 16px;
  line-height: 1.6;
}

.item-content > div {
  margin-bottom: 12px;
}

.item-content > div:last-child {
  margin-bottom: 0;
}

.definition-text,
.usage-example,
.context,
.moderator-notes {
  font-size: 14px;
  color: #374151;
}

.definition-text strong,
.usage-example strong,
.context strong,
.moderator-notes strong {
  color: #1f2937;
  font-weight: 600;
}

.tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: #e5e7eb;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.moderator-notes {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

/* Item Actions */
.item-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.action-btn.approve {
  background: #10b981;
  color: white;
}

.action-btn.reject {
  background: #ef4444;
  color: white;
}

.action-btn.secondary {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding: 20px;
}

.page-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #2563eb;
}

.page-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6b7280;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin-bottom: 16px;
  color: #374151;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.notes-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.notes-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.modal-btn.secondary {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.modal-btn.approve {
  background: #10b981;
  color: white;
}

.modal-btn.reject {
  background: #ef4444;
  color: white;
}

.modal-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .moderation-panel {
    padding: 16px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-stats {
    align-self: stretch;
    justify-content: space-around;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-select,
  .date-input {
    width: 100%;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 16px;
  }

  .bulk-actions-left,
  .bulk-actions-right {
    width: 100%;
    justify-content: center;
  }

  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .item-header-right {
    text-align: left;
  }

  .item-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .modal {
    margin: 20px;
    max-width: none;
  }

  .pagination {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .item-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-btn,
  .bulk-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>