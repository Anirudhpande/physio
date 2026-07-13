-- Overwrite book_bulk_appointments to fail the transaction with an exception on any slot or bed clash
CREATE OR REPLACE FUNCTION public.book_bulk_appointments(
  p_patient_id uuid,
  p_therapist_id uuid,
  p_booking_dates date[],
  p_start_time time,
  p_end_time time
)
RETURNS jsonb
AS $$
DECLARE
  v_booking_date date;
  v_therapist_exists boolean;
  v_therapist_available boolean;
  v_bed_id uuid;
  v_booking_id uuid;
  v_bulk_booking_id uuid;
  v_result_list jsonb[] := array[]::jsonb[];
BEGIN
  -- Generate a single bulk booking UUID for grouping
  v_bulk_booking_id := gen_random_uuid();

  -- Verify therapist exists
  SELECT exists(SELECT 1 FROM public.therapists WHERE id = p_therapist_id) INTO v_therapist_exists;
  IF NOT v_therapist_exists THEN
    RAISE EXCEPTION 'Therapist does not exist.';
  END IF;

  -- Loop through each date in the array
  FOREACH v_booking_date IN ARRAY p_booking_dates
  LOOP
    -- Verify therapist is free during this slot on this date
    SELECT NOT exists(
      SELECT 1 FROM public.bookings
      WHERE therapist_id = p_therapist_id
        AND booking_date = v_booking_date
        AND status = 'booked'
        AND NOT (end_time <= p_start_time OR start_time >= p_end_time)
    ) INTO v_therapist_available;

    IF NOT v_therapist_available THEN
      RAISE EXCEPTION 'Therapist is already booked on %.', v_booking_date;
    END IF;

    -- Find and lock an available bed
    SELECT b.id INTO v_bed_id
    FROM public.beds b
    WHERE b.status = 'available'
      AND b.id NOT IN (
        SELECT bk.bed_id
        FROM public.bookings bk
        WHERE bk.booking_date = v_booking_date
          AND bk.status = 'booked'
          AND NOT (bk.end_time <= p_start_time OR bk.start_time >= p_end_time)
      )
    ORDER BY b.bed_number
    LIMIT 1;

    IF v_bed_id IS NULL THEN
      RAISE EXCEPTION 'No clinic beds are available on %.', v_booking_date;
    END IF;

    -- Insert the booking with the bulk_booking_id
    INSERT INTO public.bookings (patient_id, therapist_id, bed_id, booking_date, start_time, end_time, status, bulk_booking_id)
    VALUES (p_patient_id, p_therapist_id, v_bed_id, v_booking_date, p_start_time, p_end_time, 'booked', v_bulk_booking_id)
    RETURNING id INTO v_booking_id;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'bulk_booking_id', v_bulk_booking_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
