import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const authStore = useAuthStore();

  // Reactive computed properties
  const user = computed(() => authStore.user);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isAdmin = computed(() => authStore.isAdmin);
  const loading = computed(() => authStore.loading);
  const error = computed(() => authStore.error);

  // User metadata helpers
  const displayName = computed(() => {
    return user.value?.user_metadata?.display_name || 
           user.value?.user_metadata?.full_name || 
           user.value?.email?.split('@')[0] || 
           'User';
  });

  const userAvatar = computed(() => {
    return user.value?.user_metadata?.avatar_url || null;
  });

  const userRole = computed(() => {
    return user.value?.user_metadata?.role || 'user';
  });

  // Authentication methods
  const signIn = async (email, password) => {
    return await authStore.signIn(email, password);
  };

  const signUp = async (email, password, metadata = {}) => {
    return await authStore.signUp(email, password, metadata);
  };

  const signOut = async () => {
    return await authStore.signOut();
  };

  const signInWithGoogle = async () => {
    return await authStore.signInWithGoogle();
  };

  const resetPassword = async (email) => {
    return await authStore.resetPassword(email);
  };

  const updatePassword = async (newPassword) => {
    return await authStore.updatePassword(newPassword);
  };

  const updateProfile = async (updates) => {
    return await authStore.updateProfile(updates);
  };

  const clearError = () => {
    authStore.clearError();
  };

  // Permission helpers
  const hasPermission = (permission) => {
    if (!isAuthenticated.value) return false;
    
    const userPermissions = user.value?.user_metadata?.permissions || [];
    return userPermissions.includes(permission);
  };

  const hasRole = (role) => {
    if (!isAuthenticated.value) return false;
    
    const userRoles = user.value?.user_metadata?.roles || [userRole.value];
    return userRoles.includes(role);
  };

  // Session helpers
  const getSession = () => {
    return authStore.session;
  };

  const getAccessToken = () => {
    return authStore.session?.access_token;
  };

  const isSessionValid = computed(() => {
    if (!authStore.session) return false;
    
    const expiresAt = authStore.session.expires_at;
    if (!expiresAt) return true; // No expiration set
    
    const now = Math.floor(Date.now() / 1000);
    return expiresAt > now;
  });

  return {
    // State
    user,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    
    // User metadata
    displayName,
    userAvatar,
    userRole,
    
    // Methods
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
    
    // Permission helpers
    hasPermission,
    hasRole,
    
    // Session helpers
    getSession,
    getAccessToken,
    isSessionValid
  };
} 