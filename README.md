# PhysioCare - Production-Ready Physiotherapy Clinic Management Platform

PhysioCare is a modern, SaaS-style clinic management application. It features a marketing landing page, a patient booking portal with dynamic real-time slot availability, and an administrator control panel for bed allocation, therapist registries, and clinical stats.

---

## Technical Architecture

* **Frontend**: React 18, Vite, Tailwind CSS v3, React Router v6, TanStack React Query v5
* **Backend & Database**: Supabase, PostgreSQL, Row Level Security (RLS)
* **Authentication**: Supabase Auth (with automatic trigger-based profile mapping)
* **Realtime Synchronization**: Supabase Realtime (Replication enabled for bookings, beds, and therapists)

---

## Complete Folder Structure

```
physio/
├── supabase_schema.sql         # SQL script containing table definitions, RLS, functions & seeds
├── tailwind.config.js          # Tailwind CSS v3 configuration
├── postcss.config.js           # PostCSS configuration
├── vite.config.js              # Vite compiler configuration
├── index.html                  # HTML5 entrypoint with Google Fonts and SEO tags
├── package.json                # Project dependencies
├── README.md                   # Setup & deployment guide
└── src/
    ├── index.css               # Global stylesheet with Tailwind directives
    ├── App.css                 # Stylings overrides
    ├── main.jsx                # DOM mount entrypoint
    ├── App.jsx                 # Routing and Provider registrations
    ├── services/
    │   └── supabase.js         # Supabase client instantiation
    ├── context/
    │   └── AuthContext.jsx     # Auth state, session observer, login/register helpers
    ├── components/
    │   ├── ProtectedRoute.jsx  # secured route guard enforcing role permission sets
    │   ├── Layout.jsx          # Shared glassmorphic header layout wrapper
    │   └── Navbar.jsx          # Desktop & Mobile responsive navigation with dark-mode toggle
    └── pages/
        ├── LandingPage.jsx     # Premium clinic homepage (Hero, services, testimonials, stats)
        ├── Login.jsx           # Secure auth portal (with patient/admin quick-fill buttons)
        ├── Register.jsx        # Account registration with role selections
        ├── PatientDashboard.jsx# Booking Wizard (Date -> Slot -> Staff -> Confirm) & History list
        ├── AdminDashboard.jsx  # Multi-tab admin panel (Stats, Google Calendar grid, Bed/Staff CRUD)
        └── NotFound.jsx        # Elegant 404 page
```

---

## Step-by-Step Setup Guide

### 1. Database & Backend Configuration (Supabase)

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor** tab in the left-hand menu.
3. Click **New Query**, paste the contents of `supabase_schema.sql` (found in the root directory of this project), and click **Run**.
   * *This will create the `profiles`, `therapists`, `beds`, and `bookings` tables.*
   * *It will configure database triggers for signup synchronization.*
   * *It will load the transactional booking and slots calculator functions.*
   * *It will enable RLS, set up policies, turn on Realtime replication, and seed demo records.*

### 2. Environment Variables (.env)

Create a file named `.env` in the root of this project and populate it with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

### 3. Local Development

1. Open your terminal in the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

## Verification & Testing Scenarios

We have seeded the database with default profiles to make testing immediate and seamless:

### 1. Booking Wizard (Patient Experience)
* Register a new patient account on `/register` or login using the **Use Patient Demo** button on `/login`.
* Click **Book Slots** in the navigation header to open the booking wizard.
* Select a Date → Choose a time slot (displays dynamic capacity counters like `"3 Slots Available"`) → Choose a therapist → Confirm.
* Under the hood, PostgreSQL queries all beds, locks a record using `FOR UPDATE SKIP LOCKED` to prevent concurrent write collisions, assigns the bed automatically, and records the booking.
* The newly booked slot immediately updates in the **Booking History** list with a `BOOKED` badge.

### 2. Double-Booking Prevention (Transactional Lock)
If you attempt to double-book a therapist or bed for an overlapping time interval, the database transaction rejects the insert with an error. 
* To verify: Book **Dr. Sarah Jenkins** for `10:00 AM - 11:00 AM`.
* Try to book her again for an overlapping slot (e.g. `10:30 AM - 11:30 AM`) on the same date. The UI will catch the PostgreSQL exception and display: *“Therapist is already booked during this time slot.”*

### 3. Realtime Slot Sync (Multi-Window test)
* Open the application in two side-by-side browser windows:
  * Window A: Logged in as a Patient.
  * Window B: Logged in as an Admin.
* Under Window B (Admin), change a bed status to **Blocked (Maintenance)** or mark a session **Completed**.
* Observe how Window A (Patient)'s slot capacity counters decrease or update in real-time, instantly adjusting clinic availability without reloading the page.

### 4. Admin Management Controls
* Log in as an Administrator using the **Use Admin Demo** button.
* View clinical occupancy charts, list upcoming bookings, reschedule sessions via the calendar grid, manage clinic beds, or add new therapists to the registry.

---

## Production Deployment

### Frontend Deployment (Vercel)

1. Commit your codebase to a GitHub repository.
2. Link your repository in [Vercel Dashboard](https://vercel.com).
3. Under **Environment Variables**, define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Click **Deploy**. Vercel will build and serve your SPA.
