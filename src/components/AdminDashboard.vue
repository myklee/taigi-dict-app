<template>
  <div class="admin-dashboard">

    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div class="user-info">
        <span>Welcome, {{ userProfile?.username || 'Admin' }}</span>
        <span class="role-badge" :class="userProfile?.role">{{ userProfile?.role }}</span>
      </div>
    </div>

    <!-- Dashboard Stats -->
    <div class="stats-grid" v-if="dashboardStats">
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.total_users }}</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.active_users }}</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.pending_definitions }}</div>
        <div class="stat-label">Pending Definitions</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.pending_reports }}</div>
        <div class="stat-label">Pending Reports</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.moderators }}</div>
        <div class="stat-label">Moderators</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.admins }}</div>
        <div class="stat-label">Admins</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="action-buttons">
        <button @click="showUserManagement = true" class="action-btn primary">
          Manage Users
        </button>
        <button @click="showModerationPanel = true" class="action-btn secondary">
          Moderation Queue
        </button>
        <button @click="refreshStats" class="action-btn secondary" :disabled="loading">
          Refresh Stats
        </button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity" v-if="dashboardStats?.recent_activity">
      <h2>Recent Admin Activity</h2>
      <div class="activity-list">
        <div 
          v-for="activity in dashboardStats.recent_activity" 
          :key="activity.created_at"
          class="activity-item"
        >
          <div class="activity-info">
            <span class="activity-action">{{ formatAction(activity.action) }}</span>
            <span class="activity-admin">by {{ activity.admin_username }}</span>
          </div>
          <div class="activity-time">{{ formatDate(activity.created_at) }}</div>
        </div>
      </div>
    </div>

    <!-- User Management Modal -->
    <div v-if="showUserManagement" class="modal-overlay" @click="showUserManagement = false">
      <div class="modal large" @click.stop>
        <div class="modal-header">
          <h3>User Management</h3>
          <button @click="showUserManagement = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <UserManagementPanel @close="showUserManagement = false" />
        </div>
      </div>
    </div>

    <!-- Moderation Panel Modal -->
    <div v-if="showModerationPanel" class="modal-overlay" @click="showModerationPanel = false">
      <div class="modal large" @click.stop>
        <div class="modal-header">
          <h3>Moderation Panel</h3>
          <button @click="showModerationPanel = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <CommunityModerationPanel />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useCommunityStore } from '@/stores/communityStore'
import CommunityModerationPanel from './CommunityModerationPanel.vue'
import UserManagementPanel from './UserManagementPanel.vue'

export default {
  name: 'AdminDashboard',
  components: {
    CommunityModerationPanel,
    UserManagementPanel
  },
  setup() {
    const communityStore = useCommunityStore()
    
    // State
    const dashboardStats = ref(null)
    const showUserManagement = ref(false)
    const showModerationPanel = ref(false)

    // Computed
    const userProfile = computed(() => communityStore.userProfile)
    const loading = computed(() => communityStore.loading)
    const error = computed(() => communityStore.error)
    const canModerate = computed(() => communityStore.canModerate)

    // Methods
    const loadDashboardStats = async () => {
      const result = await communityStore.getAdminDashboardStats()
      if (result.success) {
        dashboardStats.value = result.data
      }
    }

    const refreshStats = async () => {
      await loadDashboardStats()
    }

    const formatAction = (action) => {
      return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(async () => {
      if (canModerate.value) {
        await loadDashboardStats()
      }
    })

    return {
      // State
      dashboardStats,
      showUserManagement,
      showModerationPanel,

      // Computed
      userProfile,
      loading,
      error,
      canModerate,

      // Methods
      loadDashboardStats,
      refreshStats,
      formatAction,
      formatDate
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Navigation Header */
.navigation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.back-btn svg {
  flex-shrink: 0;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.dashboard-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.moderator {
  background: #dbeafe;
  color: #1e40af;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-actions {
  margin-bottom: 32px;
}

.quick-actions h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recent-activity {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 24px;
}

.recent-activity h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.activity-list {
  space-y: 12px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-action {
  font-weight: 500;
  color: #1f2937;
}

.activity-admin {
  font-size: 12px;
  color: #6b7280;
}

.activity-time {
  font-size: 12px;
  color: #9ca3af;
}

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

.modal.large {
  max-width: 1000px;
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 16px;
  border-radius: 6px;
  margin-top: 16px;
  border: 1px solid #fecaca;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 16px;
  }

  .navigation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .nav-title {
    align-self: center;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .modal.large {
    max-width: 95vw;
    margin: 10px;
  }
}
</style>