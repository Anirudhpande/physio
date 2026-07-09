const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All settings routes require authentication
router.use(authMiddleware);

// GET /api/settings
// Returns clinic_settings as a flat key-value object
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('clinic_settings')
      .select('key, value');

    if (error) return res.status(500).json({ error: error.message });

    // Convert array of { key, value } rows into a plain object
    const settings = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value;
    });

    return res.json({ settings });
  } catch (err) {
    console.error('GET /settings error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
// Upserts each provided setting key-value pair
router.put('/', async (req, res) => {
  try {
    const { clinic_start_time, clinic_end_time, clinic_name, ...rest } = req.body;

    const upsertData = [];

    if (clinic_start_time !== undefined) {
      upsertData.push({ key: 'clinic_start_time', value: clinic_start_time });
    }
    if (clinic_end_time !== undefined) {
      upsertData.push({ key: 'clinic_end_time', value: clinic_end_time });
    }
    if (clinic_name !== undefined) {
      upsertData.push({ key: 'clinic_name', value: clinic_name });
    }

    // Also handle any extra arbitrary keys passed in the body
    Object.entries(rest).forEach(([key, value]) => {
      upsertData.push({ key, value: String(value) });
    });

    if (upsertData.length === 0) {
      return res.status(400).json({ error: 'No settings provided to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('clinic_settings')
      .upsert(upsertData, { onConflict: 'key' })
      .select();

    if (error) return res.status(500).json({ error: error.message });

    // Return updated settings as flat object
    const settings = {};
    (data || []).forEach((row) => {
      settings[row.key] = row.value;
    });

    return res.json({ settings });
  } catch (err) {
    console.error('PUT /settings error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
