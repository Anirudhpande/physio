require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const bookingsRoutes = require('./routes/bookings');
const patientsRoutes = require('./routes/patients');
const therapistsRoutes = require('./routes/therapists');
const bedsRoutes = require('./routes/beds');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/therapists', therapistsRoutes);
app.use('/api/beds', bedsRoutes);
app.use('/api/settings', settingsRoutes);

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  return res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`PhysioCare Backend running on port ${PORT}`);
});

module.exports = app;
