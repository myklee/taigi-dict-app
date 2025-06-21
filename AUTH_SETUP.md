# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for your Taigi Dictionary App.

## Prerequisites

1. A Supabase project (you already have one)
2. Your Supabase URL and anon key (already configured in `src/supabase.js`)

## Supabase Dashboard Configuration

### 1. Enable Authentication Providers

1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable the following providers:

#### Email Authentication
- ✅ Enable email confirmations (recommended for production)
- ✅ Enable secure email change
- ✅ Enable double confirm changes

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy Client ID and Client Secret
7. In Supabase, enable Google provider and add the credentials

### 2. Configure Email Templates

1. Go to **Authentication** > **Email Templates**
2. Customize the following templates:
   - **Confirm signup**
   - **Reset password**
   - **Change email address**

### 3. Set Up Row Level Security (RLS)

Create policies for your tables to secure user data:

```sql
-- Enable RLS on tables
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all words" ON words
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all definitions" ON definitions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own search history" ON search_history
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Create User Profiles Table (Optional)

```sql
-- Create a profiles table to store additional user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Update `src/supabase.js` to use environment variables:

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Features Included

### 1. Authentication Store (`src/stores/authStore.js`)
- User state management
- Session handling
- Authentication methods (sign in, sign up, sign out)
- Google OAuth support
- Password reset functionality
- Profile updates

### 2. Authentication Components

#### AuthModal (`src/components/auth/AuthModal.vue`)
- Sign in form
- Sign up form
- Password reset form
- Google OAuth button
- Error handling and success messages

#### UserProfile (`src/components/auth/UserProfile.vue`)
- User information display
- Profile update functionality
- Password change functionality
- Sign out option

#### AuthHeader (`src/components/auth/AuthHeader.vue`)
- Authentication status display
- Sign in button for unauthenticated users
- User menu for authenticated users

#### AuthGuard (`src/components/auth/AuthGuard.vue`)
- Route protection
- Conditional content rendering
- Fallback UI for unauthenticated users

### 3. Authentication Composable (`src/composables/useAuth.js`)
- Reactive authentication state
- User metadata helpers
- Permission and role checking
- Session management utilities

## Usage Examples

### Protecting Routes/Components

```vue
<template>
  <AuthGuard require-auth>
    <div>This content is only visible to authenticated users</div>
  </AuthGuard>
</template>
```

### Using Authentication in Components

```vue
<script setup>
import { useAuth } from '@/composables/useAuth';

const { user, isAuthenticated, signIn, signOut } = useAuth();
</script>

<template>
  <div v-if="isAuthenticated">
    Welcome, {{ user.email }}!
    <button @click="signOut">Sign Out</button>
  </div>
  <div v-else>
    <button @click="signIn('user@example.com', 'password')">Sign In</button>
  </div>
</template>
```

### Checking Permissions

```vue
<script setup>
import { useAuth } from '@/composables/useAuth';

const { hasPermission, hasRole } = useAuth();

// Check specific permissions
const canEditWords = hasPermission('edit:words');

// Check roles
const isAdmin = hasRole('admin');
</script>
```

## Security Considerations

1. **Environment Variables**: Never commit your Supabase keys to version control
2. **Row Level Security**: Always enable RLS on your tables
3. **Input Validation**: Validate all user inputs on both client and server
4. **HTTPS**: Use HTTPS in production
5. **Session Management**: Implement proper session handling
6. **Rate Limiting**: Consider implementing rate limiting for auth endpoints

## Testing Authentication

1. **Sign Up**: Test user registration with email confirmation
2. **Sign In**: Test email/password authentication
3. **Google OAuth**: Test Google sign-in (if enabled)
4. **Password Reset**: Test password reset functionality
5. **Profile Updates**: Test user profile management
6. **Sign Out**: Test session termination

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your domain is added to Supabase allowed origins
2. **Email Not Sending**: Check Supabase email settings and SMTP configuration
3. **Google OAuth Not Working**: Verify Google Cloud Console settings
4. **Session Not Persisting**: Check browser storage and cookie settings

### Debug Mode

Enable debug logging in your Supabase client:

```javascript
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    debug: true
  }
});
```

## Next Steps

1. **Customize UI**: Modify the authentication components to match your app's design
2. **Add More Providers**: Implement additional OAuth providers (GitHub, Facebook, etc.)
3. **User Roles**: Implement role-based access control
4. **Analytics**: Add authentication event tracking
5. **Testing**: Write unit and integration tests for authentication flows

## Support

For Supabase-specific issues, refer to the [Supabase Documentation](https://supabase.com/docs). 