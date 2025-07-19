# Admin Permissions Setup Guide

This guide will help you set up admin permissions in your Supabase database for the Taigi Dictionary community features.

## Prerequisites

- Supabase project set up and running
- Database access (via Supabase SQL Editor or direct connection)
- At least one user account created through Supabase Auth

## Setup Steps

### 1. Run the Community Content Schema

First, ensure the community content schema is set up:

```bash
# Run this in your Supabase SQL Editor
# File: community_content_schema.sql
```

This creates:
- User roles (`user`, `moderator`, `admin`)
- Community definitions and voting tables
- Basic RLS policies

### 2. Set Up Admin Permissions

Run the admin permissions setup:

```bash
# Run this in your Supabase SQL Editor
# File: admin_permissions_setup.sql
```

This adds:
- Admin-specific columns to user_profiles
- Admin activity logging
- Role management functions
- Enhanced RLS policies for admin access

### 3. Create Your First Super Admin

1. **First, sign up a user account** through your app's normal registration process
2. **Note the email address** you used
3. **Edit the create_initial_admin.sql file**:
   ```sql
   -- Change this line to your admin email:
   admin_email TEXT := 'your-admin-email@example.com';
   ```
4. **Run the script** in Supabase SQL Editor

### 4. Verify Admin Setup

Check if your admin was created successfully:

```sql
-- Check admin user
SELECT 
    id, 
    username, 
    role, 
    is_super_admin, 
    account_status,
    admin_permissions
FROM user_profiles 
WHERE role = 'admin';

-- Check admin activity log
SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 5;
```

## Admin Functions Available

### Role Management Functions

```sql
-- Promote user to admin (super admin only)
SELECT promote_to_admin(
    'user-uuid-here'::UUID,
    '{"can_manage_users": true, "can_manage_content": true}'::JSONB,
    'Promoted by initial setup'
);

-- Promote user to moderator (admin only)
SELECT promote_to_moderator(
    'user-uuid-here'::UUID,
    'Promoted to help with moderation'
);

-- Demote user to regular user (admin only)
SELECT demote_to_user(
    'user-uuid-here'::UUID,
    'Role no longer needed'
);
```

### User Management Functions

```sql
-- Suspend user account
SELECT suspend_user(
    'user-uuid-here'::UUID,
    'Violation of community guidelines',
    30 -- days (optional)
);

-- Reactivate user account
SELECT reactivate_user(
    'user-uuid-here'::UUID,
    'Appeal approved'
);
```

### Admin Dashboard Functions

```sql
-- Get dashboard statistics
SELECT get_admin_dashboard_stats();

-- Get user management list
SELECT get_user_management_list(
    'search term', -- optional
    'admin'::user_role, -- optional role filter
    'active', -- optional status filter
    50, -- limit
    0 -- offset
);
```

## Frontend Integration

The admin functions are already integrated into the community store. Use them like this:

```javascript
import { useCommunityStore } from '@/stores/communityStore'

const communityStore = useCommunityStore()

// Promote user to admin
const result = await communityStore.promoteToAdmin(
    userId, 
    { can_manage_users: true }, 
    'Promoted by admin'
)

// Get admin dashboard stats
const stats = await communityStore.getAdminDashboardStats()

// Get user management list
const users = await communityStore.getUserManagementList({
    searchTerm: 'john',
    roleFilter: 'user',
    statusFilter: 'active',
    limit: 20,
    offset: 0
})
```

## Security Features

### Row Level Security (RLS)
- Users can only see their own data by default
- Admins can see all user profiles and content
- Super admins have additional privileges

### Admin Activity Logging
- All admin actions are logged with timestamps
- Includes IP address and user agent (when available)
- Provides audit trail for accountability

### Role Hierarchy
- **User**: Basic community member
- **Moderator**: Can approve/reject content
- **Admin**: Can manage users and content
- **Super Admin**: Can promote other admins

### Permission Checks
- Functions validate user permissions before executing
- Database-level security prevents unauthorized access
- Client-side checks provide immediate feedback

## Troubleshooting

### Common Issues

1. **"User not found" error when creating admin**
   - Ensure the user has signed up through Supabase Auth first
   - Check the email address is correct in the script

2. **"Access denied" errors**
   - Verify RLS policies are enabled
   - Check user role in user_profiles table
   - Ensure user account is active

3. **Functions not working**
   - Verify all SQL scripts ran successfully
   - Check for any error messages in Supabase logs
   - Ensure proper permissions are granted

### Checking User Permissions

```sql
-- Check if user is admin
SELECT is_admin('user-uuid-here'::UUID);

-- Check if user is super admin
SELECT is_super_admin('user-uuid-here'::UUID);

-- Check if user can moderate
SELECT is_moderator_or_admin('user-uuid-here'::UUID);
```

## Next Steps

1. **Test the admin functions** with your super admin account
2. **Create additional moderators** as needed
3. **Set up monitoring** for admin activity logs
4. **Configure backup procedures** for user data
5. **Document your admin procedures** for your team

## Security Best Practices

- Regularly review admin activity logs
- Use strong passwords for admin accounts
- Enable 2FA for admin accounts in Supabase
- Limit the number of super admin accounts
- Regularly audit user roles and permissions
- Keep admin permissions documentation up to date

## Support

If you encounter issues:
1. Check the Supabase logs for error details
2. Verify all SQL scripts executed successfully
3. Test with a simple user promotion first
4. Review the RLS policies if access is denied