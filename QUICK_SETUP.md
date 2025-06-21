# Quick Setup Guide - Fix Database Error

## The Problem
You're getting this error: `ERROR: 42P01: relation "search_history" does not exist`

This happens because the authentication system is trying to access tables that don't exist in your Supabase database yet.

## Quick Fix

### Step 1: Run the Essential SQL Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `essential_tables.sql` into the editor
4. Click **Run** to execute the script

This will create:
- `search_history` table (fixes the immediate error)
- `user_profiles` table (for user information)
- Row Level Security (RLS) policies
- Automatic user profile creation on signup

### Step 2: Verify the Tables Were Created

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the new tables:
   - `search_history`
   - `user_profiles`

### Step 3: Test the Authentication

1. Start your development server: `npm run dev`
2. Try signing up with a new account
3. Check that the authentication works without errors

## What the Script Does

The `essential_tables.sql` script:

1. **Creates the missing `search_history` table** - This fixes your immediate error
2. **Sets up user profiles** - Stores additional user information
3. **Enables Row Level Security** - Ensures users can only access their own data
4. **Creates automatic triggers** - Creates user profiles when users sign up
5. **Sets up proper permissions** - Allows authenticated users to access the tables

## If You Want the Full Feature Set

If you want all the additional features (favorites, notes, study lists, etc.), you can also run the `database_setup.sql` script, which includes:

- User favorites
- Personal notes on words
- Study lists
- Learning progress tracking
- Dashboard statistics

## Troubleshooting

### Still Getting Errors?

1. **Check the SQL Editor** - Make sure the script ran successfully
2. **Check Table Editor** - Verify the tables exist
3. **Check RLS Policies** - Go to Authentication > Policies to see if policies were created
4. **Restart your app** - Sometimes you need to restart the dev server

### Common Issues

1. **Permission Denied** - Make sure you're using the correct Supabase project
2. **Table Already Exists** - The script uses `IF NOT EXISTS` so it's safe to run multiple times
3. **RLS Policy Errors** - Check that the policies were created correctly

## Next Steps

Once the basic tables are working:

1. **Test authentication** - Sign up and sign in
2. **Test search history** - Search for words and check if history is saved
3. **Customize the UI** - Modify the auth components to match your design
4. **Add more features** - Implement favorites, notes, etc.

## Need Help?

If you're still having issues:

1. Check the browser console for specific error messages
2. Verify your Supabase URL and key are correct in `src/supabase.js`
3. Make sure you're running the latest version of the code 