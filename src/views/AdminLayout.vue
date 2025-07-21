<template>
  <div class="admin-layout">
    <!-- Admin Navigation Header -->
    <div class="admin-nav-header">
      <button @click="goToDictionary" class="back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Dictionary
      </button>
      <div class="nav-title">Admin Area</div>
      <div class="admin-nav-tabs">
        <router-link :to="{ name: 'admin-dashboard' }" class="nav-tab">Dashboard</router-link>
        <router-link :to="{ name: 'admin-users' }" class="nav-tab">Users</router-link>
        <router-link :to="{ name: 'admin-moderation' }" class="nav-tab">Moderation</router-link>
        <router-link :to="{ name: 'admin-community' }" class="nav-tab">Community</router-link>
      </div>
    </div>

    <!-- Router View for Admin Child Routes -->
    <router-view />
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'AdminLayout',
  setup() {
    const router = useRouter()

    const goToDictionary = () => {
      router.push({ name: 'dictionary' })
    }

    return {
      goToDictionary
    }
  }
}
</script>

<style scoped>
.admin-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-nav-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  padding-bottom: 16px;
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
  align-self: flex-start;
  margin-bottom: 16px;
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
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.admin-nav-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1px;
}

.nav-tab {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-tab:hover {
  color: #3b82f6;
}

.nav-tab.router-link-active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

@media (max-width: 768px) {
  .admin-layout {
    padding: 16px;
  }

  .admin-nav-tabs {
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 4px;
    margin-bottom: -1px;
  }

  .nav-tab {
    padding: 12px 12px;
  }
}
</style>