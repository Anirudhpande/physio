-- Create security helper to check if a user is a therapist/doctor
create or replace function public.is_therapist(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'therapist'
  );
end;
$$ language plpgsql security definer;

-- Profiles Select Policy
drop policy if exists "Allow users to read their own profile, and admins all" on public.profiles;
drop policy if exists "Allow users to read their own profile, admins all, therapists all" on public.profiles;
create policy "Allow users to read their own profile, admins all, therapists all"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid() 
    or public.is_admin(auth.uid()) 
    or public.is_therapist(auth.uid())
  );

-- Bookings Select Policy
drop policy if exists "Allow patients to read their own bookings, and admins all" on public.bookings;
drop policy if exists "Allow patients to read bookings, admins all, therapists all" on public.bookings;
create policy "Allow patients to read bookings, admins all, therapists all"
  on public.bookings for select
  to authenticated
  using (
    patient_id = auth.uid() 
    or public.is_admin(auth.uid()) 
    or public.is_therapist(auth.uid())
  );

-- Bookings Update Policy
drop policy if exists "Allow patients to update their own bookings, and admins all" on public.bookings;
drop policy if exists "Allow patients, admins, and therapists to update bookings" on public.bookings;
create policy "Allow patients, admins, and therapists to update bookings"
  on public.bookings for update
  to authenticated
  using (
    patient_id = auth.uid() 
    or public.is_admin(auth.uid()) 
    or public.is_therapist(auth.uid())
  );
