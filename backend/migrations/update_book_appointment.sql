-- Drop the old 5-parameter signature if necessary, but it is safer to just replace/overload it
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_patient_id uuid,
  p_therapist_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_walk_in_patient_id uuid DEFAULT NULL
)
RETURNS jsonb
AS $$
DECLARE
  v_therapist_exists boolean;
  v_therapist_available boolean;
  v_bed_id uuid;
  v_booking_id uuid;
  v_result jsonb;
BEGIN
  -- 1. Verify therapist exists
  SELECT exists(SELECT 1 FROM public.therapists WHERE id = p_therapist_id) INTO v_therapist_exists;
  IF NOT v_therapist_exists THEN
    RAISE EXCEPTION 'Therapist does not exist.';
  END IF;

  -- 2. Verify therapist is free during this slot
  SELECT NOT exists(
    SELECT 1 FROM public.bookings
    WHERE therapist_id = p_therapist_id
      AND booking_date = p_booking_date
      AND status = 'booked'
      AND NOT (end_time <= p_start_time OR start_time >= p_end_time)
  ) INTO v_therapist_available;

  IF NOT v_therapist_available THEN
    RAISE EXCEPTION 'Therapist is already booked during this time slot.';
  END IF;

  -- 3. Find and lock an available bed
  SELECT b.id INTO v_bed_id
  FROM public.beds b
  WHERE b.status = 'available'
    AND b.id NOT IN (
      SELECT bk.bed_id
      FROM public.bookings bk
      WHERE bk.booking_date = p_booking_date
        AND bk.status = 'booked'
        AND NOT (bk.end_time <= p_start_time OR bk.start_time >= p_end_time)
    )
  ORDER BY b.bed_number
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_bed_id IS NULL THEN
    RAISE EXCEPTION 'No clinic beds are available during this time slot.';
  END IF;

  -- 4. Insert the booking (patient_id is nullable now)
  INSERT INTO public.bookings (patient_id, therapist_id, bed_id, booking_date, start_time, end_time, status, walk_in_patient_id)
  VALUES (p_patient_id, p_therapist_id, v_bed_id, p_booking_date, p_start_time, p_end_time, 'booked', p_walk_in_patient_id)
  RETURNING id INTO v_booking_id;

  -- 5. Return success result
  SELECT json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'bed_id', v_bed_id,
    'booking_date', p_booking_date,
    'start_time', p_start_time,
    'end_time', p_end_time
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
