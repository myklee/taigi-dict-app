-- Community Content Database Schema
-- This file contains the SQL schema for the community-driven content system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE content_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

-- Extend existing user_profiles table with community features
-- Note: user_profiles table already exists, we're adding new columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS contribution_count INTEGER DEFAULT 0;

-- Create index on username for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Community definitions table
CREATE TABLE community_definitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    word_id TEXT NOT NULL, -- References the original dictionary word
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    definition TEXT NOT NULL,
    usage_example TEXT,
    tags TEXT[] DEFAULT '{}',
    context TEXT,
    status content_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moderator_notes TEXT,
    moderator_id UUID REFERENCES auth.users(id)
);

-- Community votes table
CREATE TABLE community_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    definition_id UUID REFERENCES community_definitions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(definition_id, user_id)
);

-- Content reports table
CREATE TABLE content_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    definition_id UUID REFERENCES community_definitions(id) ON DELETE CASCADE NOT NULL,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_community_definitions_word_id ON community_definitions(word_id);
CREATE INDEX idx_community_definitions_user_id ON community_definitions(user_id);
CREATE INDEX idx_community_definitions_status ON community_definitions(status);
CREATE INDEX idx_community_definitions_created_at ON community_definitions(created_at);
CREATE INDEX idx_community_votes_definition_id ON community_votes(definition_id);
CREATE INDEX idx_community_votes_user_id ON community_votes(user_id);
CREATE INDEX idx_content_reports_definition_id ON content_reports(definition_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);

-- Create a function to calculate vote scores
CREATE OR REPLACE FUNCTION calculate_vote_score(definition_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    upvotes INTEGER;
    downvotes INTEGER;
BEGIN
    SELECT COUNT(*) INTO upvotes 
    FROM community_votes 
    WHERE definition_id = definition_uuid AND vote_type = 'upvote';
    
    SELECT COUNT(*) INTO downvotes 
    FROM community_votes 
    WHERE definition_id = definition_uuid AND vote_type = 'downvote';
    
    RETURN upvotes - downvotes;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update reputation based on votes received on user's definitions
    UPDATE user_profiles 
    SET reputation_score = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN cv.vote_type = 'upvote' THEN 1
                WHEN cv.vote_type = 'downvote' THEN -1
                ELSE 0
            END
        ), 0)
        FROM community_definitions cd
        JOIN community_votes cv ON cd.id = cv.definition_id
        WHERE cd.user_id = user_profiles.id
    ),
    contribution_count = (
        SELECT COUNT(*)
        FROM community_definitions
        WHERE user_id = user_profiles.id AND status = 'approved'
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic reputation updates
CREATE TRIGGER trigger_update_reputation_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON community_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reputation();

CREATE TRIGGER trigger_update_reputation_on_definition_status
    AFTER UPDATE OF status ON community_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_reputation();

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_community_definitions_updated_at ON community_definitions;
CREATE TRIGGER trigger_update_community_definitions_updated_at
    BEFORE UPDATE ON community_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- User profiles policies (note: existing table uses 'id' not 'user_id')
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Community definitions policies
CREATE POLICY "Anyone can view approved definitions" ON community_definitions
    FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert definitions" ON community_definitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own definitions" ON community_definitions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Moderators can update any definition" ON community_definitions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- Community votes policies
CREATE POLICY "Users can view votes on approved definitions" ON community_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_definitions 
            WHERE id = definition_id 
            AND (status = 'approved' OR user_id = auth.uid())
        )
    );

CREATE POLICY "Authenticated users can vote" ON community_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON community_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON community_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Content reports policies
CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports" ON content_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

CREATE POLICY "Authenticated users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can update reports" ON content_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- Create a view for community definitions with vote scores and user info
CREATE VIEW community_definitions_with_scores AS
SELECT 
    cd.*,
    up.username,
    up.reputation_score as author_reputation,
    calculate_vote_score(cd.id) as vote_score,
    (
        SELECT COUNT(*) 
        FROM community_votes cv 
        WHERE cv.definition_id = cd.id AND cv.vote_type = 'upvote'
    ) as upvotes,
    (
        SELECT COUNT(*) 
        FROM community_votes cv 
        WHERE cv.definition_id = cd.id AND cv.vote_type = 'downvote'
    ) as downvotes
FROM community_definitions cd
JOIN user_profiles up ON cd.user_id = up.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert some sample data for testing (optional)
-- This would typically be done separately or through the application

COMMENT ON TABLE user_profiles IS 'Extended user profile information for community features';
COMMENT ON TABLE community_definitions IS 'User-contributed dictionary definitions and examples';
COMMENT ON TABLE community_votes IS 'Voting system for community content quality control';
COMMENT ON TABLE content_reports IS 'User reports for inappropriate or incorrect content';
COMMENT ON VIEW community_definitions_with_scores IS 'Community definitions with calculated vote scores and author info';