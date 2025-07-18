// Community Content Validation Schemas
// Zod schemas for runtime validation of community content data

import { z } from 'zod';
import type {
  ContentStatus,
  VoteType,
  UserRole,
  ReportStatus,
  CreateCommunityDefinition,
  UpdateCommunityDefinition,
  CreateVote,
  UpdateUserProfile,
  CreateContentReport,
  CommunitySearchFilters
} from '@/types/community';

// Base validation schemas for enums
export const ContentStatusSchema = z.enum(['pending', 'approved', 'rejected', 'hidden']);
export const VoteTypeSchema = z.enum(['upvote', 'downvote']);
export const UserRoleSchema = z.enum(['user', 'moderator', 'admin']);
export const ReportStatusSchema = z.enum(['pending', 'resolved', 'dismissed']);

// Validation schema for creating community definitions
export const CreateCommunityDefinitionSchema = z.object({
  wordId: z.string()
    .min(1, 'Word ID is required')
    .max(100, 'Word ID is too long'),
  
  definition: z.string()
    .min(5, 'Definition must be at least 5 characters long')
    .max(2000, 'Definition is too long (max 2000 characters)')
    .refine(
      (val) => val.trim().length > 0,
      'Definition cannot be empty or only whitespace'
    ),
  
  usageExample: z.string()
    .max(1000, 'Usage example is too long (max 1000 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined),
  
  tags: z.array(z.string())
    .max(10, 'Too many tags (max 10)')
    .refine(
      (tags) => tags.every(tag => tag.length <= 50),
      'Each tag must be 50 characters or less'
    )
    .refine(
      (tags) => new Set(tags).size === tags.length,
      'Tags must be unique'
    )
    .default([]),
  
  context: z.string()
    .max(500, 'Context is too long (max 500 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined)
});

// Validation schema for updating community definitions
export const UpdateCommunityDefinitionSchema = z.object({
  definition: z.string()
    .min(5, 'Definition must be at least 5 characters long')
    .max(2000, 'Definition is too long (max 2000 characters)')
    .optional(),
  
  usageExample: z.string()
    .max(1000, 'Usage example is too long (max 1000 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined),
  
  tags: z.array(z.string())
    .max(10, 'Too many tags (max 10)')
    .refine(
      (tags) => tags.every(tag => tag.length <= 50),
      'Each tag must be 50 characters or less'
    )
    .refine(
      (tags) => new Set(tags).size === tags.length,
      'Tags must be unique'
    )
    .optional(),
  
  context: z.string()
    .max(500, 'Context is too long (max 500 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined),
  
  status: ContentStatusSchema.optional(),
  
  moderatorNotes: z.string()
    .max(1000, 'Moderator notes are too long (max 1000 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined)
});

// Validation schema for creating votes
export const CreateVoteSchema = z.object({
  definitionId: z.string()
    .uuid('Invalid definition ID format'),
  
  voteType: VoteTypeSchema
});

// Validation schema for updating user profiles
export const UpdateUserProfileSchema = z.object({
  displayName: z.string()
    .min(1, 'Display name cannot be empty')
    .max(100, 'Display name is too long (max 100 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username is too long (max 30 characters)')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  
  bio: z.string()
    .max(500, 'Bio is too long (max 500 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined),
  
  avatarUrl: z.string()
    .url('Invalid avatar URL')
    .optional(),
  
  preferences: z.record(z.any())
    .optional()
    .default({})
});

// Validation schema for creating content reports
export const CreateContentReportSchema = z.object({
  definitionId: z.string()
    .uuid('Invalid definition ID format'),
  
  reason: z.string()
    .min(10, 'Report reason must be at least 10 characters long')
    .max(1000, 'Report reason is too long (max 1000 characters)')
    .refine(
      (val) => val.trim().length >= 10,
      'Report reason cannot be empty or only whitespace'
    )
});

// Validation schema for search filters
export const CommunitySearchFiltersSchema = z.object({
  status: z.array(ContentStatusSchema)
    .optional(),
  
  tags: z.array(z.string())
    .optional(),
  
  minScore: z.number()
    .int()
    .optional(),
  
  maxScore: z.number()
    .int()
    .optional(),
  
  userId: z.string()
    .uuid()
    .optional(),
  
  wordId: z.string()
    .optional(),
  
  searchTerm: z.string()
    .min(1, 'Search term cannot be empty')
    .max(100, 'Search term is too long')
    .optional()
    .transform((val) => val?.trim() || undefined),
  
  sortBy: z.enum(['score', 'date', 'votes'])
    .default('score'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc'),
  
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  
  offset: z.number()
    .int()
    .min(0)
    .default(0)
}).refine(
  (data) => !data.minScore || !data.maxScore || data.minScore <= data.maxScore,
  {
    message: 'Minimum score cannot be greater than maximum score',
    path: ['minScore']
  }
);

// Validation schema for notification preferences
export const NotificationPreferencesSchema = z.object({
  voteNotifications: z.boolean().default(true),
  statusChangeNotifications: z.boolean().default(true),
  moderationNotifications: z.boolean().default(false),
  emailNotifications: z.boolean().default(false)
});

// Validation schema for moderation actions
export const ModerationActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'hide', 'unhide']),
  definitionIds: z.array(z.string().uuid())
    .min(1, 'At least one definition must be selected')
    .max(50, 'Too many definitions selected (max 50)'),
  moderatorNotes: z.string()
    .max(1000, 'Moderator notes are too long (max 1000 characters)')
    .optional()
    .transform((val) => val?.trim() || undefined)
});

// Utility functions for validation
export class CommunityValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'CommunityValidationError';
  }
}

export function validateCreateDefinition(data: unknown): CreateCommunityDefinition {
  try {
    return CreateCommunityDefinitionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new CommunityValidationError(
        firstError.message,
        firstError.path.join('.'),
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
}

export function validateUpdateDefinition(data: unknown): UpdateCommunityDefinition {
  try {
    return UpdateCommunityDefinitionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new CommunityValidationError(
        firstError.message,
        firstError.path.join('.'),
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
}

export function validateCreateVote(data: unknown): CreateVote {
  try {
    return CreateVoteSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new CommunityValidationError(
        firstError.message,
        firstError.path.join('.'),
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
}

export function validateUpdateProfile(data: unknown): UpdateUserProfile {
  try {
    return UpdateUserProfileSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new CommunityValidationError(
        firstError.message,
        firstError.path.join('.'),
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
}

export function validateCreateReport(data: unknown): CreateContentReport {
  try {
    return CreateContentReportSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new CommunityValidationError(
        firstError.message,
        firstError.path.join('.'),
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
}

export function validateSearchFilters(data: unknown): CommunitySearchFilters {
  try {
    return CommunitySearchFiltersSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new CommunityValidationError(
        firstError.message,
        firstError.path.join('.'),
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
}

// Content sanitization functions
export function sanitizeDefinition(definition: string): string {
  return definition
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 2000); // Ensure max length
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
    .slice(0, 10); // Limit to 10 tags
}

export function sanitizeUsageExample(example?: string): string | undefined {
  if (!example) return undefined;
  
  const sanitized = example
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .substring(0, 1000);
  
  return sanitized.length > 0 ? sanitized : undefined;
}

// Validation helpers for business rules
export function canUserVote(userId: string, definitionUserId: string): boolean {
  return userId !== definitionUserId;
}

export function canUserModerate(userRole: UserRole): boolean {
  return userRole === 'moderator' || userRole === 'admin';
}

export function canUserEdit(userId: string, definitionUserId: string, userRole: UserRole): boolean {
  return userId === definitionUserId || canUserModerate(userRole);
}

export function isDefinitionVisible(status: ContentStatus, userId?: string, definitionUserId?: string): boolean {
  if (status === 'approved') return true;
  if (status === 'hidden') return false;
  if (userId && definitionUserId && userId === definitionUserId) return true;
  return false;
}