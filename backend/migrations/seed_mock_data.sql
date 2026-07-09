-- Seed mock walk-in patients (no auth constraints)
INSERT INTO public.walk_in_patients (id, name, phone, notes) VALUES
  ('f0a80101-0000-0000-0000-000000000001', 'John Doe (Walk-in)', '9876543210', 'Needs lower back rehab support'),
  ('f0a80101-0000-0000-0000-000000000002', 'Jane Smith (Walk-in)', '9876543211', 'Shoulder alignment therapy'),
  ('f0a80101-0000-0000-0000-000000000003', 'Alice Johnson (Walk-in)', '9876543212', 'Weekly posture correction sessions')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, notes = EXCLUDED.notes;

-- Fetch therapist and bed IDs to build mock bookings
DO $$
DECLARE
  v_therapist_id uuid;
  v_bed_id uuid;
  v_today date := CURRENT_DATE;
BEGIN
  -- Get first therapist and bed
  SELECT id INTO v_therapist_id FROM public.therapists LIMIT 1;
  SELECT id INTO v_bed_id FROM public.beds WHERE status = 'available' LIMIT 1;

  IF v_therapist_id IS NOT NULL AND v_bed_id IS NOT NULL THEN
    -- Clear previous mock bookings to avoid duplicates
    DELETE FROM public.bookings WHERE walk_in_patient_id IN (
      'f0a80101-0000-0000-0000-000000000001',
      'f0a80101-0000-0000-0000-000000000002',
      'f0a80101-0000-0000-0000-000000000003'
    );

    -- Insert mock bookings for today
    INSERT INTO public.bookings (walk_in_patient_id, therapist_id, bed_id, booking_date, start_time, end_time, status) VALUES
      ('f0a80101-0000-0000-0000-000000000001', v_therapist_id, v_bed_id, v_today, '09:00:00', '10:00:00', 'booked'),
      ('f0a80101-0000-0000-0000-000000000002', v_therapist_id, v_bed_id, v_today, '10:00:00', '11:00:00', 'booked'),
      ('f0a80101-0000-0000-0000-000000000003', v_therapist_id, v_bed_id, v_today, '11:00:00', '12:00:00', 'booked');
  END IF;
END;
$$;
