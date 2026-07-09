const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All therapist routes require authentication
router.use(authMiddleware);

// GET /api/therapists
// Returns all therapists
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ therapists: data });
  } catch (err) {
    console.error('GET /therapists error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/therapists
// Creates a new therapist
router.post('/', async (req, res) => {
  try {
    const { name, specialization, email, phone, bio, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('therapists')
      .insert({
        name,
        specialization: specialization || null,
        email: email || null,
        phone: phone || null,
        bio: bio || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ therapist: data });
  } catch (err) {
    console.error('POST /therapists error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/therapists/:id
// Updates an existing therapist
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialization, email, phone, bio, is_active } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (specialization !== undefined) updatePayload.specialization = specialization;
    if (email !== undefined) updatePayload.email = email;
    if (phone !== undefined) updatePayload.phone = phone;
    if (bio !== undefined) updatePayload.bio = bio;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('therapists')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Therapist not found' });

    return res.json({ therapist: data });
  } catch (err) {
    console.error('PUT /therapists/:id error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/therapists/:id
// Deletes a therapist
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('therapists')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Therapist not found' });

    return res.json({ message: 'Therapist deleted successfully', therapist: data });
  } catch (err) {
    console.error('DELETE /therapists/:id error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
