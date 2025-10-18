-- Create users table for extended user information
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  full_name TEXT,
  address TEXT,
  phone TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create biodigester_data table for sensor readings
CREATE TABLE IF NOT EXISTS biodigester_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  energy_generated DECIMAL(10,2) NOT NULL,
  waste_processed DECIMAL(10,2) NOT NULL,
  temperature DECIMAL(5,2),
  ph_level DECIMAL(4,2),
  gas_production DECIMAL(10,2),
  efficiency_rate DECIMAL(5,2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table for system activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'info',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_biodigester_data_user_id ON biodigester_data(user_id);
CREATE INDEX IF NOT EXISTS idx_biodigester_data_timestamp ON biodigester_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE biodigester_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own biodigester data" ON biodigester_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own biodigester data" ON biodigester_data FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
