<template>
  <nav class="mobile-nav" role="navigation" aria-label="Mobile navigation">
    <div class="mobile-nav-items">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="mobile-nav-item"
        :class="{ 'active': isActive(item.to) }"
        :aria-label="item.label"
      >
        <div class="mobile-nav-icon">
          <component :is="item.icon" />
        </div>
        <span class="mobile-nav-label">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  items: {
    type: Array,
    default: () => [
      {
        name: 'search',
        to: { name: 'dictionary' },
        label: 'Search',
        icon: 'IconSearch'
      },
      {
        name: 'random',
        to: { name: 'random' },
        label: 'Random',
        icon: 'IconRefresh'
      },
      {
        name: 'favorites',
        to: { name: 'favorites' },
        label: 'Favorites',
        icon: 'IconHeart'
      },
      {
        name: 'history',
        to: { name: 'history' },
        label: 'History',
        icon: 'IconHistory'
      }
    ]
  }
});

const navItems = computed(() => props.items);

const isActive = (to) => {
  if (typeof to === 'string') {
    return route.path === to;
  }
  if (to.name) {
    return route.name === to.name;
  }
  return false;
};
</script>

<style scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface-background);
  border-top: 1px solid var(--surface-border);
  padding: var(--space-2) var(--space-4);
  z-index: var(--z-fixed);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-lg);
}

.mobile-nav-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  gap: var(--space-2);
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: var(--transition-colors);
  min-height: var(--touch-target-comfortable);
  min-width: var(--touch-target-comfortable);
  text-decoration: none;
  color: var(--color-secondary);
  flex: 1;
  max-width: 80px;
}

.mobile-nav-item:hover {
  background: var(--surface-background-hover);
  color: var(--color-primary);
}

.mobile-nav-item:active {
  transform: scale(0.95);
  transition: transform 100ms ease;
}

.mobile-nav-item.active {
  background: var(--surface-background-hover);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.mobile-nav-item.active .mobile-nav-icon {
  transform: scale(1.1);
}

.mobile-nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: var(--transition-normal);
}

.mobile-nav-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-align: center;
  line-height: var(--line-height-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Hide on larger screens */
@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
}

/* Adjust for safe area on mobile devices */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .mobile-nav {
    padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .mobile-nav {
    border-top-width: 2px;
  }
  
  .mobile-nav-item.active {
    font-weight: var(--font-weight-bold);
    border: 2px solid var(--color-primary);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .mobile-nav-item,
  .mobile-nav-icon {
    transition: none;
  }
  
  .mobile-nav-item:active {
    transform: none;
  }
  
  .mobile-nav-item.active .mobile-nav-icon {
    transform: none;
  }
}

/* Focus management */
.mobile-nav-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Ensure proper spacing on very small screens */
@media (max-width: 320px) {
  .mobile-nav-items {
    gap: var(--space-1);
  }
  
  .mobile-nav-item {
    min-width: var(--touch-target-min);
    padding: var(--space-1);
  }
  
  .mobile-nav-label {
    font-size: 10px;
  }
}
</style>