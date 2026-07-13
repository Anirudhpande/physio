-- Clear existing beds and insert exactly 11 available beds
TRUNCATE TABLE public.beds CASCADE;

INSERT INTO public.beds (bed_number, status) VALUES
  ('Bed A-1', 'available'),
  ('Bed A-2', 'available'),
  ('Bed B-1', 'available'),
  ('Bed B-2', 'available'),
  ('Bed C-1', 'available'),
  ('Bed C-2', 'available'),
  ('Bed D-1', 'available'),
  ('Bed D-2', 'available'),
  ('Bed E-1', 'available'),
  ('Bed E-2', 'available'),
  ('Bed F-1', 'available');
