# Admin Dashboard Troubleshooting Guide

## Current Issue: Column Reference "created_at" is Ambiguous

### ✅ **Issue Fixed**
The SQL function `get_admin_dashboard_stats` has been updated to fix the ambiguous column reference error. The issue was in the `recent_activity` subquery where both `admin_activity_log` and `user_profiles` tables have a `created_at` column.

### 🔧 **Solution Applied**
Updated the function to use proper table aliases:
```sql
-- Before (causing error):
'created_at', created_at,

-- After (fixed):
'created_at', aal.created_at,
```

## 🚀 **Steps to Fix**

### 1. **Update Database Function**
Run the updated `admin_permissions_setup.sql` script in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire updated `admin_permissions_setup.sql` content
4. Click "Run" to execute the script

### 2. **Verify the Fix**
After running the script, test the admin dashboard:

1. Login as an admin user
2. Click "Admin Dashboard" in the header
3. The dashboard should now load without errors

## 🔍 **Additional Troubleshooting Steps**

### If you still get errors, check these:

#### **1. Database Tables Exist**
Verify these tables exist in your Supabase database:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 
    'community_definitions', 
    'community_votes', 
    'content_reports', 
    'admin_activity_log'
);
```

#### **2. User Profile Setup**
Make sure your user has a profile in the `user_profiles` table:
```sql
-- Check your user profile
SELECT * FROM user_profiles WHERE id = auth.uid();
```

#### **3. Admin Role Assignment**
Verify your user has admin or moderator role:
```sql
-- Check user role
SELECT id, username, role, account_status 
FROM user_profiles 
WHERE id = auth.uid();
```

#### **4. Function Permissions**
Ensure the function has proper permissions:
```sql
-- Check function exists and has permissions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_admin_dashboard_stats';
```

## 🛠️ **Common Issues and Solutions**

### **Issue: "Access denied" error**
**Solution:** User doesn't have admin/moderator role
```sql
-- Fix: Update user role
UPDATE user_profiles 
SET role = 'admin', account_status = 'active' 
WHERE id = 'your-user-id-here';
```

### **Issue: "Function does not exist" error**
**Solution:** Admin functions not created
- Re-run the `admin_permissions_setup.sql` script
- Check for any SQL errors during execution

### **Issue: "User profile not found" error**
**Solution:** User profile doesn't exist
```sql
-- Fix: Create user profile
INSERT INTO user_profiles (id, username, role, account_status)
VALUES (auth.uid(), 'admin', 'admin', 'active');
```

### **Issue: Empty dashboard stats**
**Solution:** No data in tables yet
- This is normal for new installations
- Stats will populate as users create content

## 📋 **Quick Setup Checklist**

- [ ] Run `community_content_schema.sql`
- [ ] Run updated `admin_permissions_setup.sql`
- [ ] Create admin user with `create_initial_admin.sql`
- [ ] Verify user profile exists and has admin role
- [ ] Test admin dashboard access
- [ ] Check browser console for any remaining errors

## 🔧 **Manual Admin User Creation**

If the automatic scripts don't work, create an admin user manually:

```sql
-- 1. First, sign up through your app's normal registration
-- 2. Then run this SQL (replace email with your actual email):

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'your-email@example.com';
    
    -- Create or update user profile
    INSERT INTO user_profiles (
        id, username, role, is_super_admin, 
        account_status, reputation_score
    ) VALUES (
        admin_user_id, 'admin', 'admin', TRUE, 
        'active', 1000
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        is_super_admin = TRUE,
        account_status = 'active';
        
    RAISE NOTICE 'Admin user created: %', admin_user_id;
END $$;
```

## 🚨 **Emergency Reset**

If everything breaks, you can reset the admin system:

```sql
-- WARNING: This will remove all admin data
DROP FUNCTION IF EXISTS get_admin_dashboard_stats();
DROP FUNCTION IF EXISTS get_user_management_list(TEXT, user_role, TEXT, INTEGER, INTEGER);
DROP TABLE IF EXISTS admin_activity_log;

-- Then re-run the setup scripts
```

## 📞 **Getting Help**

If you're still having issues:

1. **Check Supabase Logs**: Go to Supabase Dashboard → Logs → API
2. **Browser Console**: Check for JavaScript errors
3. **Network Tab**: Look for failed API requests
4. **Database Logs**: Check for SQL errors in Supabase

## ✅ **Success Indicators**

You'll know it's working when:
- Admin dashboard loads without errors
- User statistics display correctly
- No console errors in browser
- Admin navigation button appears for admin users
- User management panel loads user list

The fix should resolve the "column reference 'created_at' is ambiguous" error. After running the updated SQL script, your admin dashboard should work properly!