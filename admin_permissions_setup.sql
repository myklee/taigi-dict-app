-- Admin Permissions Setup for Supabase
-- This script sets up admin permissions and role management functions

-- First, ensure the user_profiles table has all necessary columns
-- (This should already be done by community_content_schema.sql, but we'll make sure)

-- Add admin-specific columns if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_status ON user_profiles(role, account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_super_admin ON user_profiles(is_super_admin) WHERE is_super_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login);

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_resource_type TEXT, -- 'user', 'definition', 'report', etc.
    target_resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target_user ON admin_activity_log(target_user_id);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id 
        AND role IN ('admin') 
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id 
        AND role = 'admin' 
        AND is_super_admin = TRUE 
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION is_moderator_or_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id 
        AND role IN ('moderator', 'admin') 
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin (only super admins can do this)
CREATE OR REPLACE FUNCTION promote_to_admin(
    target_user_id UUID,
    admin_permissions JSONB DEFAULT '{}',
    notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_admin_id UUID := auth.uid();
    result JSONB;
BEGIN
    -- Check if current user is super admin
    IF NOT is_super_admin(current_admin_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only super administrators can promote users to admin'
        );
    END IF;

    -- Check if target user exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = target_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Target user not found'
        );
    END IF;

    -- Update user role
    UPDATE user_profiles 
    SET 
        role = 'admin',
        admin_permissions = promote_to_admin.admin_permissions,
        notes = COALESCE(promote_to_admin.notes, notes),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Log the action
    INSERT INTO admin_activity_log (
        admin_id, 
        action, 
        target_user_id, 
        target_resource_type,
        details
    ) VALUES (
        current_admin_id,
        'promote_to_admin',
        target_user_id,
        'user',
        jsonb_build_object(
            'admin_permissions', promote_to_admin.admin_permissions,
            'notes', promote_to_admin.notes
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User successfully promoted to admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to moderator (admins can do this)
CREATE OR REPLACE FUNCTION promote_to_moderator(
    target_user_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_admin_id UUID := auth.uid();
    result JSONB;
BEGIN
    -- Check if current user is admin
    IF NOT is_admin(current_admin_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can promote users to moderator'
        );
    END IF;

    -- Check if target user exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = target_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Target user not found'
        );
    END IF;

    -- Update user role
    UPDATE user_profiles 
    SET 
        role = 'moderator',
        notes = COALESCE(promote_to_moderator.notes, notes),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Log the action
    INSERT INTO admin_activity_log (
        admin_id, 
        action, 
        target_user_id, 
        target_resource_type,
        details
    ) VALUES (
        current_admin_id,
        'promote_to_moderator',
        target_user_id,
        'user',
        jsonb_build_object('notes', promote_to_moderator.notes)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User successfully promoted to moderator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote user to regular user (admins can do this)
CREATE OR REPLACE FUNCTION demote_to_user(
    target_user_id UUID,
    reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_admin_id UUID := auth.uid();
    target_role user_role;
BEGIN
    -- Check if current user is admin
    IF NOT is_admin(current_admin_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can demote users'
        );
    END IF;

    -- Get current role of target user
    SELECT role INTO target_role FROM user_profiles WHERE id = target_user_id;
    
    IF target_role IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Target user not found'
        );
    END IF;

    -- Prevent demoting super admins (only super admins can demote other super admins)
    IF target_role = 'admin' AND NOT is_super_admin(current_admin_id) THEN
        IF EXISTS (SELECT 1 FROM user_profiles WHERE id = target_user_id AND is_super_admin = TRUE) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Only super administrators can demote other administrators'
            );
        END IF;
    END IF;

    -- Update user role
    UPDATE user_profiles 
    SET 
        role = 'user',
        admin_permissions = '{}',
        is_super_admin = FALSE,
        notes = COALESCE(reason, notes),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Log the action
    INSERT INTO admin_activity_log (
        admin_id, 
        action, 
        target_user_id, 
        target_resource_type,
        details
    ) VALUES (
        current_admin_id,
        'demote_to_user',
        target_user_id,
        'user',
        jsonb_build_object(
            'previous_role', target_role,
            'reason', reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User successfully demoted to regular user'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend user account (admins can do this)
CREATE OR REPLACE FUNCTION suspend_user(
    target_user_id UUID,
    reason TEXT,
    duration_days INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_admin_id UUID := auth.uid();
    suspension_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if current user is admin
    IF NOT is_admin(current_admin_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can suspend users'
        );
    END IF;

    -- Calculate suspension end date if duration is provided
    IF duration_days IS NOT NULL THEN
        suspension_until := NOW() + (duration_days || ' days')::INTERVAL;
    END IF;

    -- Update user status
    UPDATE user_profiles 
    SET 
        account_status = 'suspended',
        notes = COALESCE(reason, notes),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Log the action
    INSERT INTO admin_activity_log (
        admin_id, 
        action, 
        target_user_id, 
        target_resource_type,
        details
    ) VALUES (
        current_admin_id,
        'suspend_user',
        target_user_id,
        'user',
        jsonb_build_object(
            'reason', reason,
            'duration_days', duration_days,
            'suspension_until', suspension_until
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User successfully suspended'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate user account
CREATE OR REPLACE FUNCTION reactivate_user(
    target_user_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_admin_id UUID := auth.uid();
BEGIN
    -- Check if current user is admin
    IF NOT is_admin(current_admin_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can reactivate users'
        );
    END IF;

    -- Update user status
    UPDATE user_profiles 
    SET 
        account_status = 'active',
        notes = COALESCE(notes, user_profiles.notes),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Log the action
    INSERT INTO admin_activity_log (
        admin_id, 
        action, 
        target_user_id, 
        target_resource_type,
        details
    ) VALUES (
        current_admin_id,
        'reactivate_user',
        target_user_id,
        'user',
        jsonb_build_object('notes', notes)
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User successfully reactivated'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    -- Check if current user is admin
    IF NOT is_moderator_or_admin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Access denied'
        );
    END IF;

    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM user_profiles),
        'active_users', (SELECT COUNT(*) FROM user_profiles WHERE account_status = 'active'),
        'suspended_users', (SELECT COUNT(*) FROM user_profiles WHERE account_status = 'suspended'),
        'banned_users', (SELECT COUNT(*) FROM user_profiles WHERE account_status = 'banned'),
        'moderators', (SELECT COUNT(*) FROM user_profiles WHERE role = 'moderator' AND account_status = 'active'),
        'admins', (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin' AND account_status = 'active'),
        'pending_definitions', (SELECT COUNT(*) FROM community_definitions WHERE status = 'pending'),
        'approved_definitions', (SELECT COUNT(*) FROM community_definitions WHERE status = 'approved'),
        'rejected_definitions', (SELECT COUNT(*) FROM community_definitions WHERE status = 'rejected'),
        'pending_reports', (SELECT COUNT(*) FROM content_reports WHERE status = 'pending'),
        'total_votes', (SELECT COUNT(*) FROM community_votes),
        'recent_activity', (
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'action', activity.action,
                        'admin_username', activity.admin_username,
                        'created_at', activity.created_at,
                        'details', activity.details
                    )
                    ORDER BY activity.created_at DESC
                ),
                '[]'::jsonb
            )
            FROM (
                SELECT 
                    aal.action,
                    up.username as admin_username,
                    aal.created_at,
                    aal.details
                FROM admin_activity_log aal
                JOIN user_profiles up ON aal.admin_id = up.id
                WHERE aal.created_at > NOW() - INTERVAL '7 days'
                ORDER BY aal.created_at DESC
                LIMIT 10
            ) activity
        )
    ) INTO stats;

    RETURN jsonb_build_object(
        'success', true,
        'data', stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user management list with filters
CREATE OR REPLACE FUNCTION get_user_management_list(
    search_term TEXT DEFAULT NULL,
    role_filter user_role DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    users_data JSONB;
    total_count INTEGER;
BEGIN
    -- Check if current user is admin
    IF NOT is_admin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can access user management'
        );
    END IF;

    -- Get total count for pagination
    SELECT COUNT(*) INTO total_count
    FROM user_profiles up
    LEFT JOIN auth.users au ON up.id = au.id
    WHERE 
        (search_term IS NULL OR 
         up.username ILIKE '%' || search_term || '%' OR 
         au.email ILIKE '%' || search_term || '%')
        AND (role_filter IS NULL OR up.role = role_filter)
        AND (status_filter IS NULL OR up.account_status = status_filter);

    -- Get users data  
    WITH user_data AS (
        SELECT 
            up.id,
            up.username,
            au.email,
            up.role,
            up.account_status,
            up.reputation_score,
            up.contribution_count,
            up.is_super_admin,
            up.last_login,
            up.created_at,
            up.updated_at,
            up.notes
        FROM user_profiles up
        LEFT JOIN auth.users au ON up.id = au.id
        WHERE 
            (search_term IS NULL OR 
             up.username ILIKE '%' || search_term || '%' OR 
             au.email ILIKE '%' || search_term || '%')
            AND (role_filter IS NULL OR up.role = role_filter)
            AND (status_filter IS NULL OR up.account_status = status_filter)
        ORDER BY up.created_at DESC
        LIMIT limit_count
        OFFSET offset_count
    )
    SELECT jsonb_build_object(
        'users', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ud.id,
                    'username', ud.username,
                    'email', ud.email,
                    'role', ud.role,
                    'account_status', ud.account_status,
                    'reputation_score', ud.reputation_score,
                    'contribution_count', ud.contribution_count,
                    'is_super_admin', ud.is_super_admin,
                    'last_login', ud.last_login,
                    'created_at', ud.created_at,
                    'updated_at', ud.updated_at,
                    'notes', ud.notes
                )
            ),
            '[]'::jsonb
        ),
        'total_count', total_count,
        'has_more', (offset_count + limit_count) < total_count
    ) INTO users_data
    FROM user_data ud;

    RETURN jsonb_build_object(
        'success', true,
        'data', users_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for admin access

-- Enhanced RLS policies for admin access

-- Allow admins to view all user profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        is_admin() OR auth.uid() = id
    );

-- Allow admins to update user profiles (except super admin restrictions)
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
CREATE POLICY "Admins can update user profiles" ON user_profiles
    FOR UPDATE USING (
        is_admin() AND (
            -- Regular admins can update non-admin users
            (NOT is_super_admin() AND role != 'admin') OR
            -- Super admins can update anyone
            is_super_admin()
        )
    );

-- Allow admins to view all community definitions
DROP POLICY IF EXISTS "Admins can view all definitions" ON community_definitions;
CREATE POLICY "Admins can view all definitions" ON community_definitions
    FOR SELECT USING (
        status = 'approved' OR 
        auth.uid() = user_id OR 
        is_moderator_or_admin()
    );

-- Allow admins to view all votes
DROP POLICY IF EXISTS "Admins can view all votes" ON community_votes;
CREATE POLICY "Admins can view all votes" ON community_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_definitions 
            WHERE id = definition_id 
            AND (status = 'approved' OR user_id = auth.uid())
        ) OR is_moderator_or_admin()
    );

-- Admin activity log policies
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin activity log" ON admin_activity_log;
CREATE POLICY "Admins can view admin activity log" ON admin_activity_log
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert admin activity log" ON admin_activity_log;
CREATE POLICY "Admins can insert admin activity log" ON admin_activity_log
    FOR INSERT WITH CHECK (is_admin() AND admin_id = auth.uid());

-- Grant permissions for admin functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_moderator_or_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_moderator(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION demote_to_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_user(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_management_list(TEXT, user_role, TEXT, INTEGER, INTEGER) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION is_admin(UUID) IS 'Check if user has admin role and active status';
COMMENT ON FUNCTION is_super_admin(UUID) IS 'Check if user is a super administrator';
COMMENT ON FUNCTION is_moderator_or_admin(UUID) IS 'Check if user has moderator or admin privileges';
COMMENT ON FUNCTION promote_to_admin(UUID, JSONB, TEXT) IS 'Promote user to admin role (super admin only)';
COMMENT ON FUNCTION promote_to_moderator(UUID, TEXT) IS 'Promote user to moderator role (admin only)';
COMMENT ON FUNCTION demote_to_user(UUID, TEXT) IS 'Demote user to regular user role (admin only)';
COMMENT ON FUNCTION suspend_user(UUID, TEXT, INTEGER) IS 'Suspend user account (admin only)';
COMMENT ON FUNCTION reactivate_user(UUID, TEXT) IS 'Reactivate suspended user account (admin only)';
COMMENT ON FUNCTION get_admin_dashboard_stats() IS 'Get dashboard statistics for admin panel';
COMMENT ON FUNCTION get_user_management_list(TEXT, user_role, TEXT, INTEGER, INTEGER) IS 'Get paginated user list for admin management';

COMMENT ON TABLE admin_activity_log IS 'Log of all administrative actions for audit trail';