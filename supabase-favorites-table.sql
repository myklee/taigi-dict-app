-- SQL script to create the favorites table in Supabase
-- Run this in the Supabase SQL editor

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL,
    word_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_word_id ON favorites(word_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_word ON favorites(user_id, word_id);

-- Enable Row Level Security (RLS)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Users can update their own favorites (if needed)
CREATE POLICY "Users can update their own favorites" ON favorites
    FOR UPDATE USING (auth.uid() = user_id);

-- Add a unique constraint to prevent duplicate favorites per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique_user_word 
ON favorites(user_id, word_id);