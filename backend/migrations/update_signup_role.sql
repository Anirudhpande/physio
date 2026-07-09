-- 1. Update the handle_new_user function to default new signups to 'receptionist' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (new.id, new.email, 'receptionist', coalesce(new.raw_user_meta_data->>'name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update all existing profiles to have the 'receptionist' role so RLS allows full dashboard visibility
UPDATE public.profiles SET role = 'receptionist';
