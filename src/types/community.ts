// Community Content Type Definitions
// TypeScript interfaces for the community-driven content system

export type ContentStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type VoteType = 'upvote' | 'downvote';
export type UserRole = 'user' | 'moderator' | 'admin';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

// Base interface for community definitions
export interface CommunityDefinition {
  id: string;
  wordId: string;
  userId: string;
  definition: string;
  usageExample?: string;
  tags: string[];
  context?: string;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  moderatorNotes?: string;
  moderatorId?: string;
}

// Extended interface with calculated fields for display
export interface CommunityDefinitionWithScore extends CommunityDefinition {
  username: string;
  authorReputation: number;
  voteScore: number;
  upvotes: number;
  downvotes: number;
  userVote?: VoteType;
}

// Interface for creating new community definitions
export interface CreateCommunityDefinition {
  wordId: string;
  definition: string;
  usageExample?: string;
  tags: string[];
  context?: string;
}

// Interface for updating community definitions
export interface UpdateCommunityDefinition {
  definition?: string;
  usageExample?: string;
  tags?: string[];
  context?: string;
  status?: ContentStatus;
  moderatorNotes?: string;
}

// Vote interface
export interface Vote {
  id: string;
  definitionId: string;
  userId: string;
  voteType: VoteType;
  createdAt: Date;
}

// Interface for creating votes
export interface CreateVote {
  definitionId: string;
  voteType: VoteType;
}

// User profile interface (extends existing profile)
export interface UserProfile {
  id: string;
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  preferences: Record<string, any>;
  reputationScore: number;
  role: UserRole;
  contributionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for updating user profiles
export interface UpdateUserProfile {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  preferences?: Record<string, any>;
}

// Content report interface
export interface ContentReport {
  id: string;
  definitionId: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Interface for creating content reports
export interface CreateContentReport {
  definitionId: string;
  reason: string;
}

// Interface for API responses
export interface CommunityDefinitionResponse {
  data: CommunityDefinitionWithScore[];
  count: number;
  hasMore: boolean;
}

// Interface for vote summary
export interface VoteSummary {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote?: VoteType;
}

// Interface for user contribution statistics
export interface UserContributionStats {
  totalDefinitions: number;
  approvedDefinitions: number;
  pendingDefinitions: number;
  rejectedDefinitions: number;
  totalVotesReceived: number;
  reputationScore: number;
  contributionCount: number;
}

// Interface for moderation queue item
export interface ModerationQueueItem extends CommunityDefinition {
  username: string;
  authorReputation: number;
  reportCount: number;
  reports: ContentReport[];
}

// Interface for search filters
export interface CommunitySearchFilters {
  status?: ContentStatus[];
  tags?: string[];
  minScore?: number;
  maxScore?: number;
  userId?: string;
  wordId?: string;
  searchTerm?: string;
  sortBy?: 'score' | 'date' | 'votes';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Interface for notification preferences
export interface NotificationPreferences {
  voteNotifications: boolean;
  statusChangeNotifications: boolean;
  moderationNotifications: boolean;
  emailNotifications: boolean;
}

// Interface for community statistics
export interface CommunityStats {
  totalDefinitions: number;
  approvedDefinitions: number;
  pendingDefinitions: number;
  totalVotes: number;
  activeContributors: number;
  topContributors: Array<{
    userId: string;
    username: string;
    contributionCount: number;
    reputationScore: number;
  }>;
}

// Error types for community operations
export interface CommunityError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Common error codes
export const COMMUNITY_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_VOTE: 'DUPLICATE_VOTE',
  SELF_VOTE: 'SELF_VOTE',
  RATE_LIMITED: 'RATE_LIMITED',
  CONTENT_FLAGGED: 'CONTENT_FLAGGED',
  INSUFFICIENT_REPUTATION: 'INSUFFICIENT_REPUTATION'
} as const;

export type CommunityErrorCode = typeof COMMUNITY_ERROR_CODES[keyof typeof COMMUNITY_ERROR_CODES];

// Utility type for API responses
export interface ApiResponse<T> {
  data?: T;
  error?: CommunityError;
  success: boolean;
}

// Type guards for runtime type checking
export function isCommunityDefinition(obj: any): obj is CommunityDefinition {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.wordId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.definition === 'string' &&
    Array.isArray(obj.tags) &&
    ['pending', 'approved', 'rejected', 'hidden'].includes(obj.status)
  );
}

export function isVote(obj: any): obj is Vote {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.definitionId === 'string' &&
    typeof obj.userId === 'string' &&
    ['upvote', 'downvote'].includes(obj.voteType)
  );
}

export function isUserProfile(obj: any): obj is UserProfile {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.reputationScore === 'number' &&
    ['user', 'moderator', 'admin'].includes(obj.role)
  );
}