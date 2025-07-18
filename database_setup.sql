-- Database Setup Script for Taigi Dictionary App
-- Run this in your Supabase SQL Editor

-- 1. Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_profiles table for additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_sessions table for tracking user activity
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create user_favorites table for saving favorite words
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- 5. Create user_notes table for personal notes on words
CREATE TABLE IF NOT EXISTS user_notes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create user_study_lists table for creating study lists
CREATE TABLE IF NOT EXISTS user_study_lists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create study_list_items table for words in study lists
CREATE TABLE IF NOT EXISTS study_list_items (
  id BIGSERIAL PRIMARY KEY,
  study_list_id BIGINT REFERENCES user_study_lists(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(study_list_id, word_id)
);

-- 8. Create user_learning_progress table for tracking learning progress
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL,
  mastery_level INTEGER DEFAULT 0, -- 0-5 scale
  review_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- search_history policies
DROP POLICY IF EXISTS "Users can view their own search history" ON search_history;
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own search history" ON search_history;
CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own search history" ON search_history;
CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING (auth.uid() = user_id);

-- user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_sessions policies
DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- user_favorites policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own favorites" ON user_favorites;
CREATE POLICY "Users can manage their own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- user_notes policies
DROP POLICY IF EXISTS "Users can view their own notes" ON user_notes;
CREATE POLICY "Users can view their own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notes" ON user_notes;
CREATE POLICY "Users can manage their own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id);

-- user_study_lists policies
DROP POLICY IF EXISTS "Users can view their own study lists" ON user_study_lists;
CREATE POLICY "Users can view their own study lists" ON user_study_lists
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public study lists" ON user_study_lists;
CREATE POLICY "Users can view public study lists" ON user_study_lists
  FOR SELECT USING (is_public = TRUE);

DROP POLICY IF EXISTS "Users can manage their own study lists" ON user_study_lists;
CREATE POLICY "Users can manage their own study lists" ON user_study_lists
  FOR ALL USING (auth.uid() = user_id);

-- study_list_items policies
DROP POLICY IF EXISTS "Users can view items in their study lists" ON study_list_items;
CREATE POLICY "Users can view items in their study lists" ON study_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_study_lists 
      WHERE user_study_lists.id = study_list_items.study_list_id 
      AND user_study_lists.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view items in public study lists" ON study_list_items;
CREATE POLICY "Users can view items in public study lists" ON study_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_study_lists 
      WHERE user_study_lists.id = study_list_items.study_list_id 
      AND user_study_lists.is_public = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can manage items in their study lists" ON study_list_items;
CREATE POLICY "Users can manage items in their study lists" ON study_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_study_lists 
      WHERE user_study_lists.id = study_list_items.study_list_id 
      AND user_study_lists.user_id = auth.uid()
    )
  );

-- user_learning_progress policies
DROP POLICY IF EXISTS "Users can view their own learning progress" ON user_learning_progress;
CREATE POLICY "Users can view their own learning progress" ON user_learning_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own learning progress" ON user_learning_progress;
CREATE POLICY "Users can manage their own learning progress" ON user_learning_progress
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_word_id ON user_favorites(word_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_word_id ON user_notes(word_id);
CREATE INDEX IF NOT EXISTS idx_user_study_lists_user_id ON user_study_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_study_list_items_study_list_id ON study_list_items(study_list_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_word_id ON user_learning_progress(word_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notes_updated_at ON user_notes;
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_study_lists_updated_at ON user_study_lists;
CREATE TRIGGER update_user_study_lists_updated_at
  BEFORE UPDATE ON user_study_lists
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_learning_progress_updated_at ON user_learning_progress;
CREATE TRIGGER update_user_learning_progress_updated_at
  BEFORE UPDATE ON user_learning_progress
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create some helpful views
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT sh.id) as total_searches,
  COUNT(DISTINCT uf.id) as total_favorites,
  COUNT(DISTINCT un.id) as total_notes,
  COUNT(DISTINCT usl.id) as total_study_lists,
  COUNT(DISTINCT ulp.id) as total_learning_words,
  AVG(ulp.mastery_level) as avg_mastery_level
FROM auth.users u
LEFT JOIN search_history sh ON u.id = sh.user_id
LEFT JOIN user_favorites uf ON u.id = uf.user_id
LEFT JOIN user_notes un ON u.id = un.user_id
LEFT JOIN user_study_lists usl ON u.id = usl.user_id
LEFT JOIN user_learning_progress ulp ON u.id = ulp.user_id
GROUP BY u.id;

-- Grant access to the view
GRANT SELECT ON user_dashboard_stats TO anon, authenticated; 