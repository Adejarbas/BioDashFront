-- This script should be run AFTER the test user registers
-- It will populate the database with sample data for the test user

-- Note: Replace 'USER_ID_HERE' with the actual UUID of the registered test user
-- You can find this in the Supabase Auth dashboard after registration

-- Sample biodigester data (last 30 days)
INSERT INTO public.biodigester_data (user_id, temperature, pressure, ph_level, gas_production, energy_generated, waste_processed, timestamp)
SELECT 
    auth.uid(),
    25.0 + (random() * 10), -- Temperature between 25-35°C
    1.0 + (random() * 0.5),  -- Pressure between 1.0-1.5 bar
    6.5 + (random() * 1.0),  -- pH between 6.5-7.5
    100 + (random() * 50),   -- Gas production 100-150 m³/day
    50 + (random() * 30),    -- Energy 50-80 kWh/day
    200 + (random() * 100),  -- Waste 200-300 kg/day
    NOW() - (interval '1 day' * generate_series(0, 29))
FROM generate_series(0, 29);

-- Sample activities
INSERT INTO public.activities (user_id, type, description, timestamp)
VALUES 
    (auth.uid(), 'maintenance', 'Limpeza do sistema de filtragem', NOW() - interval '2 hours'),
    (auth.uid(), 'alert', 'Temperatura acima do normal detectada', NOW() - interval '5 hours'),
    (auth.uid(), 'production', 'Produção de biogás otimizada', NOW() - interval '1 day'),
    (auth.uid(), 'maintenance', 'Calibração dos sensores de pressão', NOW() - interval '2 days'),
    (auth.uid(), 'alert', 'Nível de pH ajustado automaticamente', NOW() - interval '3 days');

-- Sample indicators (will be created automatically by the application)
-- These are created when the user first visits the indicators page
