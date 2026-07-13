-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert default user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0a80101-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@physio.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Receptionist"}',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Link default receptionist profile
INSERT INTO public.profiles (id, email, name, role)
VALUES (
  'a0a80101-0000-0000-0000-000000000001',
  'admin@physio.com',
  'Admin Receptionist',
  'receptionist'
)
ON CONFLICT (id) DO UPDATE SET role = 'receptionist';
