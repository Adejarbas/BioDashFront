-- Disable email confirmation requirement in Supabase
-- This script should be run in your Supabase SQL editor

-- Update auth settings to disable email confirmation
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Note: You also need to disable email confirmation in your Supabase dashboard:
-- Go to Authentication > Settings > Email Auth
-- Turn OFF "Enable email confirmations"
