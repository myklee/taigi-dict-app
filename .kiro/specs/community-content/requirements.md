# Requirements Document

## Introduction

This feature introduces a community-driven content system that allows users to contribute their own dictionary entries, definitions, and translations alongside the existing official dictionary sources (MOE, Mary Knoll, CC-CEDICT). Similar to platforms like Urban Dictionary, users can submit content that gets reviewed and voted on by the community, creating a dynamic, crowd-sourced supplement to the traditional dictionary data.

## Requirements

### Requirement 1

**User Story:** As a Taiwanese language learner, I want to contribute my own definitions and usage examples for words, so that I can share my knowledge with the community and help others learn colloquial or modern usage.

#### Acceptance Criteria

1. WHEN a logged-in user views a word entry THEN the system SHALL display an option to "Add Community Definition"
2. WHEN a user clicks "Add Community Definition" THEN the system SHALL present a form with fields for definition, usage example, tags, and context
3. WHEN a user submits a community definition THEN the system SHALL save it with pending status and notify the user of successful submission
4. IF a user is not logged in THEN the system SHALL prompt them to authenticate before allowing content submission

### Requirement 2

**User Story:** As a community member, I want to vote on community-contributed content, so that high-quality definitions rise to the top and low-quality content is filtered out.

#### Acceptance Criteria

1. WHEN a user views community definitions THEN the system SHALL display upvote and downvote buttons for each entry
2. WHEN a logged-in user clicks an upvote/downvote button THEN the system SHALL record their vote and update the score immediately
3. WHEN a user tries to vote on their own content THEN the system SHALL prevent the action and display an appropriate message
4. WHEN a user has already voted on content THEN the system SHALL highlight their previous vote and allow them to change it
5. IF a user is not logged in THEN the system SHALL show vote counts but disable voting buttons

### Requirement 3

**User Story:** As a user browsing dictionary entries, I want to see community definitions ranked by quality, so that I can quickly find the most helpful and accurate community contributions.

#### Acceptance Criteria

1. WHEN displaying community definitions THEN the system SHALL sort them by net vote score (upvotes minus downvotes) in descending order
2. WHEN community definitions have equal scores THEN the system SHALL sort by submission date with newest first
3. WHEN a community definition has a negative score below -5 THEN the system SHALL hide it by default with an option to "Show hidden content"
4. WHEN displaying search results THEN the system SHALL show official dictionary results first, followed by highly-rated community content (score > 5)

### Requirement 4

**User Story:** As a content moderator, I want to review and manage community submissions, so that I can ensure content quality and remove inappropriate submissions.

#### Acceptance Criteria

1. WHEN a user with moderator role accesses the admin panel THEN the system SHALL display a content moderation interface
2. WHEN viewing pending submissions THEN the system SHALL show all content awaiting approval with options to approve, reject, or request changes
3. WHEN a moderator approves content THEN the system SHALL make it visible to all users and notify the contributor
4. WHEN a moderator rejects content THEN the system SHALL hide it and send feedback to the contributor with rejection reason
5. WHEN content receives multiple community reports THEN the system SHALL flag it for moderator review

### Requirement 5

**User Story:** As a contributor, I want to track my submissions and see how the community responds, so that I can improve my contributions and build reputation.

#### Acceptance Criteria

1. WHEN a user accesses their profile THEN the system SHALL display their contribution history with submission status and vote counts
2. WHEN a user's content receives votes or comments THEN the system SHALL send them notifications (if enabled)
3. WHEN calculating user reputation THEN the system SHALL award points for approved submissions and positive votes received
4. WHEN a user reaches certain reputation milestones THEN the system SHALL unlock additional privileges (e.g., editing others' content)

### Requirement 6

**User Story:** As a user, I want to distinguish between official dictionary content and community contributions, so that I can understand the source and reliability of information.

#### Acceptance Criteria

1. WHEN displaying search results THEN the system SHALL clearly label official dictionary sources vs community content
2. WHEN showing community definitions THEN the system SHALL display contributor username, submission date, and vote score
3. WHEN community content appears in search results THEN the system SHALL use distinct visual styling (different background color, icon, or border)
4. WHEN a user hovers over community content THEN the system SHALL show a tooltip explaining the community-contributed nature

### Requirement 7

**User Story:** As a mobile user, I want to contribute and vote on community content from my phone, so that I can participate in the community while on the go.

#### Acceptance Criteria

1. WHEN accessing the app on mobile devices THEN the system SHALL provide touch-friendly voting buttons and forms
2. WHEN submitting content on mobile THEN the system SHALL optimize the form layout for small screens
3. WHEN viewing community content on mobile THEN the system SHALL maintain readability and usability of voting interface
4. WHEN using the mobile app offline THEN the system SHALL queue community actions for sync when connection is restored