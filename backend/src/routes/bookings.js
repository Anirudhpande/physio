const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All bookings routes require authentication
router.use(authMiddleware);

// GET /api/bookings
// Query params: date, therapist_id, patient_id, status
router.get('/', async (req, res) => {
  try {
    const { date, therapist_id, patient_id, status } = req.query;

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        patient:profiles!bookings_patient_id_fkey(id, full_name, email, phone),
        walk_in_patient:walk_in_patients(id, name, phone, notes),
        therapist:therapists(id, name, specialization),
        bed:beds(id, bed_number)
      `)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) query = query.eq('booking_date', date);
    if (therapist_id) query = query.eq('therapist_id', therapist_id);
    if (patient_id) {
      // Could be either a profile patient or a walk-in patient
      query = query.or(`patient_id.eq.${patient_id},walk_in_patient_id.eq.${patient_id}`);
    }
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ bookings: data });
  } catch (err) {
    console.error('GET /bookings error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/slots?date=YYYY-MM-DD&therapist_id=...
// Calls get_available_slots() Supabase RPC
router.get('/slots', async (req, res) => {
  try {
    const { date, therapist_id } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required' });
    }

    const { data, error } = await supabaseAdmin.rpc('get_available_slots', {
      p_date: date,
      ...(therapist_id ? { p_therapist_id: therapist_id } : {}),
    });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ slots: data });
  } catch (err) {
    console.error('GET /bookings/slots error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings
// Creates a single booking (registered patient or walk-in)
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      therapist_id,
      booking_date,
      start_time,
      end_time,
      is_walk_in,
      walk_in_name,
      walk_in_phone,
      bed_id,
      notes,
    } = req.body;

    if (!therapist_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'therapist_id, booking_date, start_time, and end_time are required',
      });
    }

    let walkInPatientId = null;

    // Handle walk-in patients
    if (is_walk_in) {
      if (!walk_in_name || !walk_in_phone) {
        return res.status(400).json({
          error: 'walk_in_name and walk_in_phone are required for walk-in bookings',
        });
      }

      // Create or find existing walk-in patient
      const { data: walkIn, error: walkInError } = await supabaseAdmin
        .from('walk_in_patients')
        .insert({ name: walk_in_name, phone: walk_in_phone })
        .select()
        .single();

      if (walkInError) return res.status(500).json({ error: walkInError.message });
      walkInPatientId = walkIn.id;
    }

    // Try the book_appointment RPC first
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('book_appointment', {
      p_patient_id: is_walk_in ? null : patient_id,
      p_therapist_id: therapist_id,
      p_booking_date: booking_date,
      p_start_time: start_time,
      p_end_time: end_time,
      p_bed_id: bed_id || null,
      p_notes: notes || null,
      p_walk_in_patient_id: walkInPatientId,
    });

    if (rpcError) {
      // Fallback: direct insert
      const insertPayload = {
        therapist_id,
        booking_date,
        start_time,
        end_time,
        status: 'booked',
        notes: notes || null,
        bed_id: bed_id || null,
      };

      if (is_walk_in) {
        insertPayload.walk_in_patient_id = walkInPatientId;
      } else {
        insertPayload.patient_id = patient_id;
      }

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('bookings')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) return res.status(500).json({ error: insertError.message });
      return res.status(201).json({ booking: inserted });
    }

    return res.status(201).json({ booking: rpcData });
  } catch (err) {
    console.error('POST /bookings error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/bulk
// Creates multiple bookings across multiple dates
router.post('/bulk', async (req, res) => {
  try {
    const { patient_id, therapist_id, dates, start_time, end_time, bed_id, notes } = req.body;

    if (!patient_id || !therapist_id || !dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        error: 'patient_id, therapist_id, and dates[] are required',
      });
    }

    const { data, error } = await supabaseAdmin.rpc('book_bulk_appointments', {
      p_patient_id: patient_id,
      p_therapist_id: therapist_id,
      p_dates: dates,
      p_start_time: start_time,
      p_end_time: end_time,
      p_bed_id: bed_id || null,
      p_notes: notes || null,
    });

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ bookings: data });
  } catch (err) {
    console.error('POST /bookings/bulk error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/status
// Updates booking status: 'cancelled' | 'completed' | 'booked'
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['cancelled', 'completed', 'booked'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Booking not found' });

    return res.json({ booking: data });
  } catch (err) {
    console.error('PATCH /bookings/:id/status error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/reschedule
// Reschedules a booking to a new date/time
router.patch('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_date, start_time, end_time } = req.body;

    if (!booking_date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'booking_date, start_time, and end_time are required',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ booking_date, start_time, end_time, status: 'booked' })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Booking not found' });

    return res.json({ booking: data });
  } catch (err) {
    console.error('PATCH /bookings/:id/reschedule error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/bulk/:bulk_booking_id
// Query params: mode ('single' | 'remaining' | 'all'), from_date (required for 'remaining')
router.delete('/bulk/:bulk_booking_id', async (req, res) => {
  try {
    const { bulk_booking_id } = req.params;
    const { mode, from_date } = req.query;

    const allowedModes = ['single', 'remaining', 'all'];
    if (!mode || !allowedModes.includes(mode)) {
      return res.status(400).json({
        error: `mode must be one of: ${allowedModes.join(', ')}`,
      });
    }

    let query = supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('bulk_booking_id', bulk_booking_id);

    if (mode === 'all') {
      // Cancel all bookings in this bulk group
      // no extra filter needed
    } else if (mode === 'remaining') {
      if (!from_date) {
        return res.status(400).json({ error: 'from_date is required for remaining mode' });
      }
      query = query.gte('booking_date', from_date).neq('status', 'completed');
    } else if (mode === 'single') {
      // In 'single' mode, from_date is used as the exact date to cancel
      if (!from_date) {
        return res.status(400).json({ error: 'from_date is required for single mode' });
      }
      query = query.eq('booking_date', from_date);
    }

    const { data, error } = await query.select();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ cancelled: data, count: data.length });
  } catch (err) {
    console.error('DELETE /bookings/bulk/:bulk_booking_id error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
