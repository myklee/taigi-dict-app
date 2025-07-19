-- Create Initial Super Admin User
-- This script should be run after a user has signed up through Supabase Auth
-- Replace the email with the actual admin user's email

-- IMPORTANT: Replace 'admin@example.com' with the actual admin user's email
-- This user must already exist in auth.users (they must have signed up first)

DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'myklee@gmail.com'; -- CHANGE THIS TO YOUR ADMIN EMAIL
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Please ensure the user has signed up first.', admin_email;
    END IF;
    
    -- Insert or update the user profile to make them a super admin
    INSERT INTO user_profiles (
        id, 
        username, 
        role, 
        is_super_admin, 
        account_status,
        reputation_score,
        contribution_count,
        admin_permissions,
        notes,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'admin', -- You can change this username
        'admin',
        TRUE,
        'active',
        1000, -- Give them a high reputation score
        0,
        jsonb_build_object(
            'can_manage_users', true,
            'can_manage_content', true,
            'can_view_reports', true,
            'can_manage_system', true,
            'can_promote_admins', true
        ),
        'Initial super administrator account',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        is_super_admin = TRUE,
        account_status = 'active',
        admin_permissions = jsonb_build_object(
            'can_manage_users', true,
            'can_manage_content', true,
            'can_view_reports', true,
            'can_manage_system', true,
            'can_promote_admins', true
        ),
        notes = 'Initial super administrator account',
        updated_at = NOW();
    
    -- Log the creation
    INSERT INTO admin_activity_log (
        admin_id,
        action,
        target_user_id,
        target_resource_type,
        details
    ) VALUES (
        admin_user_id,
        'create_super_admin',
        admin_user_id,
        'user',
        jsonb_build_object(
            'method', 'initial_setup',
            'email', admin_email
        )
    );
    
    RAISE NOTICE 'Super admin user created successfully for email: %', admin_email;
    RAISE NOTICE 'User ID: %', admin_user_id;
END $$;