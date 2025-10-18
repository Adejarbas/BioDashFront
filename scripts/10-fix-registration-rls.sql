-- Fix RLS policies to allow user registration
-- Drop existing policies and create proper ones for registration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Disable RLS temporarily to clean up
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create proper policies that allow registration
CREATE POLICY "Enable insert for authenticated users only" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Fix other tables RLS policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own activities" ON activities;
CREATE POLICY "Users can manage own activities" ON activities
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE biodigester_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own biodigester data" ON biodigester_data;
CREATE POLICY "Users can manage own biodigester data" ON biodigester_data
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE biodigester_indicators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own indicators" ON biodigester_indicators;
CREATE POLICY "Users can manage own indicators" ON biodigester_indicators
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE indicator_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own indicator history" ON indicator_history;
CREATE POLICY "Users can manage own indicator history" ON indicator_history
    FOR ALL USING (auth.uid() = user_id);
