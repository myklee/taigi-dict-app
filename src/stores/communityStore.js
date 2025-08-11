// Community Content Pinia Store
// Manages state for community-driven content system

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase';
import { VoteModel } from '@/models/VoteModel';
import {
  validateCreateDefinition,
  validateUpdateDefinition,
  validateCreateVote,
  validateCreateReport,
  validateSearchFilters,
  CommunityValidationError
} from '@/utils/communityValidation';
import { COMMUNITY_ERROR_CODES } from '@/types/community';

export const useCommunityStore = defineStore('community', () => {
  // State
  const communityDefinitions = ref([]);
  const userVotes = ref(new Map());
  const userProfile = ref(null);
  const pendingSubmissions = ref([]);
  const moderationQueue = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const lastFetch = ref(null);

  // Vote model instance for client-side vote management
  const voteModel = ref(new VoteModel());

  // Cache for search results
  const searchCache = ref(new Map());
  const cacheExpiry = 5 * 60 * 1000; // 5 minutes

  // Real-time subscriptions
  const realtimeSubscriptions = ref([]);
  const voteUpdateCallbacks = ref(new Set());

  // Computed properties
  const approvedDefinitions = computed(() =>
    communityDefinitions.value.filter(def => def.status === 'approved')
  );

  const pendingDefinitions = computed(() =>
    communityDefinitions.value.filter(def => def.status === 'pending')
  );

  const userDefinitions = computed(() => {
    if (!userProfile.value) return [];
    return communityDefinitions.value.filter(def => def.userId === userProfile.value.id);
  });

  const userReputation = computed(() => userProfile.value?.reputationScore || 0);

  const canModerate = computed(() => {
    const role = userProfile.value?.role;
    return role === 'moderator' || role === 'admin';
  });

  // Actions

  /**
   * Initialize the store and load user profile
   */
  async function initialize() {
    try {
      loading.value = true;
      error.value = null;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchUserProfile(user.id);
      }
    } catch (err) {
      console.error('Failed to initialize community store:', err);
      error.value = 'Failed to initialize community features';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch user profile with community data
   */
  async function fetchUserProfile(userId) {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createUserProfile(userId);
          return;
        }
        throw fetchError;
      }

      userProfile.value = data;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Create user profile for new users
   */
  async function createUserProfile(userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const username = user?.email?.split('@')[0] || `user_${Date.now()}`;

      const { data, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username: username,
          reputation_score: 0,
          role: 'user',
          contribution_count: 0
        })
        .select()
        .single();

      if (createError) throw createError;

      userProfile.value = data;
    } catch (err) {
      console.error('Failed to create user profile:', err);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Submit a new community definition
   */
  async function submitDefinition(definitionData) {
    try {
      loading.value = true;
      error.value = null;

      // Validate input
      const validatedData = validateCreateDefinition(definitionData);

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to submit definitions');
      }

      // Insert definition
      const insertPayload = {
        word_id: validatedData.wordId,
        user_id: user.id,
        definition: validatedData.definition,
        usage_example: validatedData.usageExample,
        tags: validatedData.tags,
        context: validatedData.context,
        status: 'pending'
      };
      
      console.log('Submitting definition with payload:', insertPayload);
      
      const { data, error: insertError } = await supabase
        .from('community_definitions')
        .insert(insertPayload)
        .select('*')
        .single();

      console.log('Insert result:', { data, error: insertError });

      if (insertError) throw insertError;

      // Fetch user profile data separately
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('username, reputation_score')
        .eq('id', user.id)
        .single();

      // Transform data to match our interface
      const newDefinition = {
        ...data,
        username: userProfile?.username || user.email?.split('@')[0] || 'Anonymous',
        authorReputation: userProfile?.reputation_score || 0,
        voteScore: 0,
        upvotes: 0,
        downvotes: 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Add to local state
      communityDefinitions.value.unshift(newDefinition);
      pendingSubmissions.value.unshift(newDefinition);

      return { success: true, data: newDefinition };
    } catch (err) {
      console.error('Failed to submit definition:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing definition
   */
  async function updateDefinition(definitionId, updateData) {
    try {
      loading.value = true;
      error.value = null;

      // Validate input
      const validatedData = validateUpdateDefinition(updateData);

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to update definitions');
      }

      // Update definition
      const { data, error: updateError } = await supabase
        .from('community_definitions')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', definitionId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Fetch user profile data separately
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('username, reputation_score')
        .eq('id', data.user_id)
        .single();

      // Update local state
      const index = communityDefinitions.value.findIndex(def => def.id === definitionId);
      if (index !== -1) {
        const updatedDefinition = {
          ...data,
          username: userProfile?.username || 'Anonymous',
          authorReputation: userProfile?.reputation_score || 0,
          voteScore: communityDefinitions.value[index].voteScore || 0,
          upvotes: communityDefinitions.value[index].upvotes || 0,
          downvotes: communityDefinitions.value[index].downvotes || 0,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        communityDefinitions.value[index] = updatedDefinition;
      }

      return { success: true, data };
    } catch (err) {
      console.error('Failed to update definition:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch community definitions for a word
   */
  async function fetchDefinitionsForWord(wordId, options = {}) {
    try {
      loading.value = true;
      error.value = null;

      // Check cache first
      const cacheKey = `word_${wordId}_${JSON.stringify(options)}`;
      const cached = searchCache.value.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheExpiry) {
        communityDefinitions.value = cached.data;
        return { success: true, data: cached.data };
      }

      let query = supabase
        .from('community_definitions_with_scores')
        .select('*')
        .eq('word_id', wordId);

      // Apply filters
      if (options.status) {
        query = query.in('status', Array.isArray(options.status) ? options.status : [options.status]);
      } else {
        // Default to approved definitions for non-authenticated users
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          query = query.eq('status', 'approved');
        }
      }

      // Apply sorting
      const sortBy = options.sortBy || 'vote_score';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data
      const transformedData = data.map(item => ({
        ...item,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        voteScore: item.vote_score,
        authorReputation: item.author_reputation
      }));

      // Cache results
      searchCache.value.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      communityDefinitions.value = transformedData;
      lastFetch.value = new Date();

      return { success: true, data: transformedData };
    } catch (err) {
      console.error('Failed to fetch definitions:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.NOT_FOUND,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Search community definitions
   */
  async function searchDefinitions(filters = {}) {
    try {
      loading.value = true;
      error.value = null;

      // Validate filters
      const validatedFilters = validateSearchFilters(filters);

      // Check cache
      const cacheKey = `search_${JSON.stringify(validatedFilters)}`;
      const cached = searchCache.value.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheExpiry) {
        return { success: true, data: cached.data };
      }

      let query = supabase
        .from('community_definitions_with_scores')
        .select('*');

      // Apply filters
      if (validatedFilters.status) {
        query = query.in('status', validatedFilters.status);
      }

      if (validatedFilters.tags && validatedFilters.tags.length > 0) {
        query = query.overlaps('tags', validatedFilters.tags);
      }

      if (validatedFilters.minScore !== undefined) {
        query = query.gte('vote_score', validatedFilters.minScore);
      }

      if (validatedFilters.maxScore !== undefined) {
        query = query.lte('vote_score', validatedFilters.maxScore);
      }

      if (validatedFilters.userId) {
        query = query.eq('user_id', validatedFilters.userId);
      }

      if (validatedFilters.wordId) {
        query = query.eq('word_id', validatedFilters.wordId);
      }

      // Apply text search if searchTerm is provided
      if (validatedFilters.searchTerm) {
        const searchPattern = `%${validatedFilters.searchTerm}%`;
        query = query.or(`definition.ilike.${searchPattern},usage_example.ilike.${searchPattern},context.ilike.${searchPattern},word_id.ilike.${searchPattern}`);
      }

      // Apply sorting
      const sortColumn = validatedFilters.sortBy === 'date' ? 'created_at' : 'vote_score';
      query = query.order(sortColumn, { ascending: validatedFilters.sortOrder === 'asc' });

      // Apply pagination
      query = query.range(
        validatedFilters.offset,
        validatedFilters.offset + validatedFilters.limit - 1
      );

      const { data, error: searchError } = await query;

      if (searchError) throw searchError;

      // Transform data
      const transformedData = data.map(item => ({
        ...item,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        voteScore: item.vote_score,
        authorReputation: item.author_reputation
      }));

      // Cache results
      searchCache.value.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      return { success: true, data: transformedData };
    } catch (err) {
      console.error('Failed to search definitions:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a definition
   */
  async function deleteDefinition(definitionId) {
    try {
      loading.value = true;
      error.value = null;

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to delete definitions');
      }

      const { error: deleteError } = await supabase
        .from('community_definitions')
        .delete()
        .eq('id', definitionId);

      if (deleteError) throw deleteError;

      // Remove from local state
      const index = communityDefinitions.value.findIndex(def => def.id === definitionId);
      if (index !== -1) {
        communityDefinitions.value.splice(index, 1);
      }

      // Clear cache
      searchCache.value.clear();

      return { success: true };
    } catch (err) {
      console.error('Failed to delete definition:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update user profile
   */
  async function updateUserProfile(profileData) {
    try {
      loading.value = true;
      error.value = null;

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to update your profile');
      }

      // Validate profile data
      const validatedData = validateUpdateProfile(profileData);

      // Update profile in database
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: validatedData.displayName,
          username: validatedData.username,
          bio: validatedData.bio,
          avatar_url: validatedData.avatarUrl,
          preferences: validatedData.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      userProfile.value = {
        ...userProfile.value,
        ...data
      };

      return { success: true, data };
    } catch (err) {
      console.error('Failed to update user profile:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get user's contribution statistics
   */
  async function getUserContributionStats(userId) {
    try {
      const { data, error: statsError } = await supabase
        .from('community_definitions')
        .select('status')
        .eq('user_id', userId);

      if (statsError) throw statsError;

      // Get vote statistics
      const { data: voteData, error: voteError } = await supabase
        .from('community_votes')
        .select('vote_type, community_definitions!inner(user_id)')
        .eq('community_definitions.user_id', userId);

      if (voteError) throw voteError;

      const totalVotesReceived = voteData.length;
      const upvotesReceived = voteData.filter(v => v.vote_type === 'upvote').length;
      const downvotesReceived = voteData.filter(v => v.vote_type === 'downvote').length;

      const stats = {
        totalDefinitions: data.length,
        approvedDefinitions: data.filter(d => d.status === 'approved').length,
        pendingDefinitions: data.filter(d => d.status === 'pending').length,
        rejectedDefinitions: data.filter(d => d.status === 'rejected').length,
        totalVotesReceived,
        upvotesReceived,
        downvotesReceived,
        reputationScore: userProfile.value?.reputationScore || 0,
        contributionCount: userProfile.value?.contributionCount || 0
      };

      return { success: true, data: stats };
    } catch (err) {
      console.error('Failed to get contribution stats:', err);
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.NOT_FOUND,
          message: err.message
        }
      };
    }
  }

  /**
   * Get reputation milestones and achievements
   */
  function getReputationMilestones(reputationScore) {
    const milestones = [
      { threshold: 0, title: 'New Contributor', description: 'Welcome to the community!' },
      { threshold: 10, title: 'Active Member', description: 'You\'re making valuable contributions' },
      { threshold: 50, title: 'Trusted Contributor', description: 'Your contributions are highly valued' },
      { threshold: 100, title: 'Community Expert', description: 'You\'re a recognized expert' },
      { threshold: 250, title: 'Master Contributor', description: 'Your expertise is exceptional' },
      { threshold: 500, title: 'Community Leader', description: 'You\'re leading by example' }
    ];

    const currentMilestone = milestones
      .filter(m => reputationScore >= m.threshold)
      .pop() || milestones[0];

    const nextMilestone = milestones
      .find(m => m.threshold > reputationScore);

    return {
      current: currentMilestone,
      next: nextMilestone,
      progress: nextMilestone ?
        (reputationScore - currentMilestone.threshold) / (nextMilestone.threshold - currentMilestone.threshold) : 1
    };
  }

  /**
   * Check if user has specific privileges based on reputation
   */
  function getUserPrivileges(reputationScore, role) {
    const privileges = {
      canVote: true, // All authenticated users can vote
      canSubmit: true, // All authenticated users can submit
      canEdit: role === 'moderator' || role === 'admin', // Only moderators can edit others' content
      canModerate: role === 'moderator' || role === 'admin',
      canEditOthers: reputationScore >= 100 || role === 'moderator' || role === 'admin',
      canSkipModeration: reputationScore >= 250 || role === 'moderator' || role === 'admin',
      dailyVoteLimit: Math.min(50, Math.max(10, Math.floor(reputationScore / 5) + 10)),
      dailySubmissionLimit: Math.min(10, Math.max(3, Math.floor(reputationScore / 10) + 3))
    };

    return privileges;
  }

  /**
   * Get user's activity history
   */
  async function getUserActivityHistory(userId, limit = 20) {
    try {
      // Get recent definitions
      const { data: definitions, error: defError } = await supabase
        .from('community_definitions')
        .select('id, word_id, definition, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (defError) throw defError;

      // Get recent votes
      const { data: votes, error: voteError } = await supabase
        .from('community_votes')
        .select(`
          vote_type, 
          created_at,
          community_definitions!inner(id, word_id, definition)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (voteError) throw voteError;

      // Combine and sort activities
      const activities = [
        ...definitions.map(def => ({
          type: 'definition',
          action: def.status === 'pending' ? 'submitted' : def.status,
          data: def,
          timestamp: new Date(def.created_at)
        })),
        ...votes.map(vote => ({
          type: 'vote',
          action: vote.vote_type,
          data: {
            definitionId: vote.community_definitions.id,
            wordId: vote.community_definitions.word_id,
            definition: vote.community_definitions.definition
          },
          timestamp: new Date(vote.created_at)
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

      return { success: true, data: activities };
    } catch (err) {
      console.error('Failed to get user activity history:', err);
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.NOT_FOUND,
          message: err.message
        }
      };
    }
  }

  /**
   * Get leaderboard data
   */
  async function getLeaderboard(type = 'reputation', limit = 10) {
    try {
      let query = supabase
        .from('user_profiles')
        .select('id, username, display_name, reputation_score, contribution_count');

      switch (type) {
        case 'reputation':
          query = query.order('reputation_score', { ascending: false });
          break;
        case 'contributions':
          query = query.order('contribution_count', { ascending: false });
          break;
        default:
          query = query.order('reputation_score', { ascending: false });
      }

      query = query.limit(limit);

      const { data, error: leaderboardError } = await query;

      if (leaderboardError) throw leaderboardError;

      return { success: true, data };
    } catch (err) {
      console.error('Failed to get leaderboard:', err);
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.NOT_FOUND,
          message: err.message
        }
      };
    }
  }

  /**
   * Update user role (admin only)
   */
  async function updateUserRole(userId, newRole) {
    try {
      loading.value = true;
      error.value = null;

      // Check if current user is admin
      if (userProfile.value?.role !== 'admin') {
        throw new Error('Only administrators can update user roles');
      }

      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { success: true, data };
    } catch (err) {
      console.error('Failed to update user role:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch moderation queue (pending submissions)
   */
  async function fetchModerationQueue(filters = {}) {
    try {
      loading.value = true;
      error.value = null;

      // Check if user can moderate
      if (!canModerate.value) {
        throw new Error('You do not have permission to access the moderation queue');
      }

      let query = supabase
        .from('community_definitions_with_scores')
        .select('*');

      // Apply status filter (default to pending)
      const status = filters.status || ['pending'];
      query = query.in('status', Array.isArray(status) ? status : [status]);

      // Apply search filter
      if (filters.searchTerm) {
        const searchPattern = `%${filters.searchTerm}%`;
        query = query.or(`definition.ilike.${searchPattern},usage_example.ilike.${searchPattern},word_id.ilike.${searchPattern},username.ilike.${searchPattern}`);
      }

      // Apply date range filter
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply user filter
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data
      const transformedData = data.map(item => ({
        ...item,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        voteScore: item.vote_score,
        authorReputation: item.author_reputation
      }));

      moderationQueue.value = transformedData;

      return { success: true, data: transformedData };
    } catch (err) {
      console.error('Failed to fetch moderation queue:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Approve a community definition
   */
  async function approveDefinition(definitionId, moderatorNotes = '') {
    try {
      loading.value = true;
      error.value = null;

      // Check if user can moderate
      if (!canModerate.value) {
        throw new Error('You do not have permission to moderate content');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to moderate content');
      }

      const { data, error: updateError } = await supabase
        .from('community_definitions')
        .update({
          status: 'approved',
          moderator_notes: moderatorNotes,
          moderator_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', definitionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      const index = moderationQueue.value.findIndex(def => def.id === definitionId);
      if (index !== -1) {
        moderationQueue.value.splice(index, 1);
      }

      // Update main definitions list if present
      const mainIndex = communityDefinitions.value.findIndex(def => def.id === definitionId);
      if (mainIndex !== -1) {
        communityDefinitions.value[mainIndex] = {
          ...communityDefinitions.value[mainIndex],
          status: 'approved',
          moderator_notes: moderatorNotes,
          moderator_id: user.id,
          updatedAt: new Date()
        };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Failed to approve definition:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reject a community definition
   */
  async function rejectDefinition(definitionId, moderatorNotes = '') {
    try {
      loading.value = true;
      error.value = null;

      // Check if user can moderate
      if (!canModerate.value) {
        throw new Error('You do not have permission to moderate content');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to moderate content');
      }

      const { data, error: updateError } = await supabase
        .from('community_definitions')
        .update({
          status: 'rejected',
          moderator_notes: moderatorNotes,
          moderator_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', definitionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      const index = moderationQueue.value.findIndex(def => def.id === definitionId);
      if (index !== -1) {
        moderationQueue.value.splice(index, 1);
      }

      // Update main definitions list if present
      const mainIndex = communityDefinitions.value.findIndex(def => def.id === definitionId);
      if (mainIndex !== -1) {
        communityDefinitions.value[mainIndex] = {
          ...communityDefinitions.value[mainIndex],
          status: 'rejected',
          moderator_notes: moderatorNotes,
          moderator_id: user.id,
          updatedAt: new Date()
        };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Failed to reject definition:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Bulk approve definitions
   */
  async function bulkApproveDefinitions(definitionIds, moderatorNotes = '') {
    try {
      loading.value = true;
      error.value = null;

      // Check if user can moderate
      if (!canModerate.value) {
        throw new Error('You do not have permission to moderate content');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to moderate content');
      }

      const { data, error: updateError } = await supabase
        .from('community_definitions')
        .update({
          status: 'approved',
          moderator_notes: moderatorNotes,
          moderator_id: user.id,
          updated_at: new Date().toISOString()
        })
        .in('id', definitionIds)
        .select();

      if (updateError) throw updateError;

      // Update local state
      definitionIds.forEach(id => {
        const index = moderationQueue.value.findIndex(def => def.id === id);
        if (index !== -1) {
          moderationQueue.value.splice(index, 1);
        }

        // Update main definitions list if present
        const mainIndex = communityDefinitions.value.findIndex(def => def.id === id);
        if (mainIndex !== -1) {
          communityDefinitions.value[mainIndex] = {
            ...communityDefinitions.value[mainIndex],
            status: 'approved',
            moderator_notes: moderatorNotes,
            moderator_id: user.id,
            updatedAt: new Date()
          };
        }
      });

      return { success: true, data, count: data.length };
    } catch (err) {
      console.error('Failed to bulk approve definitions:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Bulk reject definitions
   */
  async function bulkRejectDefinitions(definitionIds, moderatorNotes = '') {
    try {
      loading.value = true;
      error.value = null;

      // Check if user can moderate
      if (!canModerate.value) {
        throw new Error('You do not have permission to moderate content');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to moderate content');
      }

      const { data, error: updateError } = await supabase
        .from('community_definitions')
        .update({
          status: 'rejected',
          moderator_notes: moderatorNotes,
          moderator_id: user.id,
          updated_at: new Date().toISOString()
        })
        .in('id', definitionIds)
        .select();

      if (updateError) throw updateError;

      // Update local state
      definitionIds.forEach(id => {
        const index = moderationQueue.value.findIndex(def => def.id === id);
        if (index !== -1) {
          moderationQueue.value.splice(index, 1);
        }

        // Update main definitions list if present
        const mainIndex = communityDefinitions.value.findIndex(def => def.id === id);
        if (mainIndex !== -1) {
          communityDefinitions.value[mainIndex] = {
            ...communityDefinitions.value[mainIndex],
            status: 'rejected',
            moderator_notes: moderatorNotes,
            moderator_id: user.id,
            updatedAt: new Date()
          };
        }
      });

      return { success: true, data, count: data.length };
    } catch (err) {
      console.error('Failed to bulk reject definitions:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Promote user to admin (super admin only)
   */
  async function promoteToAdmin(targetUserId, adminPermissions = {}, notes = '') {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: promoteError } = await supabase
        .rpc('promote_to_admin', {
          target_user_id: targetUserId,
          admin_permissions: adminPermissions,
          notes: notes
        });

      if (promoteError) throw promoteError;

      return { success: data.success, message: data.message, error: data.error };
    } catch (err) {
      console.error('Failed to promote user to admin:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Promote user to moderator (admin only)
   */
  async function promoteToModerator(targetUserId, notes = '') {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: promoteError } = await supabase
        .rpc('promote_to_moderator', {
          target_user_id: targetUserId,
          notes: notes
        });

      if (promoteError) throw promoteError;

      return { success: data.success, message: data.message, error: data.error };
    } catch (err) {
      console.error('Failed to promote user to moderator:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Demote user to regular user (admin only)
   */
  async function demoteToUser(targetUserId, reason = '') {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: demoteError } = await supabase
        .rpc('demote_to_user', {
          target_user_id: targetUserId,
          reason: reason
        });

      if (demoteError) throw demoteError;

      return { success: data.success, message: data.message, error: data.error };
    } catch (err) {
      console.error('Failed to demote user:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Suspend user account (admin only)
   */
  async function suspendUser(targetUserId, reason, durationDays = null) {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: suspendError } = await supabase
        .rpc('suspend_user', {
          target_user_id: targetUserId,
          reason: reason,
          duration_days: durationDays
        });

      if (suspendError) throw suspendError;

      return { success: data.success, message: data.message, error: data.error };
    } catch (err) {
      console.error('Failed to suspend user:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Reactivate user account (admin only)
   */
  async function reactivateUser(targetUserId, notes = '') {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: reactivateError } = await supabase
        .rpc('reactivate_user', {
          target_user_id: targetUserId,
          notes: notes
        });

      if (reactivateError) throw reactivateError;

      return { success: data.success, message: data.message, error: data.error };
    } catch (err) {
      console.error('Failed to reactivate user:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async function getAdminDashboardStats() {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: statsError } = await supabase
        .rpc('get_admin_dashboard_stats');

      if (statsError) throw statsError;

      return { success: data.success, data: data.data, error: data.error };
    } catch (err) {
      console.error('Failed to get admin dashboard stats:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get user management list with filters
   */
  async function getUserManagementList(filters = {}) {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: listError } = await supabase
        .rpc('get_user_management_list', {
          search_term: filters.searchTerm || null,
          role_filter: filters.roleFilter || null,
          status_filter: filters.statusFilter || null,
          limit_count: filters.limit || 50,
          offset_count: filters.offset || 0
        });

      if (listError) throw listError;

      return { success: data.success, data: data.data, error: data.error };
    } catch (err) {
      console.error('Failed to get user management list:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: err.message
        }
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Calculate and refresh user reputation
   */
  async function refreshUserReputation(userId) {
    try {
      // This would typically be handled by database triggers,
      // but we can manually refresh if needed
      const { data, error: refreshError } = await supabase
        .rpc('update_user_reputation', { user_id: userId });

      if (refreshError) throw refreshError;

      // Refresh local profile if it's the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId) {
        await fetchUserProfile(userId);
      }

      return { success: true, data };
    } catch (err) {
      console.error('Failed to refresh user reputation:', err);
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: err.message
        }
      };
    }
  }

  /**
   * Submit a vote on a definition
   */
  async function submitVote(definitionId, voteType) {
    try {
      error.value = null;

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to vote');
      }

      // Validate vote data
      const voteData = { definitionId, voteType };
      const validatedVote = validateCreateVote(voteData);

      // Get definition to check ownership
      const definition = communityDefinitions.value.find(def => def.id === definitionId);
      if (!definition) {
        throw new Error('Definition not found');
      }

      // Use vote model for client-side validation
      const clientResult = voteModel.value.createVote(
        validatedVote,
        user.id,
        definition.userId || definition.user_id
      );

      if (!clientResult.success) {
        throw new Error(clientResult.error.message);
      }

      // Optimistic update
      const previousVote = userVotes.value.get(definitionId);
      userVotes.value.set(definitionId, { voteType, userId: user.id });
      updateDefinitionVoteScore(definitionId, voteType, previousVote?.voteType);

      try {
        // Submit to database
        const { data, error: voteError } = await supabase
          .from('community_votes')
          .upsert({
            definition_id: definitionId,
            user_id: user.id,
            vote_type: voteType
          }, {
            onConflict: 'definition_id,user_id'
          })
          .select()
          .single();

        if (voteError) throw voteError;

        // Emit real-time event for immediate UI updates across components
        emitVoteUpdate(definitionId, voteType, previousVote?.voteType);

        return { success: true, data };
      } catch (dbError) {
        // Rollback optimistic update on database error
        if (previousVote) {
          userVotes.value.set(definitionId, previousVote);
          updateDefinitionVoteScore(definitionId, previousVote.voteType, voteType);
        } else {
          userVotes.value.delete(definitionId);
          updateDefinitionVoteScore(definitionId, null, voteType);
        }
        throw dbError;
      }
    } catch (err) {
      console.error('Failed to submit vote:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: err.message
        }
      };
    }
  }

  /**
   * Remove a vote
   */
  async function removeVote(definitionId) {
    try {
      error.value = null;

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to remove votes');
      }

      // Optimistic update
      const previousVote = userVotes.value.get(definitionId);
      if (!previousVote) {
        throw new Error('No vote to remove');
      }

      userVotes.value.delete(definitionId);
      updateDefinitionVoteScore(definitionId, null, previousVote.voteType);

      try {
        // Remove from database
        const { error: deleteError } = await supabase
          .from('community_votes')
          .delete()
          .eq('definition_id', definitionId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        return { success: true };
      } catch (dbError) {
        // Rollback optimistic update on database error
        userVotes.value.set(definitionId, previousVote);
        updateDefinitionVoteScore(definitionId, previousVote.voteType, null);
        throw dbError;
      }
    } catch (err) {
      console.error('Failed to remove vote:', err);
      error.value = err.message;
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: err.message
        }
      };
    }
  }

  /**
   * Update definition vote score locally (for optimistic updates)
   */
  function updateDefinitionVoteScore(definitionId, newVoteType, previousVoteType) {
    const definition = communityDefinitions.value.find(def => def.id === definitionId);
    if (!definition) return;

    let scoreChange = 0;
    let upvoteChange = 0;
    let downvoteChange = 0;

    // Calculate changes based on vote transition
    if (previousVoteType === 'upvote' && newVoteType === 'downvote') {
      scoreChange = -2; // Remove upvote, add downvote
      upvoteChange = -1;
      downvoteChange = 1;
    } else if (previousVoteType === 'downvote' && newVoteType === 'upvote') {
      scoreChange = 2; // Remove downvote, add upvote
      upvoteChange = 1;
      downvoteChange = -1;
    } else if (previousVoteType === 'upvote' && !newVoteType) {
      scoreChange = -1; // Remove upvote
      upvoteChange = -1;
    } else if (previousVoteType === 'downvote' && !newVoteType) {
      scoreChange = 1; // Remove downvote
      downvoteChange = -1;
    } else if (!previousVoteType && newVoteType === 'upvote') {
      scoreChange = 1; // Add upvote
      upvoteChange = 1;
    } else if (!previousVoteType && newVoteType === 'downvote') {
      scoreChange = -1; // Add downvote
      downvoteChange = 1;
    }

    // Apply changes
    definition.voteScore = (definition.voteScore || 0) + scoreChange;
    definition.upvotes = Math.max(0, (definition.upvotes || 0) + upvoteChange);
    definition.downvotes = Math.max(0, (definition.downvotes || 0) + downvoteChange);
    definition.userVote = newVoteType;
  }

  /**
   * Fetch user votes for definitions
   */
  async function fetchUserVotes(definitionIds) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !definitionIds.length) return;

      const { data, error: votesError } = await supabase
        .from('community_votes')
        .select('definition_id, vote_type')
        .eq('user_id', user.id)
        .in('definition_id', definitionIds);

      if (votesError) throw votesError;

      // Update local votes map
      data.forEach(vote => {
        userVotes.value.set(vote.definition_id, {
          voteType: vote.vote_type,
          userId: user.id
        });
      });

      // Update definitions with user vote info
      communityDefinitions.value.forEach(definition => {
        const userVote = data.find(vote => vote.definition_id === definition.id);
        if (userVote) {
          definition.userVote = userVote.vote_type;
        }
      });

      return { success: true, data };
    } catch (err) {
      console.error('Failed to fetch user votes:', err);
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.NOT_FOUND,
          message: err.message
        }
      };
    }
  }

  /**
   * Set up real-time subscriptions for vote updates
   */
  function setupRealtimeSubscriptions() {
    // Clear existing subscriptions
    cleanupRealtimeSubscriptions();

    // Subscribe to vote changes
    const voteSubscription = supabase
      .channel('community_votes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_votes'
      }, (payload) => {
        handleVoteRealtimeUpdate(payload);
      })
      .subscribe();

    // Subscribe to definition changes
    const definitionSubscription = supabase
      .channel('community_definitions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_definitions'
      }, (payload) => {
        handleDefinitionRealtimeUpdate(payload);
      })
      .subscribe();

    // Store subscriptions for cleanup
    realtimeSubscriptions.value = [voteSubscription, definitionSubscription];

    return () => {
      cleanupRealtimeSubscriptions();
    };
  }

  /**
   * Clean up real-time subscriptions
   */
  function cleanupRealtimeSubscriptions() {
    realtimeSubscriptions.value.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    realtimeSubscriptions.value = [];
  }

  /**
   * Handle real-time vote updates
   */
  function handleVoteRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Update vote counts for the affected definition
      refreshDefinitionVotes(newRecord.definition_id);

      // Notify registered callbacks
      emitVoteUpdate(newRecord.definition_id, newRecord.vote_type, oldRecord?.vote_type);
    } else if (eventType === 'DELETE') {
      // Update vote counts for the affected definition
      refreshDefinitionVotes(oldRecord.definition_id);

      // Notify registered callbacks
      emitVoteUpdate(oldRecord.definition_id, null, oldRecord.vote_type);
    }
  }

  /**
   * Emit vote update events to registered callbacks
   */
  function emitVoteUpdate(definitionId, newVoteType, previousVoteType) {
    const updateData = {
      definitionId,
      newVoteType,
      previousVoteType,
      timestamp: new Date()
    };

    // Call all registered callbacks
    voteUpdateCallbacks.value.forEach(callback => {
      try {
        callback(updateData);
      } catch (err) {
        console.error('Error in vote update callback:', err);
      }
    });
  }

  /**
   * Register a callback for vote updates
   */
  function onVoteUpdate(callback) {
    voteUpdateCallbacks.value.add(callback);

    // Return unsubscribe function
    return () => {
      voteUpdateCallbacks.value.delete(callback);
    };
  }

  /**
   * Handle real-time definition updates
   */
  function handleDefinitionRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      // Add new definition if it matches current filters
      // This would need more sophisticated filtering logic
      console.log('New definition added:', newRecord);
    } else if (eventType === 'UPDATE') {
      // Update existing definition
      const index = communityDefinitions.value.findIndex(def => def.id === newRecord.id);
      if (index !== -1) {
        communityDefinitions.value[index] = {
          ...communityDefinitions.value[index],
          ...newRecord,
          createdAt: new Date(newRecord.created_at),
          updatedAt: new Date(newRecord.updated_at)
        };
      }
    } else if (eventType === 'DELETE') {
      // Remove deleted definition
      const index = communityDefinitions.value.findIndex(def => def.id === oldRecord.id);
      if (index !== -1) {
        communityDefinitions.value.splice(index, 1);
      }
    }
  }

  /**
   * Refresh vote counts for a specific definition
   */
  async function refreshDefinitionVotes(definitionId) {
    try {
      const { data, error: voteError } = await supabase
        .from('community_definitions_with_scores')
        .select('vote_score, upvotes, downvotes')
        .eq('id', definitionId)
        .single();

      if (voteError) throw voteError;

      // Update local definition
      const definition = communityDefinitions.value.find(def => def.id === definitionId);
      if (definition) {
        definition.voteScore = data.vote_score;
        definition.upvotes = data.upvotes;
        definition.downvotes = data.downvotes;
      }
    } catch (err) {
      console.error('Failed to refresh definition votes:', err);
    }
  }

  /**
   * Get vote summary for a definition
   */
  function getVoteSummary(definitionId) {
    const definition = communityDefinitions.value.find(def => def.id === definitionId);
    if (!definition) {
      return { upvotes: 0, downvotes: 0, score: 0, userVote: undefined };
    }

    return {
      upvotes: definition.upvotes || 0,
      downvotes: definition.downvotes || 0,
      score: definition.voteScore || 0,
      userVote: definition.userVote
    };
  }

  /**
   * Clear cache
   */
  function clearCache() {
    searchCache.value.clear();
  }

  /**
   * Reset store state
   */
  function reset() {
    communityDefinitions.value = [];
    userVotes.value = new Map();
    userProfile.value = null;
    pendingSubmissions.value = [];
    moderationQueue.value = [];
    loading.value = false;
    error.value = null;
    lastFetch.value = null;
    searchCache.value.clear();
    cleanupRealtimeSubscriptions();
    voteUpdateCallbacks.value.clear();
  }

  // Return store interface
  return {
    // State
    communityDefinitions,
    userVotes,
    userProfile,
    pendingSubmissions,
    moderationQueue,
    loading,
    error,
    lastFetch,

    // Computed
    approvedDefinitions,
    pendingDefinitions,
    userDefinitions,
    userReputation,
    canModerate,

    // Actions
    initialize,
    fetchUserProfile,
    createUserProfile,
    submitDefinition,
    updateDefinition,
    fetchDefinitionsForWord,
    searchDefinitions,
    deleteDefinition,
    updateUserProfile,
    getUserContributionStats,
    getReputationMilestones,
    getUserPrivileges,
    getUserActivityHistory,
    getLeaderboard,
    updateUserRole,
    refreshUserReputation,

    // Moderation actions
    fetchModerationQueue,
    approveDefinition,
    rejectDefinition,
    bulkApproveDefinitions,
    bulkRejectDefinitions,

    // Admin management actions
    promoteToAdmin,
    promoteToModerator,
    demoteToUser,
    suspendUser,
    reactivateUser,
    getAdminDashboardStats,
    getUserManagementList,
    updateUserRole,

    // Voting actions
    submitVote,
    removeVote,
    fetchUserVotes,
    updateDefinitionVoteScore,
    getVoteSummary,

    // Real-time functionality
    setupRealtimeSubscriptions,
    cleanupRealtimeSubscriptions,
    onVoteUpdate,
    handleVoteRealtimeUpdate,
    handleDefinitionRealtimeUpdate,
    emitVoteUpdate,
    refreshDefinitionVotes,
    getVoteSummary,

    // Utility actions
    clearCache,
    reset
  };

  /**
   * Setup real-time subscriptions
   */
  function setupRealtimeSubscriptions() {
    // Clear existing subscriptions
    cleanupRealtimeSubscriptions();

    // Subscribe to vote changes
    const voteSubscription = supabase
      .channel('community_votes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_votes'
      }, (payload) => {
        handleVoteRealtimeUpdate(payload);
      })
      .subscribe();

    // Subscribe to definition changes
    const definitionSubscription = supabase
      .channel('community_definitions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_definitions'
      }, (payload) => {
        handleDefinitionRealtimeUpdate(payload);
      })
      .subscribe();

    // Store subscriptions for cleanup
    realtimeSubscriptions.value = [voteSubscription, definitionSubscription];

    return () => {
      cleanupRealtimeSubscriptions();
    };
  }

  /**
   * Clean up real-time subscriptions
   */
  function cleanupRealtimeSubscriptions() {
    realtimeSubscriptions.value.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    realtimeSubscriptions.value = [];
  }

  /**
   * Handle real-time vote updates
   */
  function handleVoteRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Update vote counts for the affected definition
      refreshDefinitionVotes(newRecord.definition_id);

      // Notify registered callbacks
      emitVoteUpdate(newRecord.definition_id, newRecord.vote_type, oldRecord?.vote_type);
    } else if (eventType === 'DELETE') {
      // Update vote counts for the affected definition
      refreshDefinitionVotes(oldRecord.definition_id);

      // Notify registered callbacks
      emitVoteUpdate(oldRecord.definition_id, null, oldRecord.vote_type);
    }
  }

  /**
   * Emit vote update events to registered callbacks
   */
  function emitVoteUpdate(definitionId, newVoteType, previousVoteType) {
    const updateData = {
      definitionId,
      newVoteType,
      previousVoteType,
      timestamp: new Date()
    };

    // Call all registered callbacks
    voteUpdateCallbacks.value.forEach(callback => {
      try {
        callback(updateData);
      } catch (err) {
        console.error('Error in vote update callback:', err);
      }
    });
  }

  /**
   * Register a callback for vote updates
   */
  function onVoteUpdate(callback) {
    voteUpdateCallbacks.value.add(callback);

    // Return unsubscribe function
    return () => {
      voteUpdateCallbacks.value.delete(callback);
    };
  }

  /**
   * Handle real-time definition updates
   */
  function handleDefinitionRealtimeUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      // Add new definition if it matches current filters
      // This would need more sophisticated filtering logic
      console.log('New definition added:', newRecord);
    } else if (eventType === 'UPDATE') {
      // Update existing definition
      const index = communityDefinitions.value.findIndex(def => def.id === newRecord.id);
      if (index !== -1) {
        communityDefinitions.value[index] = {
          ...communityDefinitions.value[index],
          ...newRecord,
          createdAt: new Date(newRecord.created_at),
          updatedAt: new Date(newRecord.updated_at)
        };
      }
    } else if (eventType === 'DELETE') {
      // Remove deleted definition
      const index = communityDefinitions.value.findIndex(def => def.id === oldRecord.id);
      if (index !== -1) {
        communityDefinitions.value.splice(index, 1);
      }
    }
  }

  /**
   * Refresh vote counts for a specific definition
   */
  async function refreshDefinitionVotes(definitionId) {
    try {
      const { data, error: voteError } = await supabase
        .from('community_definitions_with_scores')
        .select('vote_score, upvotes, downvotes')
        .eq('id', definitionId)
        .single();

      if (voteError) throw voteError;

      // Update local definition
      const definition = communityDefinitions.value.find(def => def.id === definitionId);
      if (definition) {
        definition.voteScore = data.vote_score;
        definition.upvotes = data.upvotes;
        definition.downvotes = data.downvotes;
      }
    } catch (err) {
      console.error('Failed to refresh definition votes:', err);
    }
  }

  /**
   * Get vote summary for a definition
   */
  function getVoteSummary(definitionId) {
    const definition = communityDefinitions.value.find(def => def.id === definitionId);
    if (!definition) {
      return { upvotes: 0, downvotes: 0, score: 0, userVote: undefined };
    }

    return {
      upvotes: definition.upvotes || 0,
      downvotes: definition.downvotes || 0,
      score: definition.voteScore || 0,
      userVote: definition.userVote
    };
  }

  /**
   * Clear cache
   */
  function clearCache() {
    searchCache.value.clear();
  }

  /**
   * Reset store state
   */
  function reset() {
    communityDefinitions.value = [];
    userVotes.value = new Map();
    userProfile.value = null;
    pendingSubmissions.value = [];
    moderationQueue.value = [];
    loading.value = false;
    error.value = null;
    lastFetch.value = null;
    voteModel.value = new VoteModel();
    searchCache.value.clear();
  }

  return {
    // State
    communityDefinitions,
    userVotes,
    userProfile,
    pendingSubmissions,
    moderationQueue,
    loading,
    error,
    lastFetch,
    voteModel,

    // Computed
    approvedDefinitions,
  pendingDefinitions,
  userDefinitions,
  userReputation,
  canModerate,

  // Actions
  initialize,
  fetchUserProfile,
  createUserProfile,
  submitDefinition,
  updateDefinition,
  fetchDefinitionsForWord,
  searchDefinitions,
  deleteDefinition,

  // Profile and reputation management
  updateUserProfile,
  getUserContributionStats,
  getReputationMilestones,
  getUserPrivileges,
  getUserActivityHistory,
  getLeaderboard,
  updateUserRole,
  refreshUserReputation,

  // Voting actions
  submitVote,
  removeVote,
  fetchUserVotes,
  getVoteSummary,

  // Real-time functionality
  setupRealtimeSubscriptions,
  refreshDefinitionVotes,

  // Utility functions
  clearCache,
  reset
};
});