-- MIGRATION: Add Receptionist Role + Walk-in Patients Support
-- Run this in Supabase SQL Editor

-- 1. Update profiles role check to include 'receptionist'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'admin', 'receptionist', 'therapist'));

-- 2. Update is_admin() to also grant access to receptionists
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role IN ('admin', 'receptionist')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create walk_in_patients table
CREATE TABLE IF NOT EXISTS public.walk_in_patients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS on walk_in_patients
ALTER TABLE public.walk_in_patients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated (receptionist/admin) full access to walk-in patients
CREATE POLICY "Allow authenticated users to manage walk-in patients"
  ON public.walk_in_patients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Add walk_in_patient_id to bookings (nullable - either profile patient or walk-in)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS walk_in_patient_id uuid REFERENCES public.walk_in_patients(id) ON DELETE SET NULL;

-- Make patient_id nullable so walk-in bookings don't need a profile
ALTER TABLE public.bookings
  ALTER COLUMN patient_id DROP NOT NULL;

-- 6. Enable realtime for walk_in_patients
ALTER PUBLICATION supabase_realtime ADD TABLE public.walk_in_patients;
