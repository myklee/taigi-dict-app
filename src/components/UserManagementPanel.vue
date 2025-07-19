<template>
  <div class="user-management-panel">
    <div class="panel-header">
      <h3>User Management</h3>
      <div class="search-bar">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search users..."
          class="search-input"
          @input="debouncedSearch"
        />
      </div>
    </div>

    <div class="filters">
      <select v-model="roleFilter" @change="applyFilters" class="filter-select">
        <option value="">All Roles</option>
        <option value="user">Users</option>
        <option value="moderator">Moderators</option>
        <option value="admin">Admins</option>
      </select>

      <select v-model="statusFilter" @change="applyFilters" class="filter-select">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="banned">Banned</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>

    <div v-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadUsers" class="retry-btn">Retry</button>
    </div>

    <div v-if="!loading && !error && users.length === 0" class="empty-state">
      <p>No users found matching your criteria.</p>
    </div>

    <div v-if="!loading && !error && users.length > 0" class="users-list">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-item"
      >
        <div class="user-info">
          <div class="user-details">
            <span class="username">{{ user.username || 'No username' }}</span>
            <span class="email">{{ user.email }}</span>
          </div>
          <div class="user-meta">
            <span class="role-badge" :class="user.role">{{ user.role }}</span>
            <span class="status-badge" :class="user.account_status">{{ user.account_status }}</span>
            <span class="reputation">{{ user.reputation_score }} rep</span>
          </div>
        </div>

        <div class="user-actions">
          <button
            v-if="user.role === 'user'"
            @click="promoteUser(user, 'moderator')"
            class="action-btn promote"
            :disabled="loading"
          >
            Make Moderator
          </button>
          <button
            v-if="user.role === 'moderator'"
            @click="promoteUser(user, 'admin')"
            class="action-btn promote"
            :disabled="loading"
          >
            Make Admin
          </button>
          <button
            v-if="user.role !== 'user'"
            @click="demoteUser(user)"
            class="action-btn demote"
            :disabled="loading"
          >
            Demote
          </button>
          <button
            v-if="user.account_status === 'active'"
            @click="suspendUser(user)"
            class="action-btn suspend"
            :disabled="loading"
          >
            Suspend
          </button>
          <button
            v-if="user.account_status === 'suspended'"
            @click="reactivateUser(user)"
            class="action-btn reactivate"
            :disabled="loading"
          >
            Reactivate
          </button>
        </div>
      </div>
    </div>

    <div v-if="users.length > 0" class="pagination">
      <button
        @click="previousPage"
        :disabled="currentPage === 1 || loading"
        class="page-btn"
      >
        Previous
      </button>
      <span class="page-info">Page {{ currentPage }}</span>
      <button
        @click="nextPage"
        :disabled="!hasMore || loading"
        class="page-btn"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useCommunityStore } from '@/stores/communityStore'

export default {
  name: 'UserManagementPanel',
  emits: ['close'],
  setup(props, { emit }) {
    const communityStore = useCommunityStore()

    // State
    const users = ref([])
    const searchTerm = ref('')
    const roleFilter = ref('')
    const statusFilter = ref('')
    const currentPage = ref(1)
    const hasMore = ref(false)
    const searchTimeout = ref(null)

    // Computed
    const loading = computed(() => communityStore.loading)
    const error = computed(() => communityStore.error)

    // Methods
    const loadUsers = async () => {
      const result = await communityStore.getUserManagementList({
        searchTerm: searchTerm.value.trim(),
        roleFilter: roleFilter.value || null,
        statusFilter: statusFilter.value || null,
        limit: 20,
        offset: (currentPage.value - 1) * 20
      })

      if (result.success) {
        users.value = result.data.users || []
        hasMore.value = result.data.has_more || false
      }
    }

    const applyFilters = () => {
      currentPage.value = 1
      loadUsers()
    }

    const debouncedSearch = () => {
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      searchTimeout.value = setTimeout(() => {
        applyFilters()
      }, 300)
    }

    const promoteUser = async (user, newRole) => {
      const confirmMessage = `Are you sure you want to promote ${user.username || user.email} to ${newRole}?`
      if (!confirm(confirmMessage)) return

      let result
      if (newRole === 'moderator') {
        result = await communityStore.promoteToModerator(user.id, `Promoted to ${newRole}`)
      } else if (newRole === 'admin') {
        result = await communityStore.promoteToAdmin(user.id, {}, `Promoted to ${newRole}`)
      }

      if (result.success) {
        await loadUsers()
      } else {
        alert(result.error || 'Failed to promote user')
      }
    }

    const demoteUser = async (user) => {
      const confirmMessage = `Are you sure you want to demote ${user.username || user.email} to regular user?`
      if (!confirm(confirmMessage)) return

      const reason = prompt('Please provide a reason for demotion:')
      if (!reason) return

      const result = await communityStore.demoteToUser(user.id, reason)

      if (result.success) {
        await loadUsers()
      } else {
        alert(result.error || 'Failed to demote user')
      }
    }

    const suspendUser = async (user) => {
      const reason = prompt('Please provide a reason for suspension:')
      if (!reason) return

      const durationStr = prompt('Duration in days (leave empty for indefinite):')
      const duration = durationStr ? parseInt(durationStr) : null

      const result = await communityStore.suspendUser(user.id, reason, duration)

      if (result.success) {
        await loadUsers()
      } else {
        alert(result.error || 'Failed to suspend user')
      }
    }

    const reactivateUser = async (user) => {
      const confirmMessage = `Are you sure you want to reactivate ${user.username || user.email}?`
      if (!confirm(confirmMessage)) return

      const notes = prompt('Optional notes for reactivation:') || ''

      const result = await communityStore.reactivateUser(user.id, notes)

      if (result.success) {
        await loadUsers()
      } else {
        alert(result.error || 'Failed to reactivate user')
      }
    }

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        loadUsers()
      }
    }

    const nextPage = () => {
      if (hasMore.value) {
        currentPage.value++
        loadUsers()
      }
    }

    // Lifecycle
    onMounted(() => {
      loadUsers()
    })

    return {
      // State
      users,
      searchTerm,
      roleFilter,
      statusFilter,
      currentPage,
      hasMore,

      // Computed
      loading,
      error,

      // Methods
      loadUsers,
      applyFilters,
      debouncedSearch,
      promoteUser,
      demoteUser,
      suspendUser,
      reactivateUser,
      previousPage,
      nextPage
    }
  }
}
</script>

<style scoped>
.user-management-panel {
  max-width: 800px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 250px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
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

.users-list {
  space-y: 16px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.user-info {
  flex: 1;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.username {
  font-weight: 600;
  color: #1f2937;
}

.email {
  font-size: 14px;
  color: #6b7280;
}

.user-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.role-badge,
.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge.user {
  background: #f3f4f6;
  color: #374151;
}

.role-badge.moderator {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.suspended {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.banned {
  background: #1f2937;
  color: white;
}

.reputation {
  font-size: 12px;
  color: #6b7280;
}

.user-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.action-btn.promote {
  background: #10b981;
  color: white;
}

.action-btn.demote {
  background: #f59e0b;
  color: white;
}

.action-btn.suspend {
  background: #ef4444;
  color: white;
}

.action-btn.reactivate {
  background: #3b82f6;
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
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

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .filters {
    flex-direction: column;
  }

  .user-item {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .user-actions {
    justify-content: center;
  }
}
</style>