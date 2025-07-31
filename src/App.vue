<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useCommunityStore } from "@/stores/communityStore";
import AuthHeader from "@/components/auth/AuthHeader.vue";

const authStore = useAuthStore();
const communityStore = useCommunityStore();

onMounted(async () => {
  // Initialize authentication
  await authStore.initializeAuth();
  
  // Initialize community store if user is authenticated
  if (authStore.isAuthenticated) {
    await communityStore.initialize();
  }
});
</script>

<template>
  <div id="app" class="app-container">
    <header class="app-header">
      <AuthHeader />
    </header>

    <main class="app-main" role="main">
      <div class="main-content">
        <router-view />
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="footer-content">
        <p class="footer-text">Data provided by 2024 Ministry of Education, R.O.C.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-background);
  color: var(--color-text);
}

.app-header {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--app-background);
  border-bottom: 1px solid var(--surface-border);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Allow flex child to shrink */
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

.app-footer {
  flex-shrink: 0;
  background: var(--surface-background);
  border-top: 1px solid var(--surface-border);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  text-align: center;
}

.footer-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
  line-height: var(--line-height-normal);
}

/* Mobile-first responsive design */
@media (max-width: 767px) {
  .app-container {
    /* Account for mobile navigation if present */
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  
  .footer-content {
    padding: var(--space-3) var(--space-4);
  }
  
  .footer-text {
    font-size: 10px;
  }
  
  /* Optimize for mobile viewport */
  .main-content {
    padding-bottom: var(--space-20); /* Space for mobile nav if added */
  }
}

@media (min-width: 768px) {
  .footer-content {
    padding: var(--space-6) var(--space-8);
  }
  
  .footer-text {
    font-size: var(--font-size-sm);
  }
}

@media (min-width: 1024px) {
  .footer-content {
    padding: var(--space-8) var(--space-10);
  }
}

/* Ensure proper layout on very small screens */
@media (max-width: 320px) {
  .footer-content {
    padding: var(--space-2) var(--space-3);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .app-header {
    border-bottom-width: 2px;
  }
  
  .app-footer {
    border-top-width: 2px;
  }
}

/* Support for devices with notches */
@supports (padding-top: env(safe-area-inset-top)) {
  .app-header {
    padding-top: env(safe-area-inset-top);
  }
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .app-footer {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* Landscape mobile optimizations */
@media (max-width: 767px) and (orientation: landscape) {
  .main-content {
    padding-bottom: var(--space-16); /* Reduced space for landscape */
  }
}
</style>
