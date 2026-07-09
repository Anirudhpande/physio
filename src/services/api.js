// Frontend API service — all calls go through the Express backend
// Falls back to direct Supabase calls if VITE_BACKEND_URL is not set (local dev without backend)

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email, password) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: (token) => request('/api/auth/me', {}, token),
  },

  // ─── Bookings ─────────────────────────────────────────────────────────────
  bookings: {
    list: (token, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/api/bookings${q ? '?' + q : ''}`, {}, token);
    },
    slots: (token, date) => request(`/api/bookings/slots?date=${date}`, {}, token),
    create: (token, body) =>
      request('/api/bookings', { method: 'POST', body: JSON.stringify(body) }, token),
    createBulk: (token, body) =>
      request('/api/bookings/bulk', { method: 'POST', body: JSON.stringify(body) }, token),
    updateStatus: (token, id, status) =>
      request(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token),
    reschedule: (token, id, body) =>
      request(`/api/bookings/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(body) }, token),
    cancelBulk: (token, bulk_booking_id, mode, from_date) => {
      const q = new URLSearchParams({ mode, ...(from_date ? { from_date } : {}) }).toString();
      return request(`/api/bookings/bulk/${bulk_booking_id}?${q}`, { method: 'DELETE' }, token);
    },
  },

  // ─── Patients ─────────────────────────────────────────────────────────────
  patients: {
    list: (token) => request('/api/patients', {}, token),
    bookings: (token, id) => request(`/api/patients/${id}/bookings`, {}, token),
    createWalkIn: (token, body) =>
      request('/api/patients/walk-in', { method: 'POST', body: JSON.stringify(body) }, token),
    update: (token, id, body) =>
      request(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  },

  // ─── Therapists ───────────────────────────────────────────────────────────
  therapists: {
    list: (token) => request('/api/therapists', {}, token),
    create: (token, body) =>
      request('/api/therapists', { method: 'POST', body: JSON.stringify(body) }, token),
    update: (token, id, body) =>
      request(`/api/therapists/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
    delete: (token, id) =>
      request(`/api/therapists/${id}`, { method: 'DELETE' }, token),
  },

  // ─── Beds ─────────────────────────────────────────────────────────────────
  beds: {
    list: (token) => request('/api/beds', {}, token),
    create: (token, body) =>
      request('/api/beds', { method: 'POST', body: JSON.stringify(body) }, token),
    update: (token, id, body) =>
      request(`/api/beds/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
    delete: (token, id) =>
      request(`/api/beds/${id}`, { method: 'DELETE' }, token),
  },

  // ─── Settings ─────────────────────────────────────────────────────────────
  settings: {
    get: (token) => request('/api/settings', {}, token),
    update: (token, body) =>
      request('/api/settings', { method: 'PUT', body: JSON.stringify(body) }, token),
  },
};
