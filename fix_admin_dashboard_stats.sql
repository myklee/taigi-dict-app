-- Quick Fix for Admin Dashboard Stats Function
-- This fixes the "column reference 'created_at' is ambiguous" error

-- Drop and recreate the function with proper table aliases
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
            SELECT jsonb_agg(
                jsonb_build_object(
                    'action', aal.action,
                    'admin_username', up.username,
                    'created_at', aal.created_at,
                    'details', aal.details
                )
            )
            FROM admin_activity_log aal
            JOIN user_profiles up ON aal.admin_id = up.id
            WHERE aal.created_at > NOW() - INTERVAL '7 days'
            ORDER BY aal.created_at DESC
            LIMIT 10
        )
    ) INTO stats;

    RETURN jsonb_build_object(
        'success', true,
        'data', stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;

-- Test the function (optional - you can run this to verify it works)
-- SELECT get_admin_dashboard_stats();