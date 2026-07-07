-- 1. Create therapist_attendance Table
create table if not exists public.therapist_attendance (
  id uuid default gen_random_uuid() primary key,
  therapist_id uuid references public.therapists(id) on delete cascade not null,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'on_leave')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (therapist_id, attendance_date)
);

-- 2. Enable RLS
alter table public.therapist_attendance enable row level security;

-- 3. RLS Policies
drop policy if exists "Allow everyone to read attendance" on public.therapist_attendance;
create policy "Allow everyone to read attendance"
  on public.therapist_attendance for select
  to authenticated
  using (true);

drop policy if exists "Allow admins full control on attendance" on public.therapist_attendance;
create policy "Allow admins full control on attendance"
  on public.therapist_attendance for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- 4. Overwrite get_available_slots to account for attendance
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
      -- Count therapists whose shift covers this specific slot AND who are not marked absent/on_leave today
      select count(*) into v_active_therapists
      from public.therapists t
      where t.shift_start <= v_current_slot_start 
        and t.shift_end >= v_current_slot_end
        and not exists (
          select 1 from public.therapist_attendance a
          where a.therapist_id = t.id
            and a.attendance_date = p_date
            and a.status in ('absent', 'on_leave')
        );

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
