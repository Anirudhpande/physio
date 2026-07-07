-- Migration: Add Bulk Booking Support

-- 1. Add bulk_booking_id column to public.bookings
alter table public.bookings add column if not exists bulk_booking_id uuid default null;

-- 2. Create the book_bulk_appointments RPC
create or replace function public.book_bulk_appointments(
  p_patient_id uuid,
  p_therapist_id uuid,
  p_booking_dates date[],
  p_start_time time,
  p_end_time time
)
returns jsonb
as $$
declare
  v_booking_date date;
  v_therapist_exists boolean;
  v_therapist_available boolean;
  v_bed_id uuid;
  v_booking_id uuid;
  v_bulk_booking_id uuid;
  v_result_list jsonb[] := array[]::jsonb[];
  v_item jsonb;
begin
  -- Generate a single bulk booking UUID for grouping
  v_bulk_booking_id := gen_random_uuid();

  -- Verify therapist exists
  select exists(select 1 from public.therapists where id = p_therapist_id) into v_therapist_exists;
  if not v_therapist_exists then
    raise exception 'Therapist does not exist.';
  end if;

  -- Loop through each date in the array
  foreach v_booking_date in array p_booking_dates
  loop
    -- Reset variables for each loop iteration
    v_booking_id := null;
    v_bed_id := null;
    v_therapist_available := false;

    -- Verify therapist is free during this slot on this date
    select not exists(
      select 1 from public.bookings
      where therapist_id = p_therapist_id
        and booking_date = v_booking_date
        and status = 'booked'
        and not (end_time <= p_start_time or start_time >= p_end_time)
    ) into v_therapist_available;

    if not v_therapist_available then
      v_item := json_build_object(
        'date', v_booking_date,
        'success', false,
        'error', 'Therapist is already booked during this time slot.'
      );
      v_result_list := array_append(v_result_list, v_item);
      continue;
    end if;

    -- Find and lock an available bed
    select b.id into v_bed_id
    from public.beds b
    where b.status = 'available'
      and b.id not in (
        select bk.bed_id
        from public.bookings bk
        where bk.booking_date = v_booking_date
          and bk.status = 'booked'
          and not (bk.end_time <= p_start_time or bk.start_time >= p_end_time)
      )
    order by b.bed_number
    limit 1;

    if v_bed_id is null then
      v_item := json_build_object(
        'date', v_booking_date,
        'success', false,
        'error', 'No clinic beds are available during this time slot.'
      );
      v_result_list := array_append(v_result_list, v_item);
      continue;
    end if;

    -- Insert the booking with the bulk_booking_id
    insert into public.bookings (patient_id, therapist_id, bed_id, booking_date, start_time, end_time, status, bulk_booking_id)
    values (p_patient_id, p_therapist_id, v_bed_id, v_booking_date, p_start_time, p_end_time, 'booked', v_bulk_booking_id)
    returning id into v_booking_id;

    v_item := json_build_object(
      'date', v_booking_date,
      'success', true,
      'booking_id', v_booking_id,
      'bed_id', v_bed_id
    );
    v_result_list := array_append(v_result_list, v_item);
  end loop;

  return json_build_object(
    'success', true,
    'bulk_booking_id', v_bulk_booking_id,
    'results', to_jsonb(v_result_list)
  );
end;
$$ language plpgsql security definer;
