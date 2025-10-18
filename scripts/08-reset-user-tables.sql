-- Reset all user-related tables and recreate with test user

-- Drop all user-related tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.indicator_history CASCADE;
DROP TABLE IF EXISTS public.biodigester_indicators CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.biodigester_data CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Recreate user_profiles table
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    company_name TEXT,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate biodigester_data table
CREATE TABLE public.biodigester_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    temperature DECIMAL(5,2),
    pressure DECIMAL(5,2),
    ph_level DECIMAL(3,1),
    gas_production DECIMAL(8,2),
    energy_generated DECIMAL(10,2),
    waste_processed DECIMAL(10,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate activities table
CREATE TABLE public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate biodigester_indicators table
CREATE TABLE public.biodigester_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    current_value DECIMAL(10,2),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    unit TEXT,
    status TEXT DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate indicator_history table
CREATE TABLE public.indicator_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    indicator_id UUID REFERENCES public.biodigester_indicators(id) ON DELETE CASCADE NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biodigester_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biodigester_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for biodigester_data
CREATE POLICY "Users can view own biodigester data" ON public.biodigester_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biodigester data" ON public.biodigester_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biodigester data" ON public.biodigester_data
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for activities
CREATE POLICY "Users can view own activities" ON public.activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for biodigester_indicators
CREATE POLICY "Users can view own indicators" ON public.biodigester_indicators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own indicators" ON public.biodigester_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own indicators" ON public.biodigester_indicators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own indicators" ON public.biodigester_indicators
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for indicator_history
CREATE POLICY "Users can view own indicator history" ON public.indicator_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own indicator history" ON public.indicator_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_biodigester_data_user_id ON public.biodigester_data(user_id);
CREATE INDEX idx_biodigester_data_timestamp ON public.biodigester_data(timestamp);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_timestamp ON public.activities(timestamp);
CREATE INDEX idx_indicators_user_id ON public.biodigester_indicators(user_id);
CREATE INDEX idx_indicator_history_user_id ON public.indicator_history(user_id);
CREATE INDEX idx_indicator_history_indicator_id ON public.indicator_history(indicator_id);

-- Insert test user data (this will be inserted after user registration)
-- The user must register with demo@biodigester.com / demo123456 first
-- Then this data will be automatically created by the application
