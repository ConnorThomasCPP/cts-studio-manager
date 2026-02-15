-- Fix get_user_emails_for_session helper to read email from auth.users
-- public.users does not store email in this schema.

CREATE OR REPLACE FUNCTION get_user_emails_for_session(p_session_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  is_organizer BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    COALESCE(au.email::TEXT, '') AS email,
    COALESCE(u.name, au.email::TEXT, 'Unknown User') AS name,
    sa.is_organizer
  FROM public.session_attendees sa
  JOIN public.users u ON u.id = sa.user_id
  LEFT JOIN auth.users au ON au.id = sa.user_id
  WHERE sa.session_id = p_session_id
  ORDER BY sa.is_organizer DESC, u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_emails_for_session IS 'Helper function to fetch attendee emails for calendar events';
