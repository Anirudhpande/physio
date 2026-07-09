const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
// Accepts { email, password }, returns session
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Fetch the user's profile to include role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    return res.json({
      session: data.session,
      user: {
        ...data.user,
        profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — protected
// Returns current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: error.message });
    }

    return res.json({ user: profile });
  } catch (err) {
    console.error('Get me error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
