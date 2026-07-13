DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.therapists WHERE name = 'Dr. Robert Carter') THEN
    INSERT INTO public.therapists (name, specialization, experience, profile_image, shift_start, shift_end) VALUES
      ('Dr. Robert Carter', 'Spinal Alignment Specialist', 9, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.therapists WHERE name = 'Dr. Lisa Warren') THEN
    INSERT INTO public.therapists (name, specialization, experience, profile_image, shift_start, shift_end) VALUES
      ('Dr. Lisa Warren', 'Pediatric Physiotherapist', 7, 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.therapists WHERE name = 'Dr. Alan Foster') THEN
    INSERT INTO public.therapists (name, specialization, experience, profile_image, shift_start, shift_end) VALUES
      ('Dr. Alan Foster', 'Cardiovascular Rehab', 11, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.therapists WHERE name = 'Dr. Helen Brooks') THEN
    INSERT INTO public.therapists (name, specialization, experience, profile_image, shift_start, shift_end) VALUES
      ('Dr. Helen Brooks', 'Geriatric Movement Specialist', 13, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300', '09:00:00', '17:00:00');
  END IF;
END;
$$;
