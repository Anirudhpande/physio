import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Clock3,
  CalendarDays,
  ShieldAlert
} from 'lucide-react';

export default function DoctorDashboard() {
  const { profile } = useAuth();
  
  // Doctor/Therapist Profile State
  const [therapist, setTherapist] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // { type, text }

  // Calendar/Filter States
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'patients'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  // Patient Directory & Case History States
  const [patientFilterMode, setPatientFilterMode] = useState('my'); // 'my' | 'all'
  const [allPatients, setAllPatients] = useState([]);
  const [loadingAllPatients, setLoadingAllPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Helper calendar data
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  useEffect(() => {
    if (profile?.id) {
      loadDoctorData();
    }
  }, [profile]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      // Fetch therapist record matching the user's profile id
      const { data: thermo, error: thermoErr } = await supabase
        .from('therapists')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (thermoErr) {
        console.error("Error finding linked therapist record:", thermoErr);
        setError("Your account is not linked to any therapist profile. Please contact the administrator.");
        setLoading(false);
        return;
      }

      setTherapist(thermo);
      await loadBookings(thermo.id);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while loading dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (therapistId) => {
    try {
      setLoadingBookings(true);
      const { data, error: bkErr } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          bed:beds(id, bed_number),
          patient:profiles(id, name, email, phone)
        `)
        .eq('therapist_id', therapistId)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (bkErr) throw bkErr;
      setBookings(data || []);
    } catch (err) {
      console.error("Error loading bookings:", err);
      showToast('error', 'Failed to retrieve bookings.');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const { error: updErr } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (updErr) throw updErr;

      showToast('success', `Appointment successfully marked as ${newStatus}!`);
      if (therapist) {
        await loadBookings(therapist.id);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to update appointment status.');
    }
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClinicPatients = async () => {
    try {
      setLoadingAllPatients(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .eq('role', 'patient')
        .order('name');
      if (error) throw error;
      setAllPatients(data || []);
    } catch (err) {
      console.error("Error loading clinic patients:", err);
      showToast('error', 'Failed to retrieve clinic patients.');
    } finally {
      setLoadingAllPatients(false);
    }
  };

  useEffect(() => {
    if (patientFilterMode === 'all') {
      fetchClinicPatients();
    }
  }, [patientFilterMode]);

  const fetchPatientHistory = async (patientId) => {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          therapist:therapists(name, specialization),
          bed:beds(bed_number)
        `)
        .eq('patient_id', patientId)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });
      if (error) throw error;
      setPatientHistory(data || []);
    } catch (err) {
      console.error("Error loading history:", err);
      showToast('error', 'Failed to retrieve patient medical history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = async (patient) => {
    setSelectedPatient(patient);
    await fetchPatientHistory(patient.id);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hr = parseInt(hours, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${displayHr}:${minutes} ${ampm}`;
  };

  // Filtered lists
  const filteredBookings = bookings.filter(b => b.booking_date === selectedDate);

  // Patient Directory list (unique patients)
  const uniquePatients = Array.from(
    new Map(
      bookings
        .filter(b => b.patient)
        .map(b => [b.patient.id, {
          id: b.patient.id,
          name: b.patient.name,
          email: b.patient.email,
          phone: b.patient.phone,
          sessionCount: bookings.filter(bk => bk.patient?.id === b.patient.id).length,
          completedCount: bookings.filter(bk => bk.patient?.id === b.patient.id && bk.status === 'completed').length
        }])
    ).values()
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-medical-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-2xl border px-5 py-3 shadow-lg flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* Main Header Profile */}
      <div className="bg-white border-b border-slate-200/50 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {therapist ? (
            <div className="flex items-center gap-5">
              <img 
                src={therapist.profile_image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'} 
                alt={therapist.name} 
                className="h-20 w-20 rounded-3xl object-cover border-2 border-medical-200/60 shadow-sm"
              />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-medical-500 uppercase tracking-widest bg-medical-50 border border-medical-100 px-2.5 py-1 rounded-full">
                  Practitioner Portal
                </span>
                <h1 className="text-2xl font-black text-slate-800 pt-1">{therapist.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-slate-400" />
                    {therapist.specialization} ({therapist.experience} Years Exp)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-red-500 bg-red-50 border border-red-100 p-4 rounded-2xl text-sm font-bold">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {therapist && (
            <div className="flex gap-4">
              <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-2xl text-center min-w-28 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Start</div>
                <div className="text-sm font-extrabold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                  <Clock3 className="h-4 w-4 text-medical-500" />
                  {formatTime(therapist.shift_start)}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-2xl text-center min-w-28 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift End</div>
                <div className="text-sm font-extrabold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                  <Clock3 className="h-4 w-4 text-medical-500" />
                  {formatTime(therapist.shift_end)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {therapist && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-8">
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200/50 pb-px">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-4 px-4 text-sm font-extrabold border-b-2 transition-all ${
                activeTab === 'schedule'
                  ? 'border-medical-500 text-medical-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              My Appointments Grid
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`pb-4 px-4 text-sm font-extrabold border-b-2 transition-all ${
                activeTab === 'patients'
                  ? 'border-medical-500 text-medical-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              My Patients Directory ({uniquePatients.length})
            </button>
          </div>

          {/* TAB 1: SCHEDULE VIEW */}
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up">
              
              {/* Sidebar Mini Calendar */}
              <div className="lg:col-span-4 bg-white border border-slate-200/60 p-5 rounded-3xl space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">
                    {monthNames[calMonth]} {calYear}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`blank-${idx}`} className="h-8"></div>;
                    }

                    const dateStr = `${calYear}-${(calMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={`h-8 w-full rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-medical-500 text-white shadow-md shadow-medical-500/20 scale-105'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/40'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Timeline Appointments */}
              <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Sessions Schedule</h3>
                    <p className="text-xs text-slate-400">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-medical-50 border border-medical-100 text-medical-600 px-3 py-1 rounded-full">
                    {filteredBookings.length} Booked
                  </span>
                </div>

                {loadingBookings ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-500 border-t-transparent mx-auto mb-2"></div>
                    Loading schedule...
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-700 text-sm">No Sessions Today</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      You do not have any patient bookings scheduled for this date.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredBookings.map((bk) => {
                      const isBooked = bk.status === 'booked';
                      return (
                        <div key={bk.id} className="p-6 hover:bg-slate-50/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          
                          {/* Time & Patient Detail */}
                          <div className="flex gap-4 items-start">
                            <div className="rounded-2xl bg-medical-50 border border-medical-100/50 p-3 text-center min-w-24 shrink-0">
                              <div className="text-[10px] font-extrabold text-medical-500 uppercase">Time Slot</div>
                              <div className="text-xs font-black text-medical-700 mt-0.5">
                                {formatTime(bk.start_time).split(' ')[0]} - {formatTime(bk.end_time).split(' ')[0]}
                              </div>
                              <div className="text-[9px] font-bold text-medical-400 uppercase mt-0.5">
                                {formatTime(bk.start_time).split(' ')[1]}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-slate-800 text-sm">{bk.patient?.name || 'Walk-in'}</h4>
                              <div className="flex flex-col gap-0.5 text-xs text-slate-400 font-semibold">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {bk.patient?.phone || 'No phone'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {bk.patient?.email || 'No email'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bed, Status, and Controls */}
                          <div className="flex sm:flex-col items-start sm:items-end gap-3 w-full sm:w-auto justify-between border-t border-slate-100 pt-3 sm:pt-0 sm:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold bg-slate-100 border border-slate-200/50 text-slate-600 px-3 py-1 rounded-xl">
                                Bed {bk.bed?.bed_number.split(' ')[1] || bk.bed?.bed_number}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                                bk.status === 'completed' 
                                  ? 'bg-green-50 text-green-600 border border-green-100' 
                                  : bk.status === 'cancelled'
                                    ? 'bg-red-50 text-red-500 border border-red-100'
                                    : 'bg-medical-50 text-medical-600 border border-medical-100'
                              }`}>
                                {bk.status}
                              </span>
                            </div>

                            {isBooked && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusChange(bk.id, 'completed')}
                                  className="flex items-center gap-1 text-[11px] font-extrabold bg-green-50 hover:bg-green-100 text-green-600 border border-green-150 px-3 py-1.5 rounded-xl transition-all"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Complete Session
                                </button>
                                <button
                                  onClick={() => handleStatusChange(bk.id, 'cancelled')}
                                  className="flex items-center gap-1 text-[11px] font-extrabold bg-red-50 hover:bg-red-100 text-red-500 border border-red-150 px-3 py-1.5 rounded-xl transition-all"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: PATIENTS DIRECTORY VIEW */}
          {activeTab === 'patients' && (
            <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6 animate-slide-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Patients Roster</h3>
                  <p className="text-xs text-slate-400">Directory of clinic patients and medical case files.</p>
                </div>
                
                {/* Segmented Filter Mode Toggle */}
                <div className="flex p-1 bg-slate-50 border border-slate-200/50 rounded-2xl w-full sm:w-auto">
                  <button
                    onClick={() => setPatientFilterMode('my')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      patientFilterMode === 'my'
                        ? 'bg-medical-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    My Patients Only
                  </button>
                  <button
                    onClick={() => setPatientFilterMode('all')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      patientFilterMode === 'all'
                        ? 'bg-medical-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    All Clinic Patients
                  </button>
                </div>
              </div>

              {patientFilterMode === 'my' ? (
                uniquePatients.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <Users className="h-8 w-8 text-slate-350 mx-auto" />
                    <h4 className="font-bold text-slate-700 text-sm">No Patients Yet</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Patients will appear in this directory once they book appointments with you.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uniquePatients.map((pat) => (
                      <div key={pat.id} className="border border-slate-100 hover:border-slate-250 rounded-3xl p-5 bg-slate-50/20 hover:bg-slate-50/40 transition-all space-y-4 hover:shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex gap-3 items-center">
                            <div className="h-10 w-10 rounded-2xl bg-medical-50 border border-medical-100 text-medical-600 flex items-center justify-center font-bold text-base">
                              {pat.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-800">{pat.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">My Patient</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-500 font-semibold border-t border-b border-slate-100/50 py-3">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{pat.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{pat.email}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center gap-4 text-center">
                            <div className="flex-1 bg-white border border-slate-200/50 p-2 rounded-2xl">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Total Sessions</div>
                              <div className="text-sm font-black text-slate-700">{pat.sessionCount}</div>
                            </div>
                            <div className="flex-1 bg-white border border-slate-200/50 p-2 rounded-2xl">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Completed</div>
                              <div className="text-sm font-black text-green-600">{pat.completedCount}</div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenHistory(pat)}
                          className="w-full text-center mt-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors"
                        >
                          View Medical History
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                loadingAllPatients ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-500 border-t-transparent mx-auto mb-2"></div>
                    Loading all clinic patients...
                  </div>
                ) : allPatients.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <Users className="h-8 w-8 text-slate-350 mx-auto" />
                    <h4 className="font-bold text-slate-700 text-sm">No Patients Found</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      There are no registered patients in the clinic system currently.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allPatients.map((pat) => (
                      <div key={pat.id} className="border border-slate-100 hover:border-slate-250 rounded-3xl p-5 bg-slate-50/20 hover:bg-slate-50/40 transition-all space-y-4 hover:shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex gap-3 items-center">
                            <div className="h-10 w-10 rounded-2xl bg-medical-50 border border-medical-100 text-medical-600 flex items-center justify-center font-bold text-base">
                              {pat.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-800">{pat.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Clinic Patient</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-500 font-semibold border-t border-slate-100/50 pt-3">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{pat.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{pat.email}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenHistory(pat)}
                          className="w-full text-center mt-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors"
                        >
                          View Medical History
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

        </div>
      )}

      {/* Patient History Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-medical-500 uppercase tracking-widest bg-medical-50 border border-medical-100 px-2.5 py-1 rounded-full">
                  Patient History File
                </span>
                <h3 className="font-extrabold text-slate-800 text-lg pt-1">
                  {selectedPatient.name}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => { setSelectedPatient(null); setPatientHistory([]); }}
                className="rounded-xl border border-slate-200 p-2 text-slate-450 hover:text-slate-650 hover:bg-slate-100 transition-all"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              
              {/* Contact Info Row */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{selectedPatient.phone || 'No phone number'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{selectedPatient.email}</span>
                </div>
              </div>

              {/* Booking History Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Timeline Log</h4>
                
                {loadingHistory ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-500 border-t-transparent mx-auto mb-2"></div>
                    Retrieving clinical records...
                  </div>
                ) : patientHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No clinical bookings recorded for this patient yet.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-150 pl-6 ml-3 space-y-6">
                    {patientHistory.map((hist) => (
                      <div key={hist.id} className="relative">
                        {/* Timeline node dot */}
                        <span className={`absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                          hist.status === 'completed'
                            ? 'bg-green-500'
                            : hist.status === 'cancelled'
                              ? 'bg-red-400'
                              : 'bg-medical-500'
                        }`} />
                        
                        <div className="bg-slate-50/30 border border-slate-150/40 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">
                              {new Date(hist.booking_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              hist.status === 'completed'
                                ? 'bg-green-50 text-green-600'
                                : hist.status === 'cancelled'
                                  ? 'bg-red-50 text-red-500'
                                  : 'bg-medical-50 text-medical-600'
                            }`}>
                              {hist.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100/50">
                            <div>
                              <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wide">Doctor</span>
                              <span className="text-slate-700 font-bold">{hist.therapist?.name}</span>
                              <span className="text-[10px] text-slate-450 block">{hist.therapist?.specialization}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wide">Time & Asset</span>
                              <span className="text-slate-700 font-bold block">{formatTime(hist.start_time).split(' ')[0]} - {formatTime(hist.end_time).split(' ')[0]} {formatTime(hist.start_time).split(' ')[1]}</span>
                              <span className="text-[10px] text-slate-450 block">Bed {hist.bed?.bed_number}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
