const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All patients routes require authentication
router.use(authMiddleware);

// GET /api/patients
// Returns all registered patients (role='patient') + all walk-in patients, combined and sorted by name
router.get('/', async (req, res) => {
  try {
    // Fetch registered patients
    const { data: registeredPatients, error: regError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .eq('role', 'patient')
      .order('full_name', { ascending: true });

    if (regError) return res.status(500).json({ error: regError.message });

    // Fetch walk-in patients
    const { data: walkInPatients, error: walkInError } = await supabaseAdmin
      .from('walk_in_patients')
      .select('id, name, phone, notes, created_at')
      .order('name', { ascending: true });

    if (walkInError) return res.status(500).json({ error: walkInError.message });

    // Normalise walk-in patients to have the same shape as registered
    const normalisedRegistered = (registeredPatients || []).map((p) => ({
      id: p.id,
      name: p.full_name,
      email: p.email || null,
      phone: p.phone || null,
      type: 'registered',
      created_at: p.created_at,
    }));

    const normalisedWalkIn = (walkInPatients || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: null,
      phone: p.phone || null,
      notes: p.notes || null,
      type: 'walk_in',
      created_at: p.created_at,
    }));

    // Merge and sort by name
    const combined = [...normalisedRegistered, ...normalisedWalkIn].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );

    return res.json({ patients: combined });
  } catch (err) {
    console.error('GET /patients error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id/bookings
// Returns booking history for a patient (profile id or walk-in id)
router.get('/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        therapist:therapists(id, name, specialization),
        bed:beds(id, bed_number)
      `)
      .or(`patient_id.eq.${id},walk_in_patient_id.eq.${id}`)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ bookings: data });
  } catch (err) {
    console.error('GET /patients/:id/bookings error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/patients/walk-in
// Creates a new walk-in patient record
router.post('/walk-in', async (req, res) => {
  try {
    const { name, phone, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('walk_in_patients')
      .insert({ name, phone, notes: notes || null })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ patient: data });
  } catch (err) {
    console.error('POST /patients/walk-in error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/patients/:id
// Update patient info — works for both registered profiles and walk-in patients
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, full_name, phone, email, notes, type } = req.body;

    // Determine if this is a walk-in or registered patient
    const patientType = type || 'registered';

    if (patientType === 'walk_in') {
      const updatePayload = {};
      if (name) updatePayload.name = name;
      if (phone) updatePayload.phone = phone;
      if (notes !== undefined) updatePayload.notes = notes;

      const { data, error } = await supabaseAdmin
        .from('walk_in_patients')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Walk-in patient not found' });

      return res.json({ patient: data });
    } else {
      // Registered patient — update profiles table
      const updatePayload = {};
      if (full_name || name) updatePayload.full_name = full_name || name;
      if (phone) updatePayload.phone = phone;
      if (email) updatePayload.email = email;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Patient not found' });

      return res.json({ patient: data });
    }
  } catch (err) {
    console.error('PUT /patients/:id error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
