-- UPDATE SCHEMA: CLINIC SETTINGS AND DYNAMIC SLOTS CALCULATION

-- 1. Create clinic_settings Table
create table if not exists public.clinic_settings (
  key text primary key,
  value text not null
);

-- 2. Enable RLS
alter table public.clinic_settings enable row level security;

-- 3. RLS Policies
drop policy if exists "Allow everyone to read clinic settings" on public.clinic_settings;
create policy "Allow everyone to read clinic settings"
  on public.clinic_settings for select
  to authenticated, anon
  using (true);

drop policy if exists "Allow admins full control on clinic settings" on public.clinic_settings;
create policy "Allow admins full control on clinic settings"
  on public.clinic_settings for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- 4. Seed Default Operating Hours
insert into public.clinic_settings (key, value) values
  ('clinic_start_time', '09:00:00'),
  ('clinic_end_time', '17:00:00')
on conflict (key) do nothing;

-- 5. Overwrite get_available_slots to be dynamic and support therapist shifts
create or replace function public.get_available_slots(p_date date)
returns table (
  slot_start time without time zone,
  slot_end time without time zone,
  available_slots integer
)
as $$
declare
  v_total_beds integer;
  v_clinic_start time;
  v_clinic_end time;
  v_current_slot_start time;
  v_current_slot_end time;
begin
  -- Fetch clinic settings or default to 09:00 and 17:00
  select coalesce((select value::time from public.clinic_settings where key = 'clinic_start_time'), '09:00:00'::time) into v_clinic_start;
  select coalesce((select value::time from public.clinic_settings where key = 'clinic_end_time'), '17:00:00'::time) into v_clinic_end;

  -- Count total beds marked as 'available'
  select count(*) into v_total_beds from public.beds where status = 'available';

  -- Loop through 1-hour slots starting from v_clinic_start to v_clinic_end
  v_current_slot_start := v_clinic_start;
  while v_current_slot_start < v_clinic_end loop
    v_current_slot_end := v_current_slot_start + interval '1 hour';
    
    declare
      v_active_therapists integer;
      v_booked_therapists integer;
      v_booked_beds integer;
      v_free_therapists integer;
      v_free_beds integer;
    begin
      -- Count therapists whose shift covers this specific slot
      select count(*) into v_active_therapists
      from public.therapists
      where shift_start <= v_current_slot_start and shift_end >= v_current_slot_end;

      -- Count therapists booked during this slot
      select count(distinct bk.therapist_id) into v_booked_therapists
      from public.bookings bk
      where bk.booking_date = p_date
        and bk.status = 'booked'
        and not (bk.end_time <= v_current_slot_start or bk.start_time >= v_current_slot_end);
        
      -- Count beds booked during this slot
      select count(distinct bk.bed_id) into v_booked_beds
      from public.bookings bk
      where bk.booking_date = p_date
        and bk.status = 'booked'
        and not (bk.end_time <= v_current_slot_start or bk.start_time >= v_current_slot_end);

      v_free_therapists := v_active_therapists - v_booked_therapists;
      v_free_beds := v_total_beds - v_booked_beds;

      -- Available capacity is the minimum of free therapists and free beds
      available_slots := greatest(0, least(v_free_therapists, v_free_beds));
      slot_start := v_current_slot_start;
      slot_end := v_current_slot_end;
      return next;
    end;
    
    v_current_slot_start := v_current_slot_end;
  end loop;
end;
$$ language plpgsql security definer;
