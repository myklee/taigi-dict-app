// Vote Model with Business Logic
// Handles voting operations, score calculations, and business rules

import type { 
  Vote, 
  CreateVote, 
  VoteType, 
  VoteSummary,
  CommunityError,
  ApiResponse 
} from '@/types/community';
import { COMMUNITY_ERROR_CODES } from '@/types/community';
import { validateCreateVote, canUserVote } from '@/utils/communityValidation';

export class VoteModel {
  private votes: Map<string, Vote> = new Map();
  private userVotes: Map<string, Map<string, Vote>> = new Map(); // userId -> definitionId -> Vote
  private definitionVotes: Map<string, Vote[]> = new Map(); // definitionId -> Vote[]

  constructor(initialVotes: Vote[] = []) {
    this.loadVotes(initialVotes);
  }

  /**
   * Load votes into the model
   */
  private loadVotes(votes: Vote[]): void {
    this.votes.clear();
    this.userVotes.clear();
    this.definitionVotes.clear();

    for (const vote of votes) {
      this.addVoteToMaps(vote);
    }
  }

  /**
   * Add a vote to internal maps for efficient lookups
   */
  private addVoteToMaps(vote: Vote): void {
    this.votes.set(vote.id, vote);

    // Add to user votes map
    if (!this.userVotes.has(vote.userId)) {
      this.userVotes.set(vote.userId, new Map());
    }
    this.userVotes.get(vote.userId)!.set(vote.definitionId, vote);

    // Add to definition votes map
    if (!this.definitionVotes.has(vote.definitionId)) {
      this.definitionVotes.set(vote.definitionId, []);
    }
    this.definitionVotes.get(vote.definitionId)!.push(vote);
  }

  /**
   * Remove a vote from internal maps
   */
  private removeVoteFromMaps(vote: Vote): void {
    this.votes.delete(vote.id);

    // Remove from user votes map
    const userVotesMap = this.userVotes.get(vote.userId);
    if (userVotesMap) {
      userVotesMap.delete(vote.definitionId);
      if (userVotesMap.size === 0) {
        this.userVotes.delete(vote.userId);
      }
    }

    // Remove from definition votes map
    const definitionVotesArray = this.definitionVotes.get(vote.definitionId);
    if (definitionVotesArray) {
      const index = definitionVotesArray.findIndex(v => v.id === vote.id);
      if (index !== -1) {
        definitionVotesArray.splice(index, 1);
      }
      if (definitionVotesArray.length === 0) {
        this.definitionVotes.delete(vote.definitionId);
      }
    }
  }

  /**
   * Create a new vote with validation and business rule checks
   */
  createVote(
    voteData: CreateVote, 
    userId: string, 
    definitionUserId: string
  ): ApiResponse<Vote> {
    try {
      // Validate input data
      const validatedData = validateCreateVote(voteData);

      // Check if user can vote (prevent self-voting)
      if (!canUserVote(userId, definitionUserId)) {
        return {
          success: false,
          error: {
            code: COMMUNITY_ERROR_CODES.SELF_VOTE,
            message: 'You cannot vote on your own content'
          }
        };
      }

      // Check for existing vote
      const existingVote = this.getUserVoteForDefinition(userId, validatedData.definitionId);
      if (existingVote) {
        // If same vote type, return error
        if (existingVote.voteType === validatedData.voteType) {
          return {
            success: false,
            error: {
              code: COMMUNITY_ERROR_CODES.DUPLICATE_VOTE,
              message: 'You have already cast this vote'
            }
          };
        }
        
        // If different vote type, update existing vote
        return this.updateVote(existingVote.id, validatedData.voteType);
      }

      // Create new vote
      const newVote: Vote = {
        id: this.generateVoteId(),
        definitionId: validatedData.definitionId,
        userId: userId,
        voteType: validatedData.voteType,
        createdAt: new Date()
      };

      this.addVoteToMaps(newVote);

      return {
        success: true,
        data: newVote
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.VALIDATION_ERROR,
          message: error instanceof Error ? error.message : 'Validation failed'
        }
      };
    }
  }

  /**
   * Update an existing vote
   */
  updateVote(voteId: string, newVoteType: VoteType): ApiResponse<Vote> {
    const existingVote = this.votes.get(voteId);
    if (!existingVote) {
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.NOT_FOUND,
          message: 'Vote not found'
        }
      };
    }

    // Remove old vote from maps
    this.removeVoteFromMaps(existingVote);

    // Create updated vote
    const updatedVote: Vote = {
      ...existingVote,
      voteType: newVoteType,
      createdAt: new Date() // Update timestamp for vote changes
    };

    // Add updated vote to maps
    this.addVoteToMaps(updatedVote);

    return {
      success: true,
      data: updatedVote
    };
  }

  /**
   * Remove a vote
   */
  removeVote(voteId: string, userId: string): ApiResponse<boolean> {
    const vote = this.votes.get(voteId);
    if (!vote) {
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.NOT_FOUND,
          message: 'Vote not found'
        }
      };
    }

    // Check if user owns the vote
    if (vote.userId !== userId) {
      return {
        success: false,
        error: {
          code: COMMUNITY_ERROR_CODES.FORBIDDEN,
          message: 'You can only remove your own votes'
        }
      };
    }

    this.removeVoteFromMaps(vote);

    return {
      success: true,
      data: true
    };
  }

  /**
   * Get vote summary for a definition
   */
  getVoteSummary(definitionId: string, userId?: string): VoteSummary {
    const votes = this.definitionVotes.get(definitionId) || [];
    
    const upvotes = votes.filter(v => v.voteType === 'upvote').length;
    const downvotes = votes.filter(v => v.voteType === 'downvote').length;
    const score = upvotes - downvotes;

    let userVote: VoteType | undefined;
    if (userId) {
      const userVoteObj = this.getUserVoteForDefinition(userId, definitionId);
      userVote = userVoteObj?.voteType;
    }

    return {
      upvotes,
      downvotes,
      score,
      userVote
    };
  }

  /**
   * Get all votes for a definition
   */
  getVotesForDefinition(definitionId: string): Vote[] {
    return this.definitionVotes.get(definitionId) || [];
  }

  /**
   * Get all votes by a user
   */
  getVotesByUser(userId: string): Vote[] {
    const userVotesMap = this.userVotes.get(userId);
    if (!userVotesMap) return [];
    
    return Array.from(userVotesMap.values());
  }

  /**
   * Get user's vote for a specific definition
   */
  getUserVoteForDefinition(userId: string, definitionId: string): Vote | undefined {
    return this.userVotes.get(userId)?.get(definitionId);
  }

  /**
   * Calculate vote score for a definition
   */
  calculateScore(definitionId: string): number {
    const votes = this.definitionVotes.get(definitionId) || [];
    const upvotes = votes.filter(v => v.voteType === 'upvote').length;
    const downvotes = votes.filter(v => v.voteType === 'downvote').length;
    return upvotes - downvotes;
  }

  /**
   * Get top-voted definitions
   */
  getTopVotedDefinitions(limit: number = 10): Array<{ definitionId: string; score: number }> {
    const definitionScores = Array.from(this.definitionVotes.keys()).map(definitionId => ({
      definitionId,
      score: this.calculateScore(definitionId)
    }));

    return definitionScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get voting statistics
   */
  getVotingStats(): {
    totalVotes: number;
    totalUpvotes: number;
    totalDownvotes: number;
    uniqueVoters: number;
    definitionsWithVotes: number;
  } {
    const allVotes = Array.from(this.votes.values());
    const uniqueVoters = new Set(allVotes.map(v => v.userId)).size;
    const definitionsWithVotes = this.definitionVotes.size;

    return {
      totalVotes: allVotes.length,
      totalUpvotes: allVotes.filter(v => v.voteType === 'upvote').length,
      totalDownvotes: allVotes.filter(v => v.voteType === 'downvote').length,
      uniqueVoters,
      definitionsWithVotes
    };
  }

  /**
   * Validate vote integrity (for debugging/testing)
   */
  validateIntegrity(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that all votes in maps exist in main votes map
    for (const [userId, userVotesMap] of this.userVotes) {
      for (const [definitionId, vote] of userVotesMap) {
        if (!this.votes.has(vote.id)) {
          errors.push(`Vote ${vote.id} in user map but not in main map`);
        }
        if (vote.userId !== userId) {
          errors.push(`Vote ${vote.id} has incorrect userId in user map`);
        }
        if (vote.definitionId !== definitionId) {
          errors.push(`Vote ${vote.id} has incorrect definitionId in user map`);
        }
      }
    }

    // Check that all votes in definition maps exist in main votes map
    for (const [definitionId, votes] of this.definitionVotes) {
      for (const vote of votes) {
        if (!this.votes.has(vote.id)) {
          errors.push(`Vote ${vote.id} in definition map but not in main map`);
        }
        if (vote.definitionId !== definitionId) {
          errors.push(`Vote ${vote.id} has incorrect definitionId in definition map`);
        }
      }
    }

    // Check for duplicate votes by same user on same definition
    for (const [userId, userVotesMap] of this.userVotes) {
      const definitionIds = Array.from(userVotesMap.keys());
      const uniqueDefinitionIds = new Set(definitionIds);
      if (definitionIds.length !== uniqueDefinitionIds.size) {
        errors.push(`User ${userId} has duplicate votes on same definition`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a unique vote ID (in real implementation, this would be handled by the database)
   */
  private generateVoteId(): string {
    return `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export all votes (for persistence)
   */
  exportVotes(): Vote[] {
    return Array.from(this.votes.values());
  }

  /**
   * Get vote count for a user (for rate limiting)
   */
  getUserVoteCount(userId: string, timeWindow?: { start: Date; end: Date }): number {
    const userVotes = this.getVotesByUser(userId);
    
    if (!timeWindow) {
      return userVotes.length;
    }

    return userVotes.filter(vote => 
      vote.createdAt >= timeWindow.start && vote.createdAt <= timeWindow.end
    ).length;
  }

  /**
   * Check if user has reached vote limit (for rate limiting)
   */
  hasUserReachedVoteLimit(
    userId: string, 
    limit: number, 
    timeWindow: { start: Date; end: Date }
  ): boolean {
    const voteCount = this.getUserVoteCount(userId, timeWindow);
    return voteCount >= limit;
  }
}