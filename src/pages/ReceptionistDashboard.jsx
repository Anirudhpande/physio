import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import {
  LayoutDashboard, CalendarDays, Users, Stethoscope, BedDouble,
  BarChart3, Settings, LogOut, Plus, Search, ChevronLeft,
  ChevronRight, X, CheckCircle2, XCircle, Clock, AlertCircle,
  Phone, Mail, RefreshCw, Trash2, Edit3, Activity, HeartPulse,
  Package, UserPlus, Filter, TrendingUp, Loader2, ArrowRight,
  Calendar, Check
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};
const today = () => new Date().toISOString().split('T')[0];
const COLORS = ['#10B981', '#0EA5E9', '#EF4444', '#F59E0B'];
const SLOT_HOURS = ['09','10','11','12','13','14','15','16'];

const STATUS_STYLES = {
  booked:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  useEffect(() => { if (toast) { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t); } }, [toast]);
  if (!toast) return null;
  const bg = toast.type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 ${bg} text-white text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2`}>
      {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {toast.msg}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'today',     icon: LayoutDashboard, label: "Today's View" },
  { id: 'book',      icon: CalendarDays,    label: 'Book Appointment' },
  { id: 'schedule',  icon: Calendar,        label: 'Schedule' },
  { id: 'patients',  icon: Users,           label: 'Patients' },
  { id: 'therapists',icon: Stethoscope,     label: 'Therapists' },
  { id: 'beds',      icon: BedDouble,       label: 'Beds' },
  { id: 'reports',   icon: BarChart3,       label: 'Reports' },
  { id: 'settings',  icon: Settings,        label: 'Settings' },
];

function Sidebar({ active, setActive, profile, onSignOut }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950 border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-medical-500 flex items-center justify-center">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="font-black text-white text-lg tracking-tight">
            Physio<span className="text-medical-400">Care</span>
          </span>
        </div>
        <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Receptionist Portal</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              active === id
                ? 'bg-medical-500 text-white shadow-lg shadow-medical-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-medical-500/20 flex items-center justify-center text-medical-400 font-black text-sm">
            {profile?.name?.[0]?.toUpperCase() || 'R'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-bold truncate">{profile?.name || 'Receptionist'}</div>
            <div className="text-slate-500 text-[10px] capitalize">{profile?.role}</div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 text-slate-500 hover:text-red-400 text-xs font-semibold py-2 px-3 rounded-xl hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── TODAY'S VIEW ─────────────────────────────────────────────────────────────
function TodayView({ bookings, beds, therapists, onBookSlot, onCancelBooking, onCompleteBooking, showToast, token }) {
  const todayStr = today();
  const todayBookings = bookings.filter(b => b.booking_date === todayStr);
  const stats = [
    { label: 'Total Sessions', val: todayBookings.length, color: 'text-slate-300' },
    { label: 'Active', val: todayBookings.filter(b => b.status === 'booked').length, color: 'text-blue-400' },
    { label: 'Completed', val: todayBookings.filter(b => b.status === 'completed').length, color: 'text-green-400' },
    { label: 'Cancelled', val: todayBookings.filter(b => b.status === 'cancelled').length, color: 'text-red-400' },
    { label: 'Available Beds', val: beds.filter(b => b.status === 'available').length, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Today's View</h1>
          <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        <button onClick={() => onBookSlot()} className="flex items-center gap-2 bg-medical-500 hover:bg-medical-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all">
          <Plus className="h-4 w-4" /> Quick Book
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
            <div className={`text-3xl font-black mt-1 ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Session List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-white text-sm">Today's Appointments</h2>
          <span className="text-xs text-slate-400">{todayBookings.length} total</span>
        </div>
        {todayBookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No appointments today</p>
            <button onClick={() => onBookSlot()} className="mt-4 text-medical-500 text-xs font-bold hover:underline">Book the first one →</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayBookings.sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(bk => (
              <div key={bk.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="text-center min-w-[52px]">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">{fmt(bk.start_time)}</div>
                  <div className="text-[10px] text-slate-400">—{fmt(bk.end_time)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {bk.patient?.name || bk.walk_in_patient?.name || 'Walk-in'}
                    {bk.bulk_booking_id && <span className="ml-2 text-[10px] text-blue-500 font-black">📦 PKG</span>}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{bk.therapist?.name} · {bk.bed?.bed_number}</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[bk.status]}`}>{bk.status}</span>
                {bk.status === 'booked' && (
                  <div className="flex gap-1.5">
                    <button onClick={() => onCompleteBooking(bk.id)} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors" title="Mark Complete">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => onCancelBooking(bk)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Cancel">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOOK APPOINTMENT ─────────────────────────────────────────────────────────
function BookAppointment({ therapists, patients, token, onSuccess, showToast }) {
  const [mode, setMode] = useState('single'); // single | bulk
  const [step, setStep] = useState(1);

  // Patient
  const [patientMode, setPatientMode] = useState('registered'); // registered | walkin
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Schedule
  const [date, setDate] = useState(today());
  const [slot, setSlot] = useState('');
  const [therapist, setTherapist] = useState('');

  // Bulk
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkFreq, setBulkFreq] = useState('daily');
  const [bulkDates, setBulkDates] = useState([]);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch)
  );

  // Fetch available slots
  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    supabase.rpc('get_available_slots', { p_date: date })
      .then(({ data }) => setSlots(data || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  // Compute bulk dates
  useEffect(() => {
    if (mode !== 'bulk' || !date) return;
    const dates = [];
    let cur = new Date(date);
    while (dates.length < bulkCount) {
      const d = cur.toISOString().split('T')[0];
      if (bulkFreq === 'daily') dates.push(d);
      else if (bulkFreq === 'weekdays' && cur.getDay() !== 0 && cur.getDay() !== 6) dates.push(d);
      else if (bulkFreq === 'alternate' && dates.length % 2 === 0) dates.push(d);
      if (bulkFreq === 'alternate') { cur.setDate(cur.getDate() + 2); continue; }
      cur.setDate(cur.getDate() + 1);
    }
    setBulkDates(dates);
  }, [mode, date, bulkCount, bulkFreq]);

  const canProceed = () => {
    if (step === 1) return selectedPatient || (patientMode === 'walkin' && walkInName.trim());
    if (step === 2) return date && slot;
    if (step === 3) return therapist;
    return false;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const [start_time, end_time] = slot.split('|');
      if (mode === 'single') {
        const body = {
          therapist_id: therapist,
          booking_date: date,
          start_time,
          end_time,
          ...(patientMode === 'registered'
            ? { patient_id: selectedPatient.id }
            : { is_walk_in: true, walk_in_name: walkInName, walk_in_phone: walkInPhone })
        };
        await supabase.rpc('book_appointment', {
          p_patient_id: selectedPatient?.id || null,
          p_therapist_id: therapist,
          p_booking_date: date,
          p_start_time: start_time,
          p_end_time: end_time
        });
        showToast('success', 'Appointment booked successfully!');
      } else {
        await supabase.rpc('book_bulk_appointments', {
          p_patient_id: selectedPatient?.id,
          p_therapist_id: therapist,
          p_dates: bulkDates,
          p_start_time: start_time,
          p_end_time: end_time
        });
        showToast('success', `Recovery package of ${bulkCount} sessions booked!`);
      }
      onSuccess();
      setStep(1); setSelectedPatient(null); setWalkInName(''); setWalkInPhone(''); setSlot(''); setTherapist('');
    } catch (err) {
      showToast('error', err.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Patient', 'Date & Slot', 'Therapist', 'Confirm'];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Book Appointment</h1>
        <p className="text-sm text-slate-500 mt-0.5">Book a session for a patient</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
        {[['single','Single Session'],['bulk','Recovery Package']].map(([m,l]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode===m ? 'bg-white dark:bg-slate-700 text-medical-600 dark:text-medical-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {m === 'bulk' && '📦 '}{l}
          </button>
        ))}
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {stepLabels.map((l, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step > i+1 ? 'text-green-500' : step === i+1 ? 'text-medical-500' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step > i+1 ? 'bg-green-500 text-white' : step === i+1 ? 'bg-medical-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                {step > i+1 ? <Check className="h-3 w-3" /> : i+1}
              </div>
              <span className="hidden sm:block">{l}</span>
            </div>
            {i < stepLabels.length-1 && <div className={`flex-1 h-px ${step > i+1 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 space-y-5">

        {/* STEP 1: Patient */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Select Patient</h3>
            <div className="flex gap-2">
              {[['registered','Registered Patient'],['walkin','Walk-in / New']].map(([m,l]) => (
                <button key={m} onClick={() => setPatientMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${patientMode===m ? 'bg-medical-500 text-white border-medical-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
                  {l}
                </button>
              ))}
            </div>

            {patientMode === 'registered' ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Search by name or phone..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {filteredPatients.slice(0, 20).map(p => (
                    <button key={p.id} onClick={() => setSelectedPatient(p)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${selectedPatient?.id === p.id ? 'border-medical-500 bg-medical-50 dark:bg-medical-900/20 text-medical-700 dark:text-medical-400' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.phone || p.email}</div>
                    </button>
                  ))}
                  {filteredPatients.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No patients found</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="Patient full name *" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
                <input value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} placeholder="Phone number (optional)" className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Date & Slot */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Date & Time Slot</h3>
            <input type="date" value={date} min={today()} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />

            {mode === 'bulk' && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100/50 rounded-2xl">
                <div>
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Sessions</label>
                  <select value={bulkCount} onChange={e => setBulkCount(+e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none">
                    {[3,5,7,10,14,15,20,30].map(n => <option key={n} value={n}>{n} sessions</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Frequency</label>
                  <select value={bulkFreq} onChange={e => setBulkFreq(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none">
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="alternate">Alternate Days</option>
                  </select>
                </div>
                {bulkDates.length > 0 && (
                  <div className="col-span-2 text-xs text-blue-600 dark:text-blue-400">
                    <span className="font-bold">Scheduled: </span>
                    {bulkDates[0]} → {bulkDates[bulkDates.length-1]}
                    <span className="ml-2 text-slate-400">({bulkDates.length} sessions)</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Available Slots</div>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-4"><Loader2 className="h-4 w-4 animate-spin" /> Checking availability...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {slots.map(s => (
                    <button key={s.slot_start}
                      disabled={s.available_slots === 0}
                      onClick={() => setSlot(`${s.slot_start}|${s.slot_end}`)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        slot === `${s.slot_start}|${s.slot_end}` ? 'bg-medical-500 text-white border-medical-500'
                        : s.available_slots === 0 ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-medical-400 hover:text-medical-600'
                      }`}>
                      {fmt(s.slot_start)}<br/>
                      <span className="text-[9px] opacity-70">{s.available_slots} open</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Therapist */}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-white">Select Therapist</h3>
            <div className="grid grid-cols-1 gap-2">
              {therapists.map(t => (
                <button key={t.id} onClick={() => setTherapist(t.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border flex items-center gap-3 transition-all ${therapist === t.id ? 'border-medical-500 bg-medical-50 dark:bg-medical-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                    {t.profile_image ? <img src={t.profile_image} alt="" className="w-full h-full object-cover" /> : <Stethoscope className="h-4 w-4 m-2.5 text-slate-400" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.specialization}</div>
                  </div>
                  {therapist === t.id && <Check className="h-4 w-4 text-medical-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Confirm Booking</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Patient</span><span className="font-bold">{selectedPatient?.name || walkInName} {patientMode === 'walkin' && <span className="text-[10px] text-amber-500 ml-1">WALK-IN</span>}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="font-bold capitalize">{mode === 'bulk' ? `📦 ${bulkCount}-Session Package` : 'Single Session'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-bold">{mode === 'bulk' ? `${bulkDates[0]} → ${bulkDates[bulkDates.length-1]}` : date}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-bold">{slot && fmt(slot.split('|')[0])} – {slot && fmt(slot.split('|')[1])}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Therapist</span><span className="font-bold">{therapists.find(t => t.id === therapist)?.name}</span></div>
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-medical-500 hover:bg-medical-600 text-white font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-60">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Booking...</> : <><Check className="h-4 w-4" /> Confirm Booking</>}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1}
            className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 4 && (
            <button onClick={() => setStep(s => s+1)} disabled={!canProceed()}
              className="flex items-center gap-1 text-sm font-bold text-medical-500 hover:text-medical-600 disabled:opacity-30 transition-colors">
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE VIEW ────────────────────────────────────────────────────────────
function ScheduleView({ bookings, therapists, onCancelBooking, onCompleteBooking }) {
  const [viewDate, setViewDate] = useState(today());
  const [therapistFilter, setTherapistFilter] = useState('all');

  const dayBookings = bookings.filter(b => {
    const matchDate = b.booking_date === viewDate;
    const matchTh = therapistFilter === 'all' || b.therapist?.id === therapistFilter || b.therapist_id === therapistFilter;
    return matchDate && matchTh;
  });

  const changeDay = (d) => {
    const dt = new Date(viewDate);
    dt.setDate(dt.getDate() + d);
    setViewDate(dt.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">Full appointment calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={therapistFilter} onChange={e => setTherapistFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none">
            <option value="all">All Therapists</option>
            {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-3 w-fit">
        <button onClick={() => changeDay(-1)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
        <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)}
          className="text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none" />
        <button onClick={() => changeDay(1)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronRight className="h-4 w-4" /></button>
        <button onClick={() => setViewDate(today())} className="text-xs font-bold text-medical-500 hover:text-medical-600">Today</button>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden">
        {dayBookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No appointments on this date</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dayBookings.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(bk => (
              <div key={bk.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group transition-colors">
                <div className="text-center min-w-[60px]">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">{fmt(bk.start_time)}</div>
                  <div className="text-[10px] text-slate-400">{fmt(bk.end_time)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {bk.patient?.name || bk.walk_in_patient?.name || 'Walk-in'}
                    {bk.bulk_booking_id && <span className="text-[10px] bg-blue-100 text-blue-600 font-black px-2 py-0.5 rounded-full">📦 Package</span>}
                  </div>
                  <div className="text-xs text-slate-400">{bk.therapist?.name} · {bk.bed?.bed_number}</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[bk.status]}`}>{bk.status}</span>
                {bk.status === 'booked' && (
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onCompleteBooking(bk.id)} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20" title="Complete"><CheckCircle2 className="h-4 w-4" /></button>
                    <button onClick={() => onCancelBooking(bk)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20" title="Cancel"><XCircle className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
function PatientsView({ patients, bookings }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const patientBookings = selected
    ? bookings.filter(b => b.patient_id === selected.id || b.walk_in_patient_id === selected.id)
    : [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Patients</h1>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(p => (
              <button key={p.id} onClick={() => setSelected(p)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${selected?.id === p.id ? 'bg-medical-50 dark:bg-medical-900/20' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-black text-sm shrink-0">
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                    <div className="text-xs text-slate-400 truncate">{p.phone || p.email || 'Walk-in'}</div>
                  </div>
                  {!p.email && <span className="ml-auto text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded">Walk-in</span>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No patients found</p>}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <Users className="h-12 w-12 mb-3 opacity-25" />
              <p className="text-sm font-medium">Select a patient to view their details</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-medical-100 dark:bg-medical-900/30 flex items-center justify-center text-medical-600 font-black text-xl">
                  {selected.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{selected.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {selected.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span>}
                    {selected.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Total Sessions', patientBookings.length],
                  ['Completed', patientBookings.filter(b=>b.status==='completed').length],
                  ['Upcoming', patientBookings.filter(b=>b.status==='booked').length],
                ].map(([l,v]) => (
                  <div key={l} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{v}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{l}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Booking History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {patientBookings.sort((a,b)=>b.booking_date.localeCompare(a.booking_date)).map(bk => (
                    <div key={bk.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-2.5 text-sm">
                      <div className="text-xs text-slate-500 font-mono min-w-[80px]">{bk.booking_date}</div>
                      <div className="flex-1 text-slate-700 dark:text-slate-300 font-medium">{bk.therapist?.name}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[bk.status]}`}>{bk.status}</span>
                    </div>
                  ))}
                  {patientBookings.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No bookings yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── THERAPISTS ───────────────────────────────────────────────────────────────
function TherapistsView({ therapists, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Therapists</h1>
        <button onClick={onAdd} className="flex items-center gap-2 bg-medical-500 hover:bg-medical-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all">
          <Plus className="h-4 w-4" /> Add Therapist
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {therapists.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                {t.profile_image ? <img src={t.profile_image} alt="" className="w-full h-full object-cover" /> : <Stethoscope className="h-5 w-5 m-3.5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{t.name}</div>
                <div className="text-xs text-slate-400">{t.specialization}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t.experience} yrs exp</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{fmt(t.shift_start)} – {fmt(t.shift_end)}</span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-medical-600 hover:bg-medical-50 dark:hover:bg-medical-900/20 py-1.5 rounded-lg transition-all">
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => onDelete(t)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 rounded-lg transition-all">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ))}
        {therapists.length === 0 && <p className="text-slate-400 text-sm col-span-full text-center py-12">No therapists registered yet.</p>}
      </div>
    </div>
  );
}

// ─── BEDS ─────────────────────────────────────────────────────────────────────
function BedsView({ beds, onAdd, onToggle, onDelete }) {
  const statusCfg = {
    available:   { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
    occupied:    { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
    maintenance: { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  };
  const statuses = ['available','occupied','maintenance'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Beds</h1>
          <p className="text-sm text-slate-500 mt-0.5">{beds.filter(b=>b.status==='available').length} of {beds.length} available</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-medical-500 hover:bg-medical-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all">
          <Plus className="h-4 w-4" /> Add Bed
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {beds.map(bed => {
          const cfg = statusCfg[bed.status] || statusCfg.available;
          return (
            <div key={bed.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <BedDouble className="h-6 w-6 text-slate-400" />
                <button onClick={() => onDelete(bed)} className="p-1 text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div>
                <div className="font-black text-sm text-slate-800 dark:text-slate-200">{bed.bed_number}</div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {bed.status}
                </span>
              </div>
              <select value={bed.status} onChange={e => onToggle(bed.id, e.target.value)}
                className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none">
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function ReportsView({ bookings, beds, therapists }) {
  const todayStr = today();
  const todayBookings = bookings.filter(b => b.booking_date === todayStr);

  const weeklyData = (() => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return days.map((name, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      return { name, Bookings: bookings.filter(b => b.booking_date === ds).length };
    });
  })();

  const bedData = [
    { name: 'Available', value: beds.filter(b=>b.status==='available').length },
    { name: 'Occupied', value: beds.filter(b=>b.status==='occupied').length },
    { name: 'Maintenance', value: beds.filter(b=>b.status==='maintenance').length },
  ];

  const stats = [
    { label: 'Total Bookings', val: bookings.length, color: 'text-slate-800 dark:text-white' },
    { label: 'Today', val: todayBookings.length, color: 'text-blue-500' },
    { label: 'Completed', val: bookings.filter(b=>b.status==='completed').length, color: 'text-green-500' },
    { label: 'Cancelled', val: bookings.filter(b=>b.status==='cancelled').length, color: 'text-red-500' },
    { label: 'Therapists', val: therapists.length, color: 'text-indigo-500' },
    { label: 'Total Beds', val: beds.length, color: 'text-slate-800 dark:text-white' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reports</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
            <div className={`text-3xl font-black mt-1 ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4">Weekly Bookings Trend</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(14,165,233,0.06)' }} />
                <Bar dataKey="Bookings" fill="#0EA5E9" radius={[6,6,0,0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 flex flex-col">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4">Bed Occupancy</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={bedData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {bedData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
            {bedData.map((d, i) => (
              <div key={d.name}>
                <span className="block font-black text-slate-800 dark:text-slate-200">{d.value}</span>
                <span className="text-slate-400 flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: COLORS[i] }} />{d.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsView({ token, showToast }) {
  const [startTime, setStartTime] = useState('09:00:00');
  const [endTime, setEndTime] = useState('17:00:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('clinic_settings').select('key,value').then(({ data }) => {
      if (!data) return;
      data.forEach(r => {
        if (r.key === 'clinic_start_time') setStartTime(r.value);
        if (r.key === 'clinic_end_time') setEndTime(r.value);
      });
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from('clinic_settings').upsert({ key: 'clinic_start_time', value: startTime });
      await supabase.from('clinic_settings').upsert({ key: 'clinic_end_time', value: endTime });
      showToast('success', 'Clinic settings saved!');
    } catch (err) {
      showToast('error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Settings</h1>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6">
        <h2 className="font-bold text-slate-800 dark:text-white mb-4">Clinic Operating Hours</h2>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Opening Time</label>
              <input type="time" value={startTime.slice(0,5)} onChange={e => setStartTime(e.target.value+':00')}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Closing Time</label>
              <input type="time" value={endTime.slice(0,5)} onChange={e => setEndTime(e.target.value+':00')}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-medical-500 hover:bg-medical-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-60">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── THERAPIST MODAL ──────────────────────────────────────────────────────────
function TherapistModal({ therapist, onClose, onSave }) {
  const [form, setForm] = useState(therapist || {
    name:'', specialization:'', experience:0, profile_image:'', shift_start:'09:00:00', shift_end:'17:00:00'
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (therapist?.id) {
        await supabase.from('therapists').update(form).eq('id', therapist.id);
      } else {
        await supabase.from('therapists').insert(form);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">{therapist ? 'Edit Therapist' : 'Add Therapist'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {[['name','Name','text'],['specialization','Specialization','text'],['profile_image','Photo URL','url']].map(([k,l,t]) => (
            <div key={k}>
              <label className="text-xs font-bold text-slate-400 uppercase">{l}</label>
              <input type={t} value={form[k]||''} onChange={e=>set(k,e.target.value)} required={k!=='profile_image'}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Experience (years)</label>
            <input type="number" min="0" value={form.experience||0} onChange={e=>set('experience',+e.target.value)}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['shift_start','Shift Start'],['shift_end','Shift End']].map(([k,l]) => (
              <div key={k}>
                <label className="text-xs font-bold text-slate-400 uppercase">{l}</label>
                <input type="time" value={(form[k]||'09:00:00').slice(0,5)} onChange={e=>set(k,e.target.value+':00')}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-medical-500 hover:bg-medical-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />{therapist ? 'Update' : 'Add Therapist'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── ADD BED MODAL ────────────────────────────────────────────────────────────
function AddBedModal({ onClose, onSave }) {
  const [bedNumber, setBedNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await supabase.from('beds').insert({ bed_number: bedNumber }); onSave(); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Add Bed</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={bedNumber} onChange={e=>setBedNumber(e.target.value)} placeholder="e.g. Bed F-1" required
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:border-medical-500" />
          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-medical-500 hover:bg-medical-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60">
            {saving ? 'Saving...' : 'Add Bed'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── CANCEL MODAL ─────────────────────────────────────────────────────────────
function CancelModal({ booking, bookings, onClose, onDone, showToast }) {
  const [mode, setMode] = useState('single');
  const [cancelling, setCancelling] = useState(false);
  const isPackage = !!booking?.bulk_booking_id;

  const confirm = async () => {
    setCancelling(true);
    try {
      if (mode === 'single' || !isPackage) {
        await supabase.from('bookings').update({ status:'cancelled' }).eq('id', booking.id);
        showToast('success', 'Booking cancelled.');
      } else if (mode === 'remaining') {
        const ids = bookings.filter(b => b.bulk_booking_id === booking.bulk_booking_id && b.status === 'booked' && b.booking_date >= booking.booking_date).map(b=>b.id);
        await supabase.from('bookings').update({ status:'cancelled' }).in('id', ids);
        showToast('success', `Cancelled ${ids.length} sessions.`);
      } else {
        const ids = bookings.filter(b => b.bulk_booking_id === booking.bulk_booking_id && b.status === 'booked').map(b=>b.id);
        await supabase.from('bookings').update({ status:'cancelled' }).in('id', ids);
        showToast('success', `Cancelled all ${ids.length} package sessions.`);
      }
      onDone();
    } catch (err) { showToast('error', 'Failed to cancel.'); }
    finally { setCancelling(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Cancel Appointment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-slate-500">Cancel appointment for <span className="font-bold text-slate-800 dark:text-slate-200">{booking?.patient?.name || booking?.walk_in_patient?.name || 'Walk-in'}</span> on <span className="font-semibold">{booking?.booking_date}</span>?</p>

        {isPackage && (
          <div className="space-y-2 p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5"><Package className="h-4 w-4" />Recovery Package Options</p>
            {[['single','📅 Only this session'],['remaining','⏳ This & future sessions'],['all','📦 Cancel entire package']].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)}
                className={`w-full text-left text-xs font-bold px-3 py-2 rounded-xl border transition-all ${mode===m ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {l}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 text-sm font-bold text-slate-500 hover:text-slate-700 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">Keep</button>
          <button onClick={confirm} disabled={cancelling} className="flex-1 text-sm font-bold bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl transition-all disabled:opacity-60">
            {cancelling ? 'Cancelling...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const { profile, signOut, getToken } = useAuth();
  const navigate = useNavigate ? useNavigate() : null;

  const [activeTab, setActiveTab] = useState('today');
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [cancelBooking, setCancelBooking] = useState(null);
  const [therapistModal, setTherapistModal] = useState(null); // null=closed, {}=new, {...}=edit
  const [addBedModal, setAddBedModal] = useState(false);

  const showToast = (type, msg) => setToast({ type, msg });

  const loadData = useCallback(async () => {
    try {
      const [bkRes, thRes, bdRes, ptRes] = await Promise.all([
        supabase.from('bookings').select(`id, booking_date, start_time, end_time, status, created_at, bulk_booking_id, patient_id, walk_in_patient_id, patient:patient_id(id,name,email,phone), therapist:therapist_id(id,name,specialization), bed:bed_id(id,bed_number), walk_in_patient:walk_in_patient_id(id,name,phone)`).order('booking_date', { ascending: false }),
        supabase.from('therapists').select('*').order('name'),
        supabase.from('beds').select('*').order('bed_number'),
        supabase.from('profiles').select('id,name,email,phone,role').eq('role','patient').order('name'),
      ]);
      setBookings(bkRes.data || []);
      setTherapists(thRes.data || []);
      setBeds(bdRes.data || []);
      setPatients(ptRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSignOut = async () => { await signOut(); window.location.href = '/login'; };
  const handleCompleteBooking = async (id) => {
    await supabase.from('bookings').update({ status:'completed' }).eq('id', id);
    showToast('success', 'Session marked as completed.');
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-medical-500 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white animate-pulse" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading clinic data...</p>
        </div>
      </div>
    );
  }

  const tabProps = { bookings, therapists, beds, patients, token: getToken(), showToast };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar active={activeTab} setActive={setActiveTab} profile={profile} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'today' && (
            <TodayView {...tabProps}
              onBookSlot={() => setActiveTab('book')}
              onCancelBooking={(bk) => setCancelBooking(bk)}
              onCompleteBooking={handleCompleteBooking}
            />
          )}
          {activeTab === 'book' && (
            <BookAppointment {...tabProps} onSuccess={() => { loadData(); setActiveTab('today'); }} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleView {...tabProps}
              onCancelBooking={(bk) => setCancelBooking(bk)}
              onCompleteBooking={handleCompleteBooking}
            />
          )}
          {activeTab === 'patients' && <PatientsView {...tabProps} />}
          {activeTab === 'therapists' && (
            <TherapistsView {...tabProps}
              onAdd={() => setTherapistModal({})}
              onEdit={(t) => setTherapistModal(t)}
              onDelete={async (t) => {
                if (!window.confirm(`Remove ${t.name}?`)) return;
                await supabase.from('therapists').delete().eq('id', t.id);
                showToast('success', `${t.name} removed.`);
                loadData();
              }}
            />
          )}
          {activeTab === 'beds' && (
            <BedsView {...tabProps}
              onAdd={() => setAddBedModal(true)}
              onToggle={async (id, status) => {
                await supabase.from('beds').update({ status }).eq('id', id);
                loadData();
              }}
              onDelete={async (bed) => {
                if (!window.confirm(`Remove ${bed.bed_number}?`)) return;
                await supabase.from('beds').delete().eq('id', bed.id);
                showToast('success', `${bed.bed_number} removed.`);
                loadData();
              }}
            />
          )}
          {activeTab === 'reports' && <ReportsView {...tabProps} />}
          {activeTab === 'settings' && <SettingsView {...tabProps} />}
        </div>
      </main>

      {/* Modals */}
      {cancelBooking && (
        <CancelModal
          booking={cancelBooking} bookings={bookings}
          onClose={() => setCancelBooking(null)}
          onDone={() => { setCancelBooking(null); loadData(); }}
          showToast={showToast}
        />
      )}
      {therapistModal !== null && (
        <TherapistModal
          therapist={therapistModal?.id ? therapistModal : null}
          onClose={() => setTherapistModal(null)}
          onSave={() => { setTherapistModal(null); showToast('success', 'Therapist saved!'); loadData(); }}
        />
      )}
      {addBedModal && (
        <AddBedModal
          onClose={() => setAddBedModal(false)}
          onSave={() => { setAddBedModal(false); showToast('success', 'Bed added!'); loadData(); }}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
