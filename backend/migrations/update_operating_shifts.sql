-- Migration: Update Clinic to support Morning and Evening Shifts

-- 1. Seed shift hours in clinic_settings
INSERT INTO public.clinic_settings (key, value) VALUES
  ('morning_start_time', '09:00:00'),
  ('morning_end_time', '14:00:00'),
  ('evening_start_time', '16:00:00'),
  ('evening_end_time', '20:00:00')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Overwrite get_available_slots to compute slots for both shifts
CREATE OR REPLACE FUNCTION public.get_available_slots(p_date date)
RETURNS TABLE (
  slot_start time without time zone,
  slot_end time without time zone,
  available_slots integer
)
AS $$
DECLARE
  v_total_beds integer;
  v_morning_start time;
  v_morning_end time;
  v_evening_start time;
  v_evening_end time;
  v_current_slot_start time;
  v_current_slot_end time;
BEGIN
  -- Fetch clinic settings or default values
  SELECT coalesce((SELECT value::time FROM public.clinic_settings WHERE key = 'morning_start_time'), '09:00:00'::time) INTO v_morning_start;
  SELECT coalesce((SELECT value::time FROM public.clinic_settings WHERE key = 'morning_end_time'), '14:00:00'::time) INTO v_morning_end;
  SELECT coalesce((SELECT value::time FROM public.clinic_settings WHERE key = 'evening_start_time'), '16:00:00'::time) INTO v_evening_start;
  SELECT coalesce((SELECT value::time FROM public.clinic_settings WHERE key = 'evening_end_time'), '20:00:00'::time) INTO v_evening_end;

  -- Count total beds marked as 'available'
  SELECT count(*) INTO v_total_beds FROM public.beds WHERE status = 'available';

  -- 1. Loop through Morning slots
  v_current_slot_start := v_morning_start;
  WHILE v_current_slot_start < v_morning_end LOOP
    v_current_slot_end := v_current_slot_start + interval '1 hour';
    
    DECLARE
      v_active_therapists integer;
      v_booked_therapists integer;
      v_booked_beds integer;
      v_free_therapists integer;
      v_free_beds integer;
    BEGIN
      -- Count therapists whose shift covers this specific slot AND who are not marked absent/on_leave today
      SELECT count(*) INTO v_active_therapists
      FROM public.therapists t
      WHERE t.shift_start <= v_current_slot_start 
        AND t.shift_end >= v_current_slot_end
        AND NOT EXISTS (
          SELECT 1 FROM public.therapist_attendance a
          WHERE a.therapist_id = t.id
            AND a.attendance_date = p_date
            AND a.status IN ('absent', 'on_leave')
        );

      -- Count therapists booked during this slot
      SELECT count(distinct bk.therapist_id) into v_booked_therapists
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

      available_slots := greatest(0, least(v_free_therapists, v_free_beds));
      slot_start := v_current_slot_start;
      slot_end := v_current_slot_end;
      RETURN NEXT;
    END;
    
    v_current_slot_start := v_current_slot_end;
  END LOOP;

  -- 2. Loop through Evening slots
  v_current_slot_start := v_evening_start;
  WHILE v_current_slot_start < v_evening_end LOOP
    v_current_slot_end := v_current_slot_start + interval '1 hour';
    
    DECLARE
      v_active_therapists integer;
      v_booked_therapists integer;
      v_booked_beds integer;
      v_free_therapists integer;
      v_free_beds integer;
    BEGIN
      -- Count therapists whose shift covers this specific slot AND who are not marked absent/on_leave today
      SELECT count(*) INTO v_active_therapists
      FROM public.therapists t
      WHERE t.shift_start <= v_current_slot_start 
        AND t.shift_end >= v_current_slot_end
        AND NOT EXISTS (
          SELECT 1 FROM public.therapist_attendance a
          WHERE a.therapist_id = t.id
            AND a.attendance_date = p_date
            AND a.status IN ('absent', 'on_leave')
        );

      -- Count therapists booked during this slot
      SELECT count(distinct bk.therapist_id) into v_booked_therapists
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

      available_slots := greatest(0, least(v_free_therapists, v_free_beds));
      slot_start := v_current_slot_start;
      slot_end := v_current_slot_end;
      RETURN NEXT;
    END;
    
    v_current_slot_start := v_current_slot_end;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
