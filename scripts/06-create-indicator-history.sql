-- Create indicator_history table for tracking value changes over time
CREATE TABLE IF NOT EXISTS indicator_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_id UUID NOT NULL REFERENCES biodigester_indicators(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_indicator_history_indicator_id ON indicator_history(indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_history_timestamp ON indicator_history(timestamp);

-- Enable RLS
ALTER TABLE indicator_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own indicator history
CREATE POLICY "Users can view their own indicator history" ON indicator_history
  FOR SELECT USING (
    indicator_id IN (
      SELECT id FROM biodigester_indicators WHERE user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert history for their own indicators
CREATE POLICY "Users can insert history for their own indicators" ON indicator_history
  FOR INSERT WITH CHECK (
    indicator_id IN (
      SELECT id FROM biodigester_indicators WHERE user_id = auth.uid()
    )
  );
