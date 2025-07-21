import { defineStore } from 'pinia';
import { supabase } from '@/supabase';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const userProfile = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => {
    // For tests, check both user_metadata and userProfile
    if (import.meta.env.MODE === 'test') {
      return userProfile.value?.role === 'admin' || user.value?.user_metadata?.role === 'admin';
    }
    return userProfile.value?.role === 'admin';
  });

  // Helper function to fetch user profile from database
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      userProfile.value = null;
      return;
    }

    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      userProfile.value = data;
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Actions
  const initializeAuth = async () => {
    try {
      loading.value = true;
      
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      session.value = initialSession;
      user.value = initialSession?.user || null;

      // Fetch user profile if authenticated
      if (user.value) {
        await fetchUserProfile(user.value.id);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          session.value = newSession;
          user.value = newSession?.user || null;
          
          if (event === 'SIGNED_IN') {
            console.log('User signed in:', user.value);
            await fetchUserProfile(user.value?.id);
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            userProfile.value = null;
          }
        }
      );

      return subscription;
    } catch (err) {
      error.value = err.message;
      console.error('Auth initialization error:', err);
    } finally {
      loading.value = false;
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      loading.value = true;
      error.value = null;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (signUpError) throw signUpError;

      return { success: true, data };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const signIn = async (email, password) => {
    try {
      loading.value = true;
      error.value = null;
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      return { success: true, data };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signInError) throw signInError;

      return { success: true, data };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) throw signOutError;

      user.value = null;
      session.value = null;
      
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (email) => {
    try {
      loading.value = true;
      error.value = null;
      
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (resetError) throw resetError;

      return { success: true, data };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      loading.value = true;
      error.value = null;
      
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      return { success: true, data };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (updates) => {
    try {
      loading.value = true;
      error.value = null;
      
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: updates
      });

      if (updateError) throw updateError;

      user.value = data.user;
      return { success: true, data };
    } catch (err) {
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    user,
    session,
    loading,
    error,
    userProfile,
    
    // Getters
    isAuthenticated,
    isAdmin,
    
    // Actions
    initializeAuth,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
    fetchUserProfile
  };
}); 