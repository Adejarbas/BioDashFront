-- Create biodigester_indicators table
CREATE TABLE IF NOT EXISTS biodigester_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- temperature, pressure, flow, energy, ph, gas
    unit VARCHAR(20) NOT NULL, -- °C, bar, L/h, kWh, pH, m³
    min_value DECIMAL(10,2) NOT NULL,
    max_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'normal', -- normal, warning, critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE biodigester_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own indicators" ON biodigester_indicators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own indicators" ON biodigester_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own indicators" ON biodigester_indicators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own indicators" ON biodigester_indicators
    FOR DELETE USING (auth.uid() = user_id);

-- Insert sample indicators
INSERT INTO biodigester_indicators (user_id, name, type, unit, min_value, max_value, current_value, status) VALUES
((SELECT id FROM auth.users LIMIT 1), 'Temperatura do Reator', 'temperature', '°C', 35.0, 42.0, 38.5, 'normal'),
((SELECT id FROM auth.users LIMIT 1), 'Pressão do Gás', 'pressure', 'bar', 0.8, 1.2, 1.0, 'normal'),
((SELECT id FROM auth.users LIMIT 1), 'Fluxo de Entrada', 'flow', 'L/h', 50.0, 200.0, 120.0, 'normal'),
((SELECT id FROM auth.users LIMIT 1), 'Produção de Energia', 'energy', 'kWh', 10.0, 50.0, 32.5, 'normal'),
((SELECT id FROM auth.users LIMIT 1), 'pH do Substrato', 'ph', 'pH', 6.5, 7.5, 7.1, 'normal');
