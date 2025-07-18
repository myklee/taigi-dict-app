// Unit tests for VoteModel
import { describe, it, expect, beforeEach } from 'vitest';
import { VoteModel } from '../VoteModel';
import { COMMUNITY_ERROR_CODES } from '@/types/community';

describe('VoteModel', () => {
  let voteModel;
  const mockDefinitionId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = 'user123';
  const mockDefinitionUserId = 'author456';

  beforeEach(() => {
    voteModel = new VoteModel();
  });

  describe('createVote', () => {
    it('should create a valid upvote', () => {
      const voteData = {
        definitionId: mockDefinitionId,
        voteType: 'upvote'
      };

      const result = voteModel.createVote(voteData, mockUserId, mockDefinitionUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.voteType).toBe('upvote');
      expect(result.data.userId).toBe(mockUserId);
      expect(result.data.definitionId).toBe(mockDefinitionId);
    });

    it('should create a valid downvote', () => {
      const voteData = {
        definitionId: mockDefinitionId,
        voteType: 'downvote'
      };

      const result = voteModel.createVote(voteData, mockUserId, mockDefinitionUserId);

      expect(result.success).toBe(true);
      expect(result.data.voteType).toBe('downvote');
    });

    it('should prevent self-voting', () => {
      const voteData = {
        definitionId: mockDefinitionId,
        voteType: 'upvote'
      };

      const result = voteModel.createVote(voteData, mockUserId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(COMMUNITY_ERROR_CODES.SELF_VOTE);
    });

    it('should prevent duplicate votes of same type', () => {
      const voteData = {
        definitionId: mockDefinitionId,
        voteType: 'upvote'
      };

      // First vote should succeed
      const firstResult = voteModel.createVote(voteData, mockUserId, mockDefinitionUserId);
      expect(firstResult.success).toBe(true);

      // Second identical vote should fail
      const secondResult = voteModel.createVote(voteData, mockUserId, mockDefinitionUserId);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error.code).toBe(COMMUNITY_ERROR_CODES.DUPLICATE_VOTE);
    });

    it('should update vote when user changes vote type', () => {
      const upvoteData = {
        definitionId: mockDefinitionId,
        voteType: 'upvote'
      };

      const downvoteData = {
        definitionId: mockDefinitionId,
        voteType: 'downvote'
      };

      // Create upvote
      const upvoteResult = voteModel.createVote(upvoteData, mockUserId, mockDefinitionUserId);
      expect(upvoteResult.success).toBe(true);

      // Change to downvote
      const downvoteResult = voteModel.createVote(downvoteData, mockUserId, mockDefinitionUserId);
      expect(downvoteResult.success).toBe(true);
      expect(downvoteResult.data.voteType).toBe('downvote');

      // Should only have one vote for this user/definition
      const userVote = voteModel.getUserVoteForDefinition(mockUserId, mockDefinitionId);
      expect(userVote.voteType).toBe('downvote');
    });

    it('should reject invalid vote data', () => {
      const invalidVoteData = {
        definitionId: 'invalid-uuid',
        voteType: 'upvote'
      };

      const result = voteModel.createVote(invalidVoteData, mockUserId, mockDefinitionUserId);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(COMMUNITY_ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('getVoteSummary', () => {
    beforeEach(() => {
      // Set up some test votes
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'upvote' }, 'user1', mockDefinitionUserId);
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'upvote' }, 'user2', mockDefinitionUserId);
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'downvote' }, 'user3', mockDefinitionUserId);
    });

    it('should calculate correct vote summary', () => {
      const summary = voteModel.getVoteSummary(mockDefinitionId);

      expect(summary.upvotes).toBe(2);
      expect(summary.downvotes).toBe(1);
      expect(summary.score).toBe(1);
      expect(summary.userVote).toBeUndefined();
    });

    it('should include user vote when userId provided', () => {
      const summary = voteModel.getVoteSummary(mockDefinitionId, 'user1');

      expect(summary.upvotes).toBe(2);
      expect(summary.downvotes).toBe(1);
      expect(summary.score).toBe(1);
      expect(summary.userVote).toBe('upvote');
    });

    it('should return zero summary for definition with no votes', () => {
      const summary = voteModel.getVoteSummary('nonexistent-definition');

      expect(summary.upvotes).toBe(0);
      expect(summary.downvotes).toBe(0);
      expect(summary.score).toBe(0);
      expect(summary.userVote).toBeUndefined();
    });
  });

  describe('removeVote', () => {
    let voteId;

    beforeEach(() => {
      const result = voteModel.createVote(
        { definitionId: mockDefinitionId, voteType: 'upvote' },
        mockUserId,
        mockDefinitionUserId
      );
      voteId = result.data.id;
    });

    it('should remove vote successfully', () => {
      const result = voteModel.removeVote(voteId, mockUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      // Vote should no longer exist
      const userVote = voteModel.getUserVoteForDefinition(mockUserId, mockDefinitionId);
      expect(userVote).toBeUndefined();
    });

    it('should prevent removing other users votes', () => {
      const result = voteModel.removeVote(voteId, 'different-user');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(COMMUNITY_ERROR_CODES.FORBIDDEN);
    });

    it('should handle removing nonexistent vote', () => {
      const result = voteModel.removeVote('nonexistent-vote', mockUserId);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(COMMUNITY_ERROR_CODES.NOT_FOUND);
    });
  });

  describe('calculateScore', () => {
    it('should calculate positive score', () => {
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'upvote' }, 'user1', mockDefinitionUserId);
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'upvote' }, 'user2', mockDefinitionUserId);
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'downvote' }, 'user3', mockDefinitionUserId);

      const score = voteModel.calculateScore(mockDefinitionId);
      expect(score).toBe(1); // 2 upvotes - 1 downvote
    });

    it('should calculate negative score', () => {
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'upvote' }, 'user1', mockDefinitionUserId);
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'downvote' }, 'user2', mockDefinitionUserId);
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'downvote' }, 'user3', mockDefinitionUserId);

      const score = voteModel.calculateScore(mockDefinitionId);
      expect(score).toBe(-1); // 1 upvote - 2 downvotes
    });

    it('should return zero for no votes', () => {
      const score = voteModel.calculateScore('nonexistent-definition');
      expect(score).toBe(0);
    });
  });

  describe('getTopVotedDefinitions', () => {
    beforeEach(() => {
      // Create votes for multiple definitions
      voteModel.createVote({ definitionId: 'def1', voteType: 'upvote' }, 'user1', 'author1');
      voteModel.createVote({ definitionId: 'def1', voteType: 'upvote' }, 'user2', 'author1');
      voteModel.createVote({ definitionId: 'def1', voteType: 'upvote' }, 'user3', 'author1');

      voteModel.createVote({ definitionId: 'def2', voteType: 'upvote' }, 'user1', 'author2');
      voteModel.createVote({ definitionId: 'def2', voteType: 'downvote' }, 'user2', 'author2');

      voteModel.createVote({ definitionId: 'def3', voteType: 'downvote' }, 'user1', 'author3');
      voteModel.createVote({ definitionId: 'def3', voteType: 'downvote' }, 'user2', 'author3');
    });

    it('should return definitions sorted by score', () => {
      const topDefinitions = voteModel.getTopVotedDefinitions(3);

      expect(topDefinitions).toHaveLength(3);
      expect(topDefinitions[0]).toEqual({ definitionId: 'def1', score: 3 });
      expect(topDefinitions[1]).toEqual({ definitionId: 'def2', score: 0 });
      expect(topDefinitions[2]).toEqual({ definitionId: 'def3', score: -2 });
    });

    it('should respect limit parameter', () => {
      const topDefinitions = voteModel.getTopVotedDefinitions(2);

      expect(topDefinitions).toHaveLength(2);
      expect(topDefinitions[0].definitionId).toBe('def1');
      expect(topDefinitions[1].definitionId).toBe('def2');
    });
  });

  describe('getVotingStats', () => {
    beforeEach(() => {
      voteModel.createVote({ definitionId: 'def1', voteType: 'upvote' }, 'user1', 'author1');
      voteModel.createVote({ definitionId: 'def1', voteType: 'downvote' }, 'user2', 'author1');
      voteModel.createVote({ definitionId: 'def2', voteType: 'upvote' }, 'user1', 'author2');
    });

    it('should return correct voting statistics', () => {
      const stats = voteModel.getVotingStats();

      expect(stats.totalVotes).toBe(3);
      expect(stats.totalUpvotes).toBe(2);
      expect(stats.totalDownvotes).toBe(1);
      expect(stats.uniqueVoters).toBe(2); // user1 and user2
      expect(stats.definitionsWithVotes).toBe(2); // def1 and def2
    });
  });

  describe('rate limiting', () => {
    it('should count user votes correctly', () => {
      voteModel.createVote({ definitionId: 'def1', voteType: 'upvote' }, mockUserId, 'author1');
      voteModel.createVote({ definitionId: 'def2', voteType: 'downvote' }, mockUserId, 'author2');

      const voteCount = voteModel.getUserVoteCount(mockUserId);
      expect(voteCount).toBe(2);
    });

    it('should check vote limits correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const timeWindow = { start: oneHourAgo, end: now };

      // Create votes within time window
      voteModel.createVote({ definitionId: 'def1', voteType: 'upvote' }, mockUserId, 'author1');
      voteModel.createVote({ definitionId: 'def2', voteType: 'upvote' }, mockUserId, 'author2');

      const hasReachedLimit = voteModel.hasUserReachedVoteLimit(mockUserId, 2, timeWindow);
      expect(hasReachedLimit).toBe(true);

      const hasNotReachedLimit = voteModel.hasUserReachedVoteLimit(mockUserId, 5, timeWindow);
      expect(hasNotReachedLimit).toBe(false);
    });
  });

  describe('validateIntegrity', () => {
    it('should validate clean model integrity', () => {
      voteModel.createVote({ definitionId: mockDefinitionId, voteType: 'upvote' }, mockUserId, mockDefinitionUserId);

      const validation = voteModel.validateIntegrity();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});