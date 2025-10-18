-- Reset all tables and disable email confirmation
-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.biodigester_data CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Recreate tables
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  company_address TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.biodigester_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  energy_generated DECIMAL(10,2) NOT NULL,
  waste_processed DECIMAL(10,2) NOT NULL,
  efficiency DECIMAL(5,2) NOT NULL,
  temperature DECIMAL(5,2) NOT NULL,
  ph_level DECIMAL(4,2) NOT NULL,
  gas_production DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biodigester_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own biodigester data" ON public.biodigester_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biodigester data" ON public.biodigester_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert demo user data (will be created after user signs up)
-- This will be handled by the application after successful signup
