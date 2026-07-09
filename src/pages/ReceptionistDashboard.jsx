import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import {
  LayoutDashboard, CalendarDays, Users, Stethoscope, BedDouble,
  BarChart3, Settings, LogOut, Plus, Search, ChevronLeft,
  ChevronRight, X, CheckCircle2, XCircle, Clock, AlertCircle,
  Phone, Mail, Trash2, Edit3, Activity,
  Package, Check, Sun, Moon, Calendar, Loader2, ArrowRight
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

const STATUS_STYLES = {
  booked:    'bg-blue-500/10 text-blue-500 border border-blue-500/20 dark:bg-blue-950/30',
  completed: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 dark:bg-emerald-950/30',
  cancelled: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 dark:bg-rose-950/30',
};

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  useEffect(() => { if (toast) { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t); } }, [toast]);
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white text-sm font-semibold px-5 py-4 rounded-2xl shadow-2xl border border-white/10 animate-slide-up`}>
      {isSuccess ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
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

function Sidebar({ active, setActive, profile, onSignOut, theme, toggleTheme }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 dark:bg-slate-950 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col z-50 transition-colors duration-200">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-medical-400 to-medical-600 flex items-center justify-center shadow-lg shadow-medical-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-800 dark:text-white text-xl tracking-tight">
            Physio<span className="text-medical-500">Care</span>
          </span>
        </div>
        <div className="mt-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Receptionist Portal</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
              active === id
                ? 'bg-medical-500 text-white shadow-lg shadow-medical-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Theme Switcher & User Details */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <span>Theme</span>
          <button onClick={toggleTheme} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-white shadow-sm transition-all">
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
            <span className="capitalize">{theme}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-medical-500/10 text-medical-600 dark:text-medical-400 flex items-center justify-center font-bold text-sm">
            {profile?.name?.[0]?.toUpperCase() || 'R'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-slate-800 dark:text-white text-xs font-bold truncate">{profile?.name || 'Receptionist'}</div>
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">{profile?.role}</div>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── TODAY'S VIEW ─────────────────────────────────────────────────────────────
function TodayView({ bookings, beds, onBookSlot, onCancelBooking, onCompleteBooking }) {
  const todayStr = today();
  const todayBookings = bookings.filter(b => b.booking_date === todayStr);
  const activeCount = todayBookings.filter(b => b.status === 'booked').length;
  const completedCount = todayBookings.filter(b => b.status === 'completed').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;

  const stats = [
    { label: 'Today\'s Total', val: todayBookings.length, detail: 'Scheduled sessions', color: 'text-slate-800 dark:text-white' },
    { label: 'Active Sessions', val: activeCount, detail: 'In progress or upcoming', color: 'text-blue-500' },
    { label: 'Completed', val: completedCount, detail: 'Successfully treated', color: 'text-emerald-500' },
    { label: 'Available Beds', val: `${availableBeds}/${beds.length}`, detail: 'Ready for use', color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Today's View</h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-glow inline-block" />
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <button onClick={() => onBookSlot()} className="flex items-center gap-2 bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700 text-white text-sm font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-medical-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Plus className="h-4 w-4" /> Quick Appointment
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</div>
            <div className={`text-3xl font-black mt-2 tracking-tight ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">{s.detail}</div>
          </div>
        ))}
      </div>

      {/* Sessions */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800 dark:text-white text-base">Today's Schedule timeline</h2>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-3 py-1 rounded-xl">{todayBookings.length} bookings</span>
        </div>

        {todayBookings.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-20 text-medical-500" />
            <p className="text-sm font-semibold">No appointments scheduled for today</p>
            <p className="text-xs mt-1">Book walk-ins or select from registered patients</p>
            <button onClick={() => onBookSlot()} className="mt-5 inline-flex items-center gap-1 bg-medical-500/10 text-medical-600 dark:text-medical-400 text-xs font-bold hover:bg-medical-500/20 px-4 py-2 rounded-xl transition-all">
              Book First Appointment <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayBookings.sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(bk => (
              <div key={bk.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                {/* Time Indicator */}
                <div className="min-w-[64px] text-center">
                  <div className="text-sm font-black text-slate-850 dark:text-slate-200">{fmt(bk.start_time)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase mt-0.5">— {fmt(bk.end_time).split(' ')[0]}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {bk.patient?.name || bk.walk_in_patient?.name || 'Walk-in'}
                    {bk.bulk_booking_id && (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-500 font-extrabold px-2 py-0.5 rounded-full border border-blue-500/20">
                        <Package className="h-2.5 w-2.5" /> PACKAGE
                      </span>
                    )}
                    {!bk.patient_id && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/20">WALK-IN</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    {bk.therapist?.name} · <span className="text-slate-500 dark:text-slate-400">{bk.bed?.bed_number}</span>
                  </div>
                </div>

                {/* Status and Operations */}
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-xl capitalize tracking-wider ${STATUS_STYLES[bk.status]}`}>
                    {bk.status}
                  </span>
                  
                  {bk.status === 'booked' && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => onCompleteBooking(bk.id)} 
                        className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all active:scale-95" 
                        title="Complete Session"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </button>
                      <button 
                        onClick={() => onCancelBooking(bk)} 
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-95" 
                        title="Cancel Session"
                      >
                        <XCircle className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOOK APPOINTMENT ─────────────────────────────────────────────────────────
function BookAppointment({ therapists, patients, onSuccess, showToast }) {
  const [mode, setMode] = useState('single');
  const [step, setStep] = useState(1);

  // Patient parameters
  const [patientMode, setPatientMode] = useState('registered');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Slot parameters
  const [date, setDate] = useState(today());
  const [slot, setSlot] = useState('');
  const [therapist, setTherapist] = useState('');

  // Bulk parameters
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

  useEffect(() => {
    if (!date) return;
    const timer = setTimeout(() => setLoadingSlots(true), 0);
    supabase.rpc('get_available_slots', { p_date: date })
      .then(({ data }) => setSlots(data || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
    return () => clearTimeout(timer);
  }, [date]);

  useEffect(() => {
    if (mode !== 'bulk' || !date) return;
    const dates = [];
    let cur = new Date(date);
    while (dates.length < bulkCount) {
      const d = cur.toISOString().split('T')[0];
      const isSunday = cur.getDay() === 0;
      
      if (!isSunday) {
        if (bulkFreq === 'daily') dates.push(d);
        else if (bulkFreq === 'weekdays' && cur.getDay() !== 6) dates.push(d);
        else if (bulkFreq === 'alternate' && dates.length % 2 === 0) dates.push(d);
      }
      
      if (bulkFreq === 'alternate') {
        cur.setDate(cur.getDate() + 2);
      } else {
        cur.setDate(cur.getDate() + 1);
      }
    }
    const timer = setTimeout(() => setBulkDates(dates), 0);
    return () => clearTimeout(timer);
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
        let pId = selectedPatient?.id;
        
        if (patientMode === 'walkin') {
          const { data: wPat, error: wErr } = await supabase
            .from('walk_in_patients')
            .insert({ name: walkInName, phone: walkInPhone })
            .select()
            .single();
          if (wErr) throw wErr;
          
          await supabase.from('bookings').insert({
            walk_in_patient_id: wPat.id,
            therapist_id: therapist,
            booking_date: date,
            start_time,
            end_time,
            status: 'booked'
          });
        } else {
          await supabase.rpc('book_appointment', {
            p_patient_id: pId,
            p_therapist_id: therapist,
            p_booking_date: date,
            p_start_time: start_time,
            p_end_time: end_time
          });
        }
        showToast('success', 'Appointment successfully created!');
      } else {
        let pId = selectedPatient?.id;
        if (patientMode === 'walkin') {
          const { data: wPat, error: wErr } = await supabase
            .from('walk_in_patients')
            .insert({ name: walkInName, phone: walkInPhone })
            .select()
            .single();
          if (wErr) throw wErr;
          pId = wPat.id;
        }

        const res = await supabase.rpc('book_bulk_appointments', {
          p_patient_id: patientMode === 'registered' ? pId : null,
          p_therapist_id: therapist,
          p_booking_dates: bulkDates,
          p_start_time: start_time,
          p_end_time: end_time
        });
        
        // Handle walk-in updates for bulk booking if walk-in used (RPC books registered, so we manually assign walk_in_patient_id)
        if (patientMode === 'walkin' && res.data?.bulk_booking_id) {
          await supabase.from('bookings')
            .update({ walk_in_patient_id: pId, patient_id: null })
            .eq('bulk_booking_id', res.data.bulk_booking_id);
        }
        
        showToast('success', `Bulk recovery package (${bulkCount} sessions) booked!`);
      }
      onSuccess();
    } catch (err) {
      showToast('error', err.message || 'Failed to complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Select Patient', 'Schedule Slot', 'Assign Practitioner', 'Confirmation'];

  return (
    <div className="space-y-6 max-w-3xl animate-scale-in">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Book Appointment</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Easily book physiotherapy slots and recurring packages</p>
      </div>

      {/* Mode Selectors */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-900/60 p-1 border border-slate-200/50 dark:border-slate-800 rounded-2xl w-fit">
        {[['single','Single Treatment'],['bulk','Recovery Package']].map(([m,l]) => (
          <button key={m} onClick={() => { setMode(m); setStep(1); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${mode===m ? 'bg-white dark:bg-slate-800 text-medical-600 dark:text-medical-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {m === 'bulk' && '📦 '}{l}
          </button>
        ))}
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900/60 p-4 border border-slate-200/50 dark:border-slate-850 rounded-2xl">
        {stepLabels.map((l, i) => (
          <Fragment key={i}>
            <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${step > i+1 ? 'text-emerald-500' : step === i+1 ? 'text-medical-500' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${step > i+1 ? 'bg-emerald-500 text-white' : step === i+1 ? 'bg-medical-500 text-white ring-4 ring-medical-500/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {step > i+1 ? <Check className="h-3.5 w-3.5" /> : i+1}
              </div>
              <span className="hidden md:inline">{l}</span>
            </div>
            {i < stepLabels.length-1 && <div className={`flex-1 h-[2px] ${step > i+1 ? 'bg-emerald-500' : 'bg-slate-150 dark:bg-slate-800'}`} />}
          </Fragment>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm">

        {/* STEP 1: Patient Select */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Who is the patient?</h3>
              <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/40 dark:border-slate-750">
                {[['registered','Database Search'],['walkin','Quick Registration']].map(([m,l]) => (
                  <button type="button" key={m} onClick={() => { setPatientMode(m); setSelectedPatient(null); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${patientMode===m ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {patientMode === 'registered' ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Type name or contact number to search..." className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500 focus:ring-4 focus:ring-medical-500/5 transition-all" />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredPatients.slice(0, 15).map(p => (
                    <button type="button" key={p.id} onClick={() => setSelectedPatient(p)}
                      className={`w-full text-left px-5 py-3 rounded-2xl border text-sm transition-all flex items-center justify-between ${selectedPatient?.id === p.id ? 'border-medical-500 bg-medical-500/5 text-medical-600 dark:text-medical-455' : 'border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-750 bg-slate-50/20 dark:bg-slate-950/20'}`}>
                      <div>
                        <div className="font-bold text-slate-850 dark:text-slate-200">{p.name}</div>
                        <div className="text-xs text-slate-400 font-semibold mt-0.5">{p.phone || p.email}</div>
                      </div>
                      {selectedPatient?.id === p.id && <Check className="h-4 w-4 text-medical-500" />}
                    </button>
                  ))}
                  {filteredPatients.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-semibold">No registered patients match your search.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Patient Full Name</label>
                  <input value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Mobile Number</label>
                  <input value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} placeholder="Phone Number" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Slots */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Select date and treatment slot</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Treatment Start Date</label>
                <input type="date" value={date} min={today()} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
              </div>

              {mode === 'bulk' && (
                <div className="space-y-3 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl md:col-span-2 grid grid-cols-2 gap-3">
                  <div className="col-span-2 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-4 w-4" /> Recovery Package details
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sessions Count</label>
                    <select value={bulkCount} onChange={e => setBulkCount(+e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none">
                      {[3,5,10,15,20].map(n => <option key={n} value={n}>{n} sessions</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Frequency</label>
                    <select value={bulkFreq} onChange={e => setBulkFreq(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-white focus:outline-none">
                      <option value="daily">Daily (Mon-Sat)</option>
                      <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                      <option value="alternate">Alternate Days</option>
                    </select>
                  </div>
                  {bulkDates.length > 0 && (
                    <div className="col-span-2 text-[11px] text-slate-500 bg-white dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850 flex justify-between items-center">
                      <span>Timeline: <strong className="text-slate-800 dark:text-slate-200">{bulkDates[0]}</strong> to <strong className="text-slate-800 dark:text-slate-200">{bulkDates[bulkDates.length-1]}</strong></span>
                      <span className="font-bold text-indigo-500">({bulkDates.length} days)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Available Timing Slots</label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-8"><Loader2 className="h-5 w-5 animate-spin text-medical-500" /> Searching database for capacity...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {slots.map(s => {
                    const isSelected = slot === `${s.slot_start}|${s.slot_end}`;
                    return (
                      <button type="button" key={s.slot_start}
                        disabled={s.available_slots === 0}
                        onClick={() => setSlot(`${s.slot_start}|${s.slot_end}`)}
                        className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1.5 ${
                          isSelected 
                            ? 'bg-medical-500 text-white border-medical-500 shadow-md shadow-medical-500/10'
                            : s.available_slots === 0 
                              ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-850 text-slate-400 bg-slate-50 dark:bg-slate-900/30'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 hover:border-medical-500 hover:text-medical-600'
                        }`}>
                        <span>{fmt(s.slot_start)}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                          isSelected ? 'bg-white/20 text-white' 
                          : s.available_slots <= 1 ? 'bg-rose-500/10 text-rose-500' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {s.available_slots === 0 ? 'Full' : `${s.available_slots} Left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Therapist Select */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Assign a practitioner</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {therapists.map(t => {
                const isSelected = therapist === t.id;
                return (
                  <button type="button" key={t.id} onClick={() => setTherapist(t.id)}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                      isSelected 
                        ? 'border-medical-500 bg-medical-500/5 ring-4 ring-medical-500/5' 
                        : 'border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800'
                    }`}>
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      {t.profile_image ? <img src={t.profile_image} alt="" className="w-full h-full object-cover" /> : <Stethoscope className="h-5 w-5 m-3 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">{t.name}</div>
                      <div className="text-xs text-slate-400 truncate">{t.specialization}</div>
                      <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase mt-0.5">{t.experience} Years Experience</div>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-medical-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Confirm */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Review booking overview</h3>
            
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-850 space-y-4 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/30 dark:border-slate-800/40">
                <span className="text-slate-400 font-semibold">Patient Name</span>
                <span className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                  {selectedPatient?.name || walkInName}
                  {patientMode === 'walkin' && <span className="text-[9px] bg-amber-500/10 text-amber-500 font-black px-2 py-0.5 rounded-full border border-amber-500/20">WALK-IN</span>}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/30 dark:border-slate-800/40">
                <span className="text-slate-400 font-semibold">Booking Option</span>
                <span className="font-extrabold text-slate-800 dark:text-white capitalize">
                  {mode === 'bulk' ? `📦 ${bulkCount}-Session Package` : '📅 Single Treatment'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/30 dark:border-slate-800/40">
                <span className="text-slate-400 font-semibold">Target Dates</span>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {mode === 'bulk' ? `${bulkDates[0]} to ${bulkDates[bulkDates.length-1]}` : date}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/30 dark:border-slate-800/40">
                <span className="text-slate-400 font-semibold">Treatment Hours</span>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {slot && fmt(slot.split('|')[0])} – {slot && fmt(slot.split('|')[1])}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Assigned Practitioner</span>
                <span className="font-extrabold text-slate-850 dark:text-white">
                  {therapists.find(t => t.id === therapist)?.name}
                </span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-medical-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-all">
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Finalizing Booking...</>
              ) : (
                <><Check className="h-5 w-5" /> Confirm and Create Reservation</>
              )}
            </button>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex justify-between mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1}
            className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4.5 w-4.5" /> Back
          </button>
          {step < 4 && (
            <button type="button" onClick={() => setStep(s => s+1)} disabled={!canProceed()}
              className="flex items-center gap-1 text-sm font-extrabold text-medical-500 hover:text-medical-600 disabled:opacity-35 transition-colors">
              Next Step <ChevronRight className="h-4.5 w-4.5" />
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
    <div className="space-y-6 animate-scale-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Schedule</h1>
          <p className="text-sm text-slate-400 mt-1">Practitioner allocation timeline</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase hidden sm:inline">Filter:</label>
          <select value={therapistFilter} onChange={e => setTherapistFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-extrabold bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-850">
            <option value="all">All Practitioners</option>
            {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-3 w-fit shadow-sm">
        <button onClick={() => changeDay(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
        <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)}
          className="text-sm font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none border-none outline-none" />
        <button onClick={() => changeDay(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><ChevronRight className="h-4 w-4" /></button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800" />
        <button onClick={() => setViewDate(today())} className="text-xs font-black text-medical-500 hover:text-medical-600 uppercase tracking-wider">Today</button>
      </div>

      {/* Booking List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {dayBookings.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-25 text-medical-500" />
            <p className="text-sm font-semibold">No appointments scheduled for this date</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dayBookings.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(bk => (
              <div key={bk.id} className="px-6 py-4.5 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 group transition-colors animate-fade-in">
                <div className="min-w-[64px] text-center">
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">{fmt(bk.start_time)}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{fmt(bk.end_time).split(' ')[0]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-2">
                    {bk.patient?.name || bk.walk_in_patient?.name || 'Walk-in'}
                    {bk.bulk_booking_id && <span className="text-[9px] bg-blue-500/10 text-blue-500 font-black px-2 py-0.5 rounded-full border border-blue-500/20">📦 PACKAGE</span>}
                    {!bk.patient_id && <span className="text-[9px] bg-amber-500/10 text-amber-500 font-black px-2 py-0.5 rounded-full border border-amber-500/20">WALK-IN</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">{bk.therapist?.name} · {bk.bed?.bed_number}</div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-xl capitalize tracking-wider ${STATUS_STYLES[bk.status]}`}>{bk.status}</span>
                {bk.status === 'booked' && (
                  <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onCompleteBooking(bk.id)} className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all" title="Complete"><CheckCircle2 className="h-4.5 w-4.5" /></button>
                    <button onClick={() => onCancelBooking(bk)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all" title="Cancel"><XCircle className="h-4.5 w-4.5" /></button>
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
    <div className="space-y-6 animate-scale-in">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Patients</h1>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-sm max-h-[550px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient name, phone..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(p => {
              const isSelected = selected?.id === p.id;
              return (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={`w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors ${isSelected ? 'bg-medical-500/5 dark:bg-medical-950/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-extrabold text-sm shrink-0">
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-slate-850 dark:text-slate-200 truncate">{p.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate">{p.phone || p.email || 'Walk-in'}</div>
                    </div>
                    {!p.email && <span className="text-[9px] bg-amber-500/10 text-amber-500 font-black px-2 py-0.5 rounded-full border border-amber-500/20">Walk-in</span>}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-10 font-bold">No patients match filter</p>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Users className="h-12 w-12 mb-3 opacity-20 text-medical-500" />
              <p className="text-sm font-semibold">Select a patient record to view medical sessions</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-medical-500/10 text-medical-500 flex items-center justify-center font-black text-xl shadow-inner">
                    {selected.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{selected.name}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-400 mt-1 font-semibold">
                      {selected.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{selected.phone}</span>}
                      {selected.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{selected.email}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Total Sessions', patientBookings.length, 'bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-white'],
                  ['Completed', patientBookings.filter(b=>b.status==='completed').length, 'bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-500'],
                  ['Upcoming', patientBookings.filter(b=>b.status==='booked').length, 'bg-blue-500/5 dark:bg-blue-950/20 text-blue-500'],
                ].map(([l,v,c]) => (
                  <div key={l} className={`rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-850 ${c}`}>
                    <div className="text-2xl font-black tracking-tight">{v}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70">{l}</div>
                  </div>
                ))}
              </div>

              {/* History Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Medical Booking Log</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {patientBookings.sort((a,b)=>b.booking_date.localeCompare(a.booking_date)).map(bk => (
                    <div key={bk.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/30 rounded-2xl px-4 py-3 border border-slate-150/50 dark:border-slate-850 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-655 dark:text-slate-300 font-mono">{bk.booking_date}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 font-semibold">{bk.therapist?.name}</div>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[bk.status]}`}>{bk.status}</span>
                    </div>
                  ))}
                  {patientBookings.length === 0 && (
                    <p className="text-xs text-slate-400 font-semibold text-center py-6">No previous bookings found for this patient.</p>
                  )}
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
    <div className="space-y-5 animate-scale-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Therapists</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage clinic practitioners and shifts</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700 text-white text-sm font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all">
          <Plus className="h-4.5 w-4.5" /> Add Practitioner
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {therapists.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 shadow-inner">
                {t.profile_image ? <img src={t.profile_image} alt="" className="w-full h-full object-cover" /> : <Stethoscope className="h-6 w-6 m-4 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-850 dark:text-slate-200 text-sm truncate">{t.name}</div>
                <div className="text-xs text-slate-400 font-bold mt-0.5">{t.specialization}</div>
                <div className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mt-2">{t.experience} Yrs Exp</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150/50 dark:border-slate-850">
              <Clock className="h-4 w-4 text-medical-500" />
              <span className="font-bold">Shift: {fmt(t.shift_start)} – {fmt(t.shift_end)}</span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-655 hover:text-medical-600 hover:bg-medical-50 dark:hover:bg-medical-950/20 py-2 rounded-xl border border-slate-150 dark:border-slate-800 transition-all">
                <Edit3 className="h-4 w-4" /> Edit
              </button>
              <button onClick={() => onDelete(t)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-550 py-2 rounded-xl border border-rose-200 dark:border-rose-900/30 hover:border-rose-500 transition-all">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>
          </div>
        ))}
        {therapists.length === 0 && (
          <p className="text-slate-400 text-sm col-span-full text-center py-12 font-bold">No therapists registered in database.</p>
        )}
      </div>
    </div>
  );
}

// ─── BEDS VIEW ─────────────────────────────────────────────────────────────────
function BedsView({ beds, bookings, onAdd, onToggle, onDelete }) {
  const statusCfg = {
    available:   { color: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse-glow' },
    occupied:    { color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', dot: 'bg-blue-500' },
    maintenance: { color: 'bg-rose-500/10 text-rose-500 border border-rose-500/20', dot: 'bg-rose-500' },
  };
  const statuses = ['available','occupied','maintenance'];
  const todayStr = today();

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Beds</h1>
          <p className="text-sm text-slate-500 mt-0.5">{beds.filter(b=>b.status==='available').length} of {beds.length} available beds</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700 text-white text-sm font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all">
          <Plus className="h-4.5 w-4.5" /> Add Bed
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {beds.map(bed => {
          const cfg = statusCfg[bed.status] || statusCfg.available;
          // Find all bookings for this bed today
          const bedBookingsToday = bookings.filter(b => 
            (b.bed_id === bed.id || b.bed?.id === bed.id) && 
            b.booking_date === todayStr && 
            b.status === 'booked'
          );

          return (
            <div key={bed.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-200/30 dark:border-slate-850">
                  <BedDouble className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <button onClick={() => onDelete(bed)} className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>

              <div>
                <div className="font-black text-sm text-slate-800 dark:text-slate-100">{bed.bed_number}</div>
                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-0.5 rounded-full mt-1.5 capitalize tracking-wide ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {bed.status}
                </span>
              </div>

              {/* Show Patient Assignments Today */}
              <div className="space-y-1.5 py-1 border-t border-b border-slate-100 dark:border-slate-800/80 my-0.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Schedule</label>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {bedBookingsToday.map(b => (
                    <div key={b.id} className="text-[11px] text-slate-600 dark:text-slate-350 font-semibold flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      <span className="font-mono text-[10px]">{fmt(b.start_time).split(' ')[0]}</span>
                      <span className="truncate max-w-[80px]" title={b.patient?.name || b.walk_in_patient?.name}>{b.patient?.name || b.walk_in_patient?.name || 'Walk-in'}</span>
                    </div>
                  ))}
                  {bedBookingsToday.length === 0 && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic py-1">No bookings today</div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Update status</label>
                <select value={bed.status} onChange={e => onToggle(bed.id, e.target.value)}
                  className="w-full text-xs font-bold text-slate-650 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 focus:outline-none focus:border-medical-500">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REPORTS VIEW ─────────────────────────────────────────────────────────────
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
    { label: 'Cumulative Sessions', val: bookings.length, color: 'text-slate-850 dark:text-white' },
    { label: 'Scheduled Today', val: todayBookings.length, color: 'text-blue-500' },
    { label: 'Completed', val: bookings.filter(b=>b.status==='completed').length, color: 'text-emerald-500' },
    { label: 'Cancelled', val: bookings.filter(b=>b.status==='cancelled').length, color: 'text-rose-500' },
    { label: 'Practitioners', val: therapists.length, color: 'text-indigo-500' },
    { label: 'Total Beds', val: beds.length, color: 'text-slate-800 dark:text-white' },
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reports</h1>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4">
            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</div>
            <div className={`text-2xl font-black mt-1.5 tracking-tight ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 mb-5">Weekly Bookings Trend</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(14,165,233,0.04)' }} />
                <Bar dataKey="Bookings" fill="#0EA5E9" radius={[6,6,0,0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 flex flex-col shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 mb-5">Bed Status distribution</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={bedData} innerRadius={58} outerRadius={78} paddingAngle={4} dataKey="value">
                  {bedData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4">
            {bedData.map((d, i) => (
              <div key={d.name}>
                <span className="block font-black text-slate-850 dark:text-slate-100">{d.value}</span>
                <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-bold">
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

// ─── SETTINGS VIEW ─────────────────────────────────────────────────────────────
function SettingsView({ showToast }) {
  const [morningStart, setMorningStart] = useState('09:00:00');
  const [morningEnd, setMorningEnd] = useState('14:00:00');
  const [eveningStart, setEveningStart] = useState('16:00:00');
  const [eveningEnd, setEveningEnd] = useState('20:00:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('clinic_settings').select('key,value').then(({ data }) => {
      if (!data) return;
      data.forEach(r => {
        if (r.key === 'morning_start_time') setMorningStart(r.value);
        if (r.key === 'morning_end_time') setMorningEnd(r.value);
        if (r.key === 'evening_start_time') setEveningStart(r.value);
        if (r.key === 'evening_end_time') setEveningEnd(r.value);
      });
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from('clinic_settings').upsert({ key: 'morning_start_time', value: morningStart });
      await supabase.from('clinic_settings').upsert({ key: 'morning_end_time', value: morningEnd });
      await supabase.from('clinic_settings').upsert({ key: 'evening_start_time', value: eveningStart });
      await supabase.from('clinic_settings').upsert({ key: 'evening_end_time', value: eveningEnd });
      showToast('success', 'Operating shifts successfully updated!');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to update operating settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl animate-scale-in">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="font-extrabold text-slate-800 dark:text-white text-base mb-2">Clinic Operating Shifts</h2>
        <p className="text-xs text-slate-450 dark:text-slate-500 mb-5">Set morning and evening shifts boundaries for slot reservations.</p>
        
        <form onSubmit={save} className="space-y-5">
          <div className="space-y-4">
            {/* Morning Shift */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/40 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">☀️ Morning Shift</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Start Time</label>
                  <input type="time" value={morningStart.slice(0,5)} onChange={e => setMorningStart(e.target.value+':00')}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-850 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">End Time</label>
                  <input type="time" value={morningEnd.slice(0,5)} onChange={e => setMorningEnd(e.target.value+':00')}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-855 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
                </div>
              </div>
            </div>

            {/* Evening Shift */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/40 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">🌙 Evening Shift</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Start Time</label>
                  <input type="time" value={eveningStart.slice(0,5)} onChange={e => setEveningStart(e.target.value+':00')}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-850 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">End Time</label>
                  <input type="time" value={eveningEnd.slice(0,5)} onChange={e => setEveningEnd(e.target.value+':00')}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-855 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
                </div>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700 text-white text-sm font-extrabold px-5 py-3 rounded-2xl shadow-md transition-all disabled:opacity-60">
            {saving ? <><Loader2 className="h-4.5 w-4.5 animate-spin" />Saving...</> : <><Check className="h-4.5 w-4.5" />Save Settings</>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{therapist ? 'Edit Practitioner' : 'Add Practitioner'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {[['name','Practitioner Name','text'],['specialization','Clinical Focus Area','text'],['profile_image','Photo URL','url']].map(([k,l,t]) => (
            <div key={k} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{l}</label>
              <input type={t} value={form[k]||''} onChange={e=>set(k,e.target.value)} required={k!=='profile_image'}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Experience (Yrs)</label>
              <input type="number" min="0" value={form.experience||0} onChange={e=>set('experience',+e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
            </div>
            <div className="space-y-1" />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
            {[['shift_start','Shift Start'],['shift_end','Shift End']].map(([k,l]) => (
              <div key={k} className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{l}</label>
                <input type="time" value={(form[k]||'09:00:00').slice(0,5)} onChange={e=>set(k,e.target.value+':00')}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-medical-500 to-medical-600 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all disabled:opacity-60">
            {saving ? <><Loader2 className="h-4.5 w-4.5 animate-spin" />Saving...</> : <><Check className="h-4.5 w-4.5" />{therapist ? 'Update' : 'Add Practitioner'}</>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Add Clinic Bed</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Bed Identifier</label>
            <input value={bedNumber} onChange={e=>setBedNumber(e.target.value)} placeholder="e.g. Bed F-2" required
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:border-medical-500" />
          </div>
          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-medical-500 to-medical-600 text-white font-extrabold py-3 rounded-2xl transition-all disabled:opacity-60">
            {saving ? 'Creating Bed...' : 'Add Bed'}
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
        showToast('success', 'Appointment successfully cancelled.');
      } else if (mode === 'remaining') {
        const ids = bookings.filter(b => b.bulk_booking_id === booking.bulk_booking_id && b.status === 'booked' && b.booking_date >= booking.booking_date).map(b=>b.id);
        await supabase.from('bookings').update({ status:'cancelled' }).in('id', ids);
        showToast('success', `Cancelled ${ids.length} package sessions.`);
      } else {
        const ids = bookings.filter(b => b.bulk_booking_id === booking.bulk_booking_id && b.status === 'booked').map(b=>b.id);
        await supabase.from('bookings').update({ status:'cancelled' }).in('id', ids);
        showToast('success', `Cancelled entire package (${ids.length} sessions).`);
      }
      onDone();
    } catch (err) { console.error(err); showToast('error', 'Failed to cancel.'); }
    finally { setCancelling(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Cancel Appointment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655"><X className="h-5 w-5" /></button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Are you sure you want to cancel the session for <strong className="text-slate-800 dark:text-slate-200">{booking?.patient?.name || booking?.walk_in_patient?.name || 'Walk-in'}</strong> on <strong className="text-slate-800 dark:text-slate-200">{booking?.booking_date}</strong>?
        </div>

        {isPackage && (
          <div className="space-y-2.5 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl">
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider"><Package className="h-4 w-4" />Recovery Package Options</p>
            {[['single','📅 Only this session'],['remaining','⏳ This and future sessions'],['all','📦 Cancel entire package']].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)}
                className={`w-full text-left text-xs font-bold px-4.5 py-3 rounded-2xl border transition-all ${mode===m ? 'border-indigo-500 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850'}`}>
                {l}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 py-3 rounded-xl border border-slate-200 dark:border-slate-800 transition-all">Keep appointment</button>
          <button onClick={confirm} disabled={cancelling} className="flex-1 text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl transition-all disabled:opacity-60 shadow-md shadow-rose-500/10">
            {cancelling ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function ReceptionistDashboard() {
  const { profile, signOut } = useAuth();
  
  // Theme Switching State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const [activeTab, setActiveTab] = useState('today');
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [cancelBooking, setCancelBooking] = useState(null);
  const [therapistModal, setTherapistModal] = useState(null);
  const [addBedModal, setAddBedModal] = useState(false);

  const showToast = (type, msg) => setToast({ type, msg });

  // Theme Toggler
  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  useEffect(() => {
    const timer = setTimeout(() => { loadData(); }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleSignOut = async () => { await signOut(); window.location.href = '/login'; };
  const handleCompleteBooking = async (id) => {
    await supabase.from('bookings').update({ status:'completed' }).eq('id', id);
    showToast('success', 'Appointment marked as completed.');
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-medical-500 flex items-center justify-center shadow-lg shadow-medical-500/20">
            <Activity className="h-6 w-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Initialising Portal...</p>
        </div>
      </div>
    );
  }

  const tabProps = { bookings, therapists, beds, patients, showToast, onSuccess: loadData };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 dark-mesh flex">
      <Sidebar active={activeTab} setActive={setActiveTab} profile={profile} onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme} />

      {/* Main Container */}
      <main className="pl-64 flex-1 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
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
          onSave={() => { setTherapistModal(null); showToast('success', 'Practitioner successfully saved!'); loadData(); }}
        />
      )}
      {addBedModal && (
        <AddBedModal
          onClose={() => setAddBedModal(false)}
          onSave={() => { setAddBedModal(false); showToast('success', 'Bed successfully added!'); loadData(); }}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
