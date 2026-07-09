const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All bed routes require authentication
router.use(authMiddleware);

// GET /api/beds
// Returns all beds
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('beds')
      .select('*')
      .order('bed_number', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ beds: data });
  } catch (err) {
    console.error('GET /beds error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/beds
// Creates a new bed
router.post('/', async (req, res) => {
  try {
    const { bed_number, status, notes } = req.body;

    if (!bed_number) {
      return res.status(400).json({ error: 'bed_number is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('beds')
      .insert({
        bed_number,
        status: status || 'available',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ bed: data });
  } catch (err) {
    console.error('POST /beds error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/beds/:id
// Updates bed status or number
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bed_number, status, notes } = req.body;

    const updatePayload = {};
    if (bed_number !== undefined) updatePayload.bed_number = bed_number;
    if (status !== undefined) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('beds')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Bed not found' });

    return res.json({ bed: data });
  } catch (err) {
    console.error('PATCH /beds/:id error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/beds/:id
// Deletes a bed
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('beds')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Bed not found' });

    return res.json({ message: 'Bed deleted successfully', bed: data });
  } catch (err) {
    console.error('DELETE /beds/:id error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
