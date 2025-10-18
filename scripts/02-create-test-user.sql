-- Create a test user for demonstration purposes
-- This script should be run after user registration through Supabase Auth

-- Insert test user data (this will be linked to the auth user after registration)
-- The user must first register through the app with email: demo@biodigester.com
-- Then this script will add the extended profile information

-- Note: Replace 'USER_UUID_HERE' with the actual UUID from auth.users after registration
INSERT INTO users (id, email, company_name, full_name, address, phone, profile_image_url) 
VALUES (
  'USER_UUID_HERE', -- This needs to be replaced with actual auth.users UUID
  'demo@biodigester.com',
  'EcoTech Solutions',
  'João Silva',
  'Rua das Flores, 123, São Paulo, SP, 01234-567',
  '+55 11 99999-9999',
  '/abstract-profile.png'
) ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  full_name = EXCLUDED.full_name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  profile_image_url = EXCLUDED.profile_image_url;

-- Insert sample biodigester data for the test user
INSERT INTO biodigester_data (user_id, energy_generated, waste_processed, temperature, ph_level, gas_production, efficiency_rate, timestamp) VALUES
('USER_UUID_HERE', 245.50, 180.25, 38.5, 7.2, 125.75, 87.3, NOW() - INTERVAL '1 hour'),
('USER_UUID_HERE', 238.20, 175.80, 37.8, 7.1, 122.40, 85.7, NOW() - INTERVAL '2 hours'),
('USER_UUID_HERE', 252.10, 185.60, 39.2, 7.3, 128.90, 89.1, NOW() - INTERVAL '3 hours'),
('USER_UUID_HERE', 241.75, 178.45, 38.1, 7.0, 124.20, 86.5, NOW() - INTERVAL '4 hours'),
('USER_UUID_HERE', 248.90, 182.30, 38.9, 7.2, 127.15, 88.2, NOW() - INTERVAL '5 hours');

-- Insert sample activities for the test user
INSERT INTO activities (user_id, type, description, status, created_at) VALUES
('USER_UUID_HERE', 'maintenance', 'Limpeza do sistema de filtragem concluída', 'success', NOW() - INTERVAL '30 minutes'),
('USER_UUID_HERE', 'alert', 'Temperatura acima do normal detectada', 'warning', NOW() - INTERVAL '1 hour'),
('USER_UUID_HERE', 'production', 'Novo lote de resíduos processado com sucesso', 'success', NOW() - INTERVAL '2 hours'),
('USER_UUID_HERE', 'system', 'Backup automático dos dados realizado', 'info', NOW() - INTERVAL '3 hours'),
('USER_UUID_HERE', 'maintenance', 'Calibração dos sensores de pH realizada', 'success', NOW() - INTERVAL '4 hours');
