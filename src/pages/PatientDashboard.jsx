import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Layout } from '../components/Layout';
import { 
  Calendar as CalendarIcon, Clock, User as UserIcon, CheckCircle2, 
  AlertCircle, XCircle, ChevronRight, ChevronLeft, CalendarDays, 
  Clock3, ShieldCheck, HeartPulse, RefreshCw
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  
  // States for Booking Wizard
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // { start_time, end_time, available_slots }
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  
  // Bookings list states
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  // General feedback
  const [wizardError, setWizardError] = useState('');
  const [toastMessage, setToastMessage] = useState(null); // { type, text }

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Fetch Therapists
  useEffect(() => {
    async function loadTherapists() {
      try {
        const { data, error } = await supabase.from('therapists').select('*');
        if (error) throw error;
        setTherapists(data || []);
      } catch (err) {
        console.error('Error fetching therapists:', err.message);
        // Fallback mock therapists
        setTherapists([
          { id: 't1', name: 'Dr. Sarah Jenkins', specialization: 'Sports Injury Rehab', experience: 8, profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300' },
          { id: 't2', name: 'Dr. Marcus Chen', specialization: 'Neurological Physiotherapy', experience: 12, profile_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300' },
          { id: 't3', name: 'Dr. Priya Patel', specialization: 'Orthopedic Recovery', experience: 6, profile_image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300' },
          { id: 't4', name: 'Dr. David Miller', specialization: 'Pediatric & Geriatric Care', experience: 10, profile_image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300' }
        ]);
      }
    }
    loadTherapists();
  }, []);

  // Fetch patient bookings
  const loadMyBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          created_at,
          therapist:therapist_id(name, specialization),
          bed:bed_id(bed_number)
        `)
        .eq('patient_id', user.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      setMyBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err.message);
      // Fallback mock bookings for demo purposes
      setMyBookings([
        {
          id: 'b1',
          booking_date: new Date().toISOString().split('T')[0],
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'booked',
          therapist: { name: 'Dr. Sarah Jenkins', specialization: 'Sports Injury Rehab' },
          bed: { bed_number: 'Bed A-1' }
        },
        {
          id: 'b2',
          booking_date: '2026-06-18',
          start_time: '14:00:00',
          end_time: '15:00:00',
          status: 'completed',
          therapist: { name: 'Dr. Priya Patel', specialization: 'Orthopedic Recovery' },
          bed: { bed_number: 'Bed B-1' }
        }
      ]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
  }, [user]);

  // Fetch dynamic slot availability when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    async function loadSlots() {
      setLoadingSlots(true);
      setWizardError('');
      try {
        const { data, error } = await supabase
          .rpc('get_available_slots', { p_date: selectedDate });
        
        if (error) throw error;
        setAvailableSlots(data || []);
      } catch (err) {
        console.error('RPC Error fetching slots:', err.message);
        // Fallback simulated dynamic slots
        setAvailableSlots([
          { slot_start: '09:00:00', slot_end: '10:00:00', available_slots: 4 },
          { slot_start: '10:00:00', slot_end: '11:00:00', available_slots: 3 },
          { slot_start: '11:00:00', slot_end: '12:00:00', available_slots: 0 }, // Full
          { slot_start: '12:00:00', slot_end: '13:00:00', available_slots: 4 },
          { slot_start: '13:00:00', slot_end: '14:00:00', available_slots: 2 },
          { slot_start: '14:00:00', slot_end: '15:00:00', available_slots: 4 },
          { slot_start: '15:00:00', slot_end: '16:00:00', available_slots: 1 },
          { slot_start: '16:00:00', slot_end: '17:00:00', available_slots: 2 }
        ]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();

    // Set up Realtime subscription to reload slots on changes
    const bookingsSubscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', scheme: 'public', table: 'bookings' }, () => {
        loadSlots();
        loadMyBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsSubscription);
    };
  }, [selectedDate]);

  // Handle Cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      showToast('success', 'Appointment cancelled successfully.');
      loadMyBookings();
    } catch (err) {
      console.error('Cancellation error:', err.message);
      showToast('error', err.message || 'Failed to cancel appointment.');
    }
  };

  // Perform transactional booking
  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot || !selectedTherapist) {
      setWizardError('Please complete all steps.');
      return;
    }

    setBookingInProgress(true);
    setWizardError('');

    try {
      const { data, error } = await supabase.rpc('book_appointment', {
        p_patient_id: user.id,
        p_therapist_id: selectedTherapist.id,
        p_booking_date: selectedDate,
        p_start_time: selectedSlot.slot_start,
        p_end_time: selectedSlot.slot_end
      });

      if (error) throw error;

      showToast('success', 'Appointment booked successfully! Bed assigned automatically.');
      
      // Reset Wizard
      setStep(1);
      setSelectedSlot(null);
      setSelectedTherapist(null);
      
      // Refresh patient bookings
      loadMyBookings();
    } catch (err) {
      console.error('Booking transaction failed:', err.message);
      setWizardError(err.message || 'The slot or therapist is no longer available. Please select another slot.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Format time display (e.g. 10:00:00 -> 10:00 AM)
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hr = parseInt(hours, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${displayHr}:${minutes} ${ampm}`;
  };

  return (
    <Layout>
      <div className="space-y-8 py-4">
        
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl transition-colors">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
              Patient Portal
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Welcome, <span className="font-semibold text-slate-800 dark:text-slate-200">{profile?.name || user?.email}</span>. Book slots and track your recovery.
            </p>
          </div>
          <button 
            onClick={loadMyBookings}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-medical-500 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm transition-all duration-300 ${
            toastMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/40 dark:text-green-300' 
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300'
          }`}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            <span className="font-semibold">{toastMessage.text}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: BOOKING WIZARD (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 sm:p-8 space-y-6 transition-colors">
            
            <div className="border-b border-slate-100 dark:border-slate-800/50 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Appointment</h2>
                <p className="text-xs text-slate-400">Follow the steps to confirm booking</p>
              </div>
              <div className="text-xs font-bold bg-medical-50 dark:bg-medical-950/40 text-medical-500 px-3 py-1 rounded-full">
                Step {step} of 4
              </div>
            </div>

            {wizardError && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 flex gap-3 text-red-700 dark:text-red-400 text-xs">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* STEP 1: DATE SELECTION */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-semibold">
                  <CalendarIcon className="h-4.5 w-4.5 text-medical-500" />
                  <span>Choose Date for Appointment</span>
                </div>
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 focus:border-medical-500 focus:outline-none dark:text-white transition-colors"
                />
                <p className="text-xs text-slate-400">
                  Appointments can be booked from Monday to Saturday, between 9:00 AM and 5:00 PM.
                </p>
              </div>
            )}

            {/* STEP 2: TIME SLOT SELECTOR */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-semibold">
                    <Clock className="h-4.5 w-4.5 text-medical-500" />
                    <span>Select Time Slot</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{selectedDate}</span>
                </div>

                {loadingSlots ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="animate-pulse bg-slate-50 dark:bg-slate-950/40 rounded-2xl h-20 border border-slate-100 dark:border-slate-800/40"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((slot) => {
                      const isFull = slot.available_slots === 0;
                      const isSelected = selectedSlot?.slot_start === slot.slot_start;
                      return (
                        <button
                          key={slot.slot_start}
                          disabled={isFull}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-2xl border p-4 text-left flex flex-col justify-between h-20 transition-all ${
                            isFull 
                              ? 'bg-slate-50 dark:bg-slate-950 border-slate-200/40 text-slate-400 opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'bg-medical-500 border-medical-500 text-white shadow-md shadow-medical-500/25'
                                : 'bg-slate-50 border-slate-200/50 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-sm font-bold">{formatTime(slot.slot_start)}</span>
                          <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                            {isFull ? 'Booked Out' : `${slot.available_slots} Slots Available`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: THERAPIST SELECTOR */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-semibold">
                  <UserIcon className="h-4.5 w-4.5 text-medical-500" />
                  <span>Choose Your Therapist</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {therapists.map((therapist) => {
                    const isSelected = selectedTherapist?.id === therapist.id;
                    return (
                      <button
                        key={therapist.id}
                        onClick={() => setSelectedTherapist(therapist)}
                        className={`rounded-2xl border p-4 text-left flex gap-4 transition-all ${
                          isSelected
                            ? 'bg-medical-500 border-medical-500 text-white shadow-md shadow-medical-500/20 scale-[1.01]'
                            : 'bg-slate-50 border-slate-200/50 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <img 
                          src={therapist.profile_image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'} 
                          alt={therapist.name} 
                          className="h-16 w-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm leading-snug">{therapist.name}</h4>
                          <p className={`text-[10px] font-semibold ${isSelected ? 'text-white/80' : 'text-medical-500'}`}>
                            {therapist.specialization}
                          </p>
                          <p className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                            {therapist.experience} yrs exp
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRMATION SUMMARY */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-semibold">
                  <CheckCircle2 className="h-4.5 w-4.5 text-medical-500" />
                  <span>Verify Booking Details</span>
                </div>

                <div className="rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-850/50">
                    <span className="text-xs text-slate-400 font-medium">Selected Date</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-medical-500" />
                      {selectedDate}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-850/50">
                    <span className="text-xs text-slate-400 font-medium">Session Time</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-medical-500" />
                      {formatTime(selectedSlot?.slot_start)} - {formatTime(selectedSlot?.slot_end)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-850/50">
                    <span className="text-xs text-slate-400 font-medium">Therapist</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <HeartPulse className="h-4 w-4 text-medical-500" />
                      {selectedTherapist?.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Bed Allocation</span>
                    <span className="text-xs font-semibold bg-medical-50 dark:bg-medical-950 text-medical-600 dark:text-medical-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Assigned Automatically
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 italic">
                  Note: A treatment bed will be allocated to you dynamically upon scheduling. In case of cancellation, you can release the booking up to 2 hours before the slot.
                </div>
              </div>
            )}

            {/* BUTTON NAVIGATION BAR */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/50">
              <button
                disabled={step === 1 || bookingInProgress}
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {step < 4 ? (
                <button
                  disabled={
                    (step === 2 && !selectedSlot) ||
                    (step === 3 && !selectedTherapist)
                  }
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-medical-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600 disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled={bookingInProgress}
                  onClick={handleConfirmBooking}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-75 transition-colors"
                >
                  {bookingInProgress ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent animate-spin rounded-full"></span>
                      Booking...
                    </>
                  ) : (
                    'Confirm Schedule'
                  )}
                </button>
              )}
            </div>

          </div>

          {/* RIGHT PANEL: BOOKING HISTORY (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 sm:p-8 space-y-6 transition-colors">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Booking History</h2>
              <p className="text-xs text-slate-400">View and manage your scheduled sessions</p>
            </div>

            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-slate-50 dark:bg-slate-950/40 rounded-2xl h-24 border border-slate-100 dark:border-slate-800/40"></div>
                ))}
              </div>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-10 space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Appointments Found</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  You haven't scheduled any physiotherapy sessions yet. Fill out the wizard to secure a slot.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {myBookings.map((bk) => {
                  const isUpcoming = bk.status === 'booked';
                  const isCompleted = bk.status === 'completed';
                  const isCancelled = bk.status === 'cancelled';
                  
                  return (
                    <div 
                      key={bk.id}
                      className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                        isCancelled 
                          ? 'border-slate-200/40 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-950/50 text-slate-400' 
                          : 'border-slate-200/60 bg-slate-50 dark:border-slate-850 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-bold">
                            {bk.booking_date}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatTime(bk.start_time)} - {formatTime(bk.end_time)}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                            : isCancelled
                              ? 'bg-red-50 text-red-400 dark:bg-red-950/20 dark:text-red-400'
                              : 'bg-medical-50 text-medical-600 dark:bg-medical-950/30 dark:text-medical-400'
                        }`}>
                          {bk.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/30 dark:border-slate-800/30">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Therapist</span>
                          <span className={`font-semibold ${isCancelled ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {bk.therapist?.name || 'Assigned Staff'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Allocated Bed</span>
                          <span className={`font-semibold ${isCancelled ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {isCancelled ? 'Released' : bk.bed?.bed_number || 'Auto Bed'}
                          </span>
                        </div>
                      </div>

                      {isUpcoming && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleCancelBooking(bk.id)}
                            className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 hover:underline transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
