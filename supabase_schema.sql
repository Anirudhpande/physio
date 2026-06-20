-- SUPABASE SCHEMA FOR CLINIC MANAGEMENT PLATFORM

-- 1. CLEANUP (Optional, for clean slate)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.book_appointment(uuid, uuid, date, time, time);
drop function if exists public.get_available_slots(date);
drop function if exists public.is_admin(uuid);

drop table if exists public.bookings cascade;
drop table if exists public.beds cascade;
drop table if exists public.therapists cascade;
drop table if exists public.profiles cascade;

-- 2. CREATE TABLES

-- Profiles Table (Linked to Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('patient', 'admin')) default 'patient',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Therapists Table
create table public.therapists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  specialization text not null,
  experience integer not null check (experience >= 0),
  profile_image text,
  shift_start time without time zone default '09:00:00'::time not null,
  shift_end time without time zone default '17:00:00'::time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Beds Table
create table public.beds (
  id uuid default gen_random_uuid() primary key,
  bed_number text not null unique,
  status text not null check (status in ('available', 'occupied', 'maintenance')) default 'available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings Table
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  therapist_id uuid references public.therapists(id) on delete cascade not null,
  bed_id uuid references public.beds(id) on delete cascade not null,
  booking_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  status text not null check (status in ('booked', 'completed', 'cancelled')) default 'booked',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint check_booking_times check (start_time < end_time)
);

-- 3. HELPER FUNCTIONS & TRIGGERS

-- Function to check if a user is an admin (Security Definer to avoid infinite recursion in RLS)
create or replace function public.is_admin(p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Trigger to automatically create a profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New Clinic Patient'),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. TRANSACTION-SAFE BOOKING FUNCTION (WITH AUTOMATIC BED ASSIGNMENT)
create or replace function public.book_appointment(
  p_patient_id uuid,
  p_therapist_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time
)
returns jsonb
as $$
declare
  v_therapist_exists boolean;
  v_therapist_available boolean;
  v_bed_id uuid;
  v_booking_id uuid;
  v_result jsonb;
begin
  -- 1. Verify therapist exists
  select exists(select 1 from public.therapists where id = p_therapist_id) into v_therapist_exists;
  if not v_therapist_exists then
    raise exception 'Therapist does not exist.';
  end if;

  -- 2. Verify therapist is free during this slot
  select not exists(
    select 1 from public.bookings
    where therapist_id = p_therapist_id
      and booking_date = p_booking_date
      and status = 'booked'
      and not (end_time <= p_start_time or start_time >= p_end_time)
  ) into v_therapist_available;

  if not v_therapist_available then
    raise exception 'Therapist is already booked during this time slot.';
  end if;

  -- 3. Find and lock an available bed (status must be 'available' and must not have overlapping bookings)
  select b.id into v_bed_id
  from public.beds b
  where b.status = 'available'
    and b.id not in (
      select bk.bed_id
      from public.bookings bk
      where bk.booking_date = p_booking_date
        and bk.status = 'booked'
        and not (bk.end_time <= p_start_time or bk.start_time >= p_end_time)
    )
  order by b.bed_number
  limit 1
  for update skip locked; -- prevent double-booking race conditions

  if v_bed_id is null then
    raise exception 'No clinic beds are available during this time slot.';
  end if;

  -- 4. Insert the booking
  insert into public.bookings (patient_id, therapist_id, bed_id, booking_date, start_time, end_time, status)
  values (p_patient_id, p_therapist_id, v_bed_id, p_booking_date, p_start_time, p_end_time, 'booked')
  returning id into v_booking_id;

  -- 5. Return success result
  select json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'bed_id', v_bed_id,
    'booking_date', p_booking_date,
    'start_time', p_start_time,
    'end_time', p_end_time
  ) into v_result;

  return v_result;
end;
$$ language plpgsql security definer;

-- 5. DYNAMIC AVAILABILITY SLOTS CALCULATOR
create or replace function public.get_available_slots(p_date date)
returns table (
  slot_start time without time zone,
  slot_end time without time zone,
  available_slots integer
)
as $$
declare
  v_total_beds integer;
  v_total_therapists integer;
begin
  -- Count total beds marked as 'available'
  select count(*) into v_total_beds from public.beds where status = 'available';
  
  -- Count total therapists registered
  select count(*) into v_total_therapists from public.therapists;

  -- Loop through 1-hour slots from 09:00 to 17:00
  for slot_start, slot_end in 
    values 
      ('09:00:00'::time, '10:00:00'::time),
      ('10:00:00'::time, '11:00:00'::time),
      ('11:00:00'::time, '12:00:00'::time),
      ('12:00:00'::time, '13:00:00'::time),
      ('13:00:00'::time, '14:00:00'::time),
      ('14:00:00'::time, '15:00:00'::time),
      ('15:00:00'::time, '16:00:00'::time),
      ('16:00:00'::time, '17:00:00'::time)
  loop
    declare
      v_booked_therapists integer;
      v_booked_beds integer;
      v_free_therapists integer;
      v_free_beds integer;
    begin
      -- Count therapists booked during this slot
      select count(distinct bk.therapist_id) into v_booked_therapists
      from public.bookings bk
      where bk.booking_date = p_date
        and bk.status = 'booked'
        and not (bk.end_time <= slot_start or bk.start_time >= slot_end);
        
      -- Count beds booked during this slot
      select count(distinct bk.bed_id) into v_booked_beds
      from public.bookings bk
      where bk.booking_date = p_date
        and bk.status = 'booked'
        and not (bk.end_time <= slot_start or bk.start_time >= slot_end);

      v_free_therapists := v_total_therapists - v_booked_therapists;
      v_free_beds := v_total_beds - v_booked_beds;

      -- Available capacity is the minimum of free therapists and free beds
      available_slots := greatest(0, least(v_free_therapists, v_free_beds));
      return next;
    end;
  end loop;
end;
$$ language plpgsql security definer;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

alter table public.profiles enable row level security;
alter table public.therapists enable row level security;
alter table public.beds enable row level security;
alter table public.bookings enable row level security;

-- Profiles Policies
create policy "Allow users to read their own profile, and admins all"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "Allow users to update their own profile, and admins all"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "Allow insert on sign up trigger (security definer bypasses RLS, but for safety)"
  on public.profiles for insert
  to authenticated, anon
  with check (true);

-- Therapists Policies
create policy "Allow everyone to read therapists"
  on public.therapists for select
  to authenticated, anon
  using (true);

create policy "Allow admins full control on therapists"
  on public.therapists for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- Beds Policies
create policy "Allow everyone to read beds"
  on public.beds for select
  to authenticated, anon
  using (true);

create policy "Allow admins full control on beds"
  on public.beds for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- Bookings Policies
create policy "Allow patients to read their own bookings, and admins all"
  on public.bookings for select
  to authenticated
  using (patient_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Allow patients to insert their own bookings, and admins all"
  on public.bookings for insert
  to authenticated
  with check (patient_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Allow patients to update their own bookings, and admins all"
  on public.bookings for update
  to authenticated
  using (patient_id = auth.uid() or public.is_admin(auth.uid()));

-- 7. ENABLE REALTIME REPLICATION
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.beds;
alter publication supabase_realtime add table public.therapists;

-- 8. SEED MOCK DATA

-- Seed Beds
insert into public.beds (bed_number, status) values
  ('Bed A-1', 'available'),
  ('Bed A-2', 'available'),
  ('Bed B-1', 'available'),
  ('Bed B-2', 'available'),
  ('Bed C-1', 'available'),
  ('Bed C-2', 'maintenance'); -- bed under maintenance

-- Seed Therapists
insert into public.therapists (name, specialization, experience, profile_image, shift_start, shift_end) values
  ('Dr. Sarah Jenkins', 'Sports Injury Rehab', 8, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00'),
  ('Dr. Marcus Chen', 'Neurological Physiotherapy', 12, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00'),
  ('Dr. Priya Patel', 'Orthopedic & Joint Recovery', 6, 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00'),
  ('Dr. David Miller', 'Pediatric & Geriatric Care', 10, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00');
