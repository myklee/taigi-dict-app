// Unit tests for community validation utilities
import { describe, it, expect } from 'vitest';
import {
  validateCreateDefinition,
  validateUpdateDefinition,
  validateCreateVote,
  validateUpdateProfile,
  validateCreateReport,
  validateSearchFilters,
  CommunityValidationError,
  sanitizeDefinition,
  sanitizeTags,
  sanitizeUsageExample,
  canUserVote,
  canUserModerate,
  canUserEdit,
  isDefinitionVisible
} from '../communityValidation';

describe('Community Validation', () => {
  describe('validateCreateDefinition', () => {
    it('should validate a valid definition', () => {
      const validDefinition = {
        wordId: 'test-word-123',
        definition: 'This is a valid definition with enough characters',
        usageExample: 'Example usage of the word',
        tags: ['tag1', 'tag2'],
        context: 'Some context information'
      };

      const result = validateCreateDefinition(validDefinition);
      expect(result).toEqual(validDefinition);
    });

    it('should reject definition with empty wordId', () => {
      const invalidDefinition = {
        wordId: '',
        definition: 'Valid definition',
        tags: []
      };

      expect(() => validateCreateDefinition(invalidDefinition))
        .toThrow(CommunityValidationError);
    });

    it('should reject definition that is too short', () => {
      const invalidDefinition = {
        wordId: 'test',
        definition: 'Too',
        tags: []
      };

      expect(() => validateCreateDefinition(invalidDefinition))
        .toThrow(CommunityValidationError);
    });

    it('should reject definition that is too long', () => {
      const invalidDefinition = {
        wordId: 'test',
        definition: 'x'.repeat(2001),
        tags: []
      };

      expect(() => validateCreateDefinition(invalidDefinition))
        .toThrow(CommunityValidationError);
    });

    it('should reject too many tags', () => {
      const invalidDefinition = {
        wordId: 'test',
        definition: 'Valid definition',
        tags: Array(11).fill('tag')
      };

      expect(() => validateCreateDefinition(invalidDefinition))
        .toThrow(CommunityValidationError);
    });

    it('should reject duplicate tags', () => {
      const invalidDefinition = {
        wordId: 'test',
        definition: 'Valid definition',
        tags: ['tag1', 'tag1', 'tag2']
      };

      expect(() => validateCreateDefinition(invalidDefinition))
        .toThrow(CommunityValidationError);
    });

    it('should trim whitespace from optional fields', () => {
      const definition = {
        wordId: 'test',
        definition: 'Valid definition',
        usageExample: '  Example with spaces  ',
        context: '  Context with spaces  ',
        tags: []
      };

      const result = validateCreateDefinition(definition);
      expect(result.usageExample).toBe('Example with spaces');
      expect(result.context).toBe('Context with spaces');
    });
  });

  describe('validateCreateVote', () => {
    it('should validate a valid vote', () => {
      const validVote = {
        definitionId: '123e4567-e89b-12d3-a456-426614174000',
        voteType: 'upvote'
      };

      const result = validateCreateVote(validVote);
      expect(result).toEqual(validVote);
    });

    it('should reject invalid UUID', () => {
      const invalidVote = {
        definitionId: 'not-a-uuid',
        voteType: 'upvote'
      };

      expect(() => validateCreateVote(invalidVote))
        .toThrow(CommunityValidationError);
    });

    it('should reject invalid vote type', () => {
      const invalidVote = {
        definitionId: '123e4567-e89b-12d3-a456-426614174000',
        voteType: 'invalid'
      };

      expect(() => validateCreateVote(invalidVote))
        .toThrow(CommunityValidationError);
    });
  });

  describe('validateUpdateProfile', () => {
    it('should validate a valid profile update', () => {
      const validUpdate = {
        displayName: 'John Doe',
        username: 'johndoe123',
        bio: 'I love learning Taiwanese!',
        preferences: { theme: 'dark' }
      };

      const result = validateUpdateProfile(validUpdate);
      expect(result).toEqual(validUpdate);
    });

    it('should reject username with invalid characters', () => {
      const invalidUpdate = {
        username: 'john@doe'
      };

      expect(() => validateUpdateProfile(invalidUpdate))
        .toThrow(CommunityValidationError);
    });

    it('should reject username that is too short', () => {
      const invalidUpdate = {
        username: 'jo'
      };

      expect(() => validateUpdateProfile(invalidUpdate))
        .toThrow(CommunityValidationError);
    });

    it('should reject invalid avatar URL', () => {
      const invalidUpdate = {
        avatarUrl: 'not-a-url'
      };

      expect(() => validateUpdateProfile(invalidUpdate))
        .toThrow(CommunityValidationError);
    });
  });

  describe('validateSearchFilters', () => {
    it('should validate valid search filters', () => {
      const validFilters = {
        status: ['approved'],
        tags: ['grammar', 'vocabulary'],
        minScore: 5,
        maxScore: 100,
        sortBy: 'score',
        sortOrder: 'desc',
        limit: 20,
        offset: 0
      };

      const result = validateSearchFilters(validFilters);
      expect(result).toEqual(validFilters);
    });

    it('should apply default values', () => {
      const result = validateSearchFilters({});
      expect(result.sortBy).toBe('score');
      expect(result.sortOrder).toBe('desc');
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should reject minScore greater than maxScore', () => {
      const invalidFilters = {
        minScore: 100,
        maxScore: 50
      };

      expect(() => validateSearchFilters(invalidFilters))
        .toThrow(CommunityValidationError);
    });
  });

  describe('sanitizeDefinition', () => {
    it('should trim whitespace and normalize spaces', () => {
      const input = '  This   has    multiple   spaces  ';
      const result = sanitizeDefinition(input);
      expect(result).toBe('This has multiple spaces');
    });

    it('should remove HTML-like characters', () => {
      const input = 'Definition with <script> and > characters';
      const result = sanitizeDefinition(input);
      expect(result).toBe('Definition with script and  characters');
    });

    it('should truncate to maximum length', () => {
      const input = 'x'.repeat(2500);
      const result = sanitizeDefinition(input);
      expect(result.length).toBe(2000);
    });
  });

  describe('sanitizeTags', () => {
    it('should normalize tags to lowercase and trim', () => {
      const input = ['  Tag1  ', 'TAG2', 'tag3'];
      const result = sanitizeTags(input);
      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should remove duplicates', () => {
      const input = ['tag1', 'tag2', 'tag1', 'TAG1'];
      const result = sanitizeTags(input);
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should filter out empty and too long tags', () => {
      const input = ['', 'valid', 'x'.repeat(51), '   ', 'another'];
      const result = sanitizeTags(input);
      expect(result).toEqual(['valid', 'another']);
    });

    it('should limit to 10 tags', () => {
      const input = Array(15).fill(0).map((_, i) => `tag${i}`);
      const result = sanitizeTags(input);
      expect(result.length).toBe(10);
    });
  });

  describe('sanitizeUsageExample', () => {
    it('should return undefined for empty input', () => {
      expect(sanitizeUsageExample('')).toBeUndefined();
      expect(sanitizeUsageExample('   ')).toBeUndefined();
      expect(sanitizeUsageExample(undefined)).toBeUndefined();
    });

    it('should sanitize valid input', () => {
      const input = '  Example with   spaces  ';
      const result = sanitizeUsageExample(input);
      expect(result).toBe('Example with spaces');
    });

    it('should truncate to maximum length', () => {
      const input = 'x'.repeat(1500);
      const result = sanitizeUsageExample(input);
      expect(result?.length).toBe(1000);
    });
  });

  describe('Business rule validators', () => {
    describe('canUserVote', () => {
      it('should allow voting on others content', () => {
        expect(canUserVote('user1', 'user2')).toBe(true);
      });

      it('should prevent self-voting', () => {
        expect(canUserVote('user1', 'user1')).toBe(false);
      });
    });

    describe('canUserModerate', () => {
      it('should allow moderators to moderate', () => {
        expect(canUserModerate('moderator')).toBe(true);
        expect(canUserModerate('admin')).toBe(true);
      });

      it('should not allow regular users to moderate', () => {
        expect(canUserModerate('user')).toBe(false);
      });
    });

    describe('canUserEdit', () => {
      it('should allow users to edit their own content', () => {
        expect(canUserEdit('user1', 'user1', 'user')).toBe(true);
      });

      it('should allow moderators to edit any content', () => {
        expect(canUserEdit('user1', 'user2', 'moderator')).toBe(true);
        expect(canUserEdit('user1', 'user2', 'admin')).toBe(true);
      });

      it('should not allow users to edit others content', () => {
        expect(canUserEdit('user1', 'user2', 'user')).toBe(false);
      });
    });

    describe('isDefinitionVisible', () => {
      it('should show approved definitions to everyone', () => {
        expect(isDefinitionVisible('approved')).toBe(true);
        expect(isDefinitionVisible('approved', 'user1', 'user2')).toBe(true);
      });

      it('should hide hidden definitions from everyone', () => {
        expect(isDefinitionVisible('hidden')).toBe(false);
        expect(isDefinitionVisible('hidden', 'user1', 'user1')).toBe(false);
      });

      it('should show pending/rejected definitions to authors', () => {
        expect(isDefinitionVisible('pending', 'user1', 'user1')).toBe(true);
        expect(isDefinitionVisible('rejected', 'user1', 'user1')).toBe(true);
      });

      it('should hide pending/rejected definitions from others', () => {
        expect(isDefinitionVisible('pending', 'user1', 'user2')).toBe(false);
        expect(isDefinitionVisible('rejected', 'user1', 'user2')).toBe(false);
        expect(isDefinitionVisible('pending')).toBe(false);
      });
    });
  });
});