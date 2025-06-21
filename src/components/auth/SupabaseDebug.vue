<template>
  <div class="supabase-debug">
    <h3>Supabase Debug</h3>
    
    <div class="debug-section">
      <h4>Connection Test:</h4>
      <button @click="testConnection" class="btn-primary">Test Supabase Connection</button>
      <p v-if="connectionStatus">{{ connectionStatus }}</p>
    </div>

    <div class="debug-section">
      <h4>Auth Store State:</h4>
      <pre>{{ authStoreState }}</pre>
    </div>

    <div class="debug-section">
      <h4>Supabase Client:</h4>
      <p><strong>URL:</strong> {{ supabaseUrl }}</p>
      <p><strong>Key:</strong> {{ supabaseKey.substring(0, 20) }}...</p>
    </div>

    <div class="debug-section">
      <h4>Console Logs:</h4>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level" :class="log.level">{{ log.level }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/supabase';

const authStore = useAuthStore();
const connectionStatus = ref('');
const logs = ref([]);

const supabaseUrl = 'https://oqwvljqwtearyepyaslo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xd3ZsanF3dGVhcnllcHlhc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwODA1NjIsImV4cCI6MjA0NjY1NjU2Mn0.31HmSCfXawvkzhevPCaKWoVCZyD_elcQOCtgFWJMRKI';

const authStoreState = computed(() => ({
  isAuthenticated: authStore.isAuthenticated,
  loading: authStore.loading,
  user: authStore.user,
  error: authStore.error,
  session: authStore.session
}));

const addLog = (level, message) => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    level,
    message
  });
};

const testConnection = async () => {
  try {
    addLog('info', 'Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('search_history').select('count').limit(1);
    
    if (error) {
      addLog('error', `Connection failed: ${error.message}`);
      connectionStatus.value = `Error: ${error.message}`;
    } else {
      addLog('success', 'Connection successful!');
      connectionStatus.value = 'Connection successful!';
    }
  } catch (err) {
    addLog('error', `Exception: ${err.message}`);
    connectionStatus.value = `Exception: ${err.message}`;
  }
};

onMounted(() => {
  addLog('info', 'SupabaseDebug component mounted');
  addLog('info', `Auth store initialized: ${authStore.isAuthenticated}`);
});
</script>

<style scoped>
.supabase-debug {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  max-width: 800px;
}

.debug-section {
  margin-bottom: 1.5rem;
}

.debug-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary:hover {
  background-color: #2563eb;
}

pre {
  background: #f1f3f4;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
}

.log-container {
  background: #1f2937;
  color: #f9fafb;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.log-time {
  color: #9ca3af;
  min-width: 80px;
}

.log-level {
  min-width: 60px;
  font-weight: bold;
}

.log-level.info {
  color: #3b82f6;
}

.log-level.success {
  color: #10b981;
}

.log-level.error {
  color: #ef4444;
}

.log-message {
  flex: 1;
}
</style> 