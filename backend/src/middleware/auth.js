const { supabaseAdmin } = require('../lib/supabase');

/**
 * Auth middleware — verifies the Supabase JWT from the Authorization header,
 * fetches the user's profile, and attaches req.user = { id, email, role }.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the JWT with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch the profile to get the user's role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

module.exports = authMiddleware;
