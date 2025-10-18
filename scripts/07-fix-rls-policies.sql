-- Fix RLS policies to allow user profile creation during registration
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create proper RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Also fix other tables to ensure proper RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON biodigester_data;
DROP POLICY IF EXISTS "Users can insert own data" ON biodigester_data;
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Users can view own indicators" ON biodigester_indicators;
DROP POLICY IF EXISTS "Users can manage own indicators" ON biodigester_indicators;

-- Biodigester data policies
CREATE POLICY "Users can view own data" ON biodigester_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON biodigester_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indicators policies
CREATE POLICY "Users can view own indicators" ON biodigester_indicators
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own indicators" ON biodigester_indicators
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE biodigester_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE biodigester_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_history ENABLE ROW LEVEL SECURITY;

-- Indicator history policies
DROP POLICY IF EXISTS "Users can view indicator history" ON indicator_history;
CREATE POLICY "Users can view indicator history" ON indicator_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM biodigester_indicators 
      WHERE biodigester_indicators.id = indicator_history.indicator_id 
      AND biodigester_indicators.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert indicator history" ON indicator_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM biodigester_indicators 
      WHERE biodigester_indicators.id = indicator_history.indicator_id 
      AND biodigester_indicators.user_id = auth.uid()
    )
  );
