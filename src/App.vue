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
  <header>
    <AuthHeader />
  </header>

  <main>
    <router-view />
  </main>
  <footer>
    <!-- Data provided by 2024 Ministry of Education, R.O.C.  -->
  </footer>
</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }
}
</style>
