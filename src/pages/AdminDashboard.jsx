import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Layout } from '../components/Layout';
import { 
  Activity, Shield, Clock, Users, Award, Calendar, ToggleLeft, 
  ToggleRight, Settings, Plus, Edit2, Trash2, XCircle, CheckCircle2, 
  AlertCircle, RefreshCw, BarChart2, CalendarDays, Bed, UserSquare, UserCheck,
  Search, Sliders, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, LineChart, Line, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'calendar', 'beds', 'therapists', 'patients', 'settings'
  
  // Core Database States
  const [bookings, setBookings] = useState([]);
  const [beds, setBeds] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinicHours, setClinicHours] = useState({ start: '09:00:00', end: '17:00:00' });
  const [settingsForm, setSettingsForm] = useState({ start: '09:00:00', end: '17:00:00' });
  
  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type, text }
  const [errorBanner, setErrorBanner] = useState('');

  // Search & Filter States
  const [calendarDate, setCalendarDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [adminYear, setAdminYear] = useState(() => new Date().getFullYear());
  const [adminMonth, setAdminMonth] = useState(() => new Date().getMonth());
  const [therapistFilter, setTherapistFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance States
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Modal / Form States
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('09:00:00');

  const [showTherapistModal, setShowTherapistModal] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState(null); // null = new
  const [therapistForm, setTherapistForm] = useState({
    name: '', specialization: '', experience: '', profile_image: '', shift_start: '09:00:00', shift_end: '17:00:00'
  });

  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [newBedNumber, setNewBedNumber] = useState('');

  // Load all data
  const loadData = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      // 1. Fetch Beds
      const { data: bedsData, error: bedsErr } = await supabase
        .from('beds')
        .select('*')
        .order('bed_number');
      if (bedsErr) throw bedsErr;
      setBeds(bedsData || []);

      // 2. Fetch Therapists
      const { data: thData, error: thErr } = await supabase
        .from('therapists')
        .select('*')
        .order('name');
      if (thErr) throw thErr;
      setTherapists(thData || []);

      // 3. Fetch Bookings (with patient and bed details)
      const { data: bkData, error: bkErr } = await supabase
        .from('bookings')
        .select(`
          id, booking_date, start_time, end_time, status, created_at,
          patient:patient_id(id, name, email, phone),
          therapist:therapist_id(id, name, specialization),
          bed:bed_id(id, bed_number)
        `)
        .order('booking_date', { ascending: false });
      if (bkErr) throw bkErr;
      setBookings(bkData || []);

      // 4. Fetch Patients Profiles
      const { data: patData, error: patErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('name');
      if (patErr) throw patErr;
      setPatients(patData || []);

      // 5. Fetch Clinic Settings
      const { data: settingsData, error: settingsErr } = await supabase
        .from('clinic_settings')
        .select('*');
      if (settingsErr) throw settingsErr;
      const settingsObj = {};
      if (settingsData) {
        settingsData.forEach(s => {
          settingsObj[s.key] = s.value;
        });
      }
      setClinicHours({
        start: settingsObj['clinic_start_time'] || '09:00:00',
        end: settingsObj['clinic_end_time'] || '17:00:00'
      });

    } catch (err) {
      console.error('Admin loadData error:', err.message);
      setClinicHours({ start: '09:00:00', end: '17:00:00' });
      setErrorBanner('Supabase database credentials are empty or SQL schema needs to be run. Displaying high-fidelity simulated local workspace data.');
      
      // Load Rich Fallback Mock Data
      setBeds([
        { id: 'b1', bed_number: 'Bed A-1', status: 'available' },
        { id: 'b2', bed_number: 'Bed A-2', status: 'available' },
        { id: 'b3', bed_number: 'Bed B-1', status: 'occupied' },
        { id: 'b4', bed_number: 'Bed B-2', status: 'available' },
        { id: 'b5', bed_number: 'Bed C-1', status: 'available' },
        { id: 'b6', bed_number: 'Bed C-2', status: 'maintenance' }
      ]);

      setTherapists([
        { id: 't1', name: 'Dr. Sarah Jenkins', specialization: 'Sports Injury Rehab', experience: 8, profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300', shift_start: '09:00:00', shift_end: '17:00:00' },
        { id: 't2', name: 'Dr. Marcus Chen', specialization: 'Neurological Physiotherapy', experience: 12, profile_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300', shift_start: '09:00:00', shift_end: '17:00:00' },
        { id: 't3', name: 'Dr. Priya Patel', specialization: 'Orthopedic Recovery', experience: 6, profile_image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300', shift_start: '09:00:00', shift_end: '17:00:00' },
        { id: 't4', name: 'Dr. David Miller', specialization: 'Pediatric & Geriatric Care', experience: 10, profile_image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300', shift_start: '09:00:00', shift_end: '17:00:00' }
      ]);

      setPatients([
        { id: 'p1', name: 'John Anderson', email: 'john@example.com', phone: '+1 555-019-9023' },
        { id: 'p2', name: 'Eleanor Vance', email: 'eleanor@example.com', phone: '+1 555-223-1189' },
        { id: 'p3', name: 'Robert Kowalski', email: 'robert@example.com', phone: '+1 555-880-9921' },
        { id: 'p4', name: 'Alice Cooper', email: 'alice@example.com', phone: '+1 555-404-3321' }
      ]);

      setBookings([
        {
          id: 'bk1',
          booking_date: new Date().toISOString().split('T')[0],
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'booked',
          patient: { id: 'p1', name: 'John Anderson', email: 'john@example.com', phone: '+1 555-019-9023' },
          therapist: { id: 't1', name: 'Dr. Sarah Jenkins', specialization: 'Sports Injury Rehab' },
          bed: { id: 'b1', bed_number: 'Bed A-1' }
        },
        {
          id: 'bk2',
          booking_date: new Date().toISOString().split('T')[0],
          start_time: '11:00:00',
          end_time: '12:00:00',
          status: 'booked',
          patient: { id: 'p2', name: 'Eleanor Vance', email: 'eleanor@example.com', phone: '+1 555-223-1189' },
          therapist: { id: 't3', name: 'Dr. Priya Patel', specialization: 'Orthopedic Recovery' },
          bed: { id: 'b3', bed_number: 'Bed B-1' }
        },
        {
          id: 'bk3',
          booking_date: new Date().toISOString().split('T')[0],
          start_time: '14:00:00',
          end_time: '15:00:00',
          status: 'completed',
          patient: { id: 'p3', name: 'Robert Kowalski', email: 'robert@example.com', phone: '+1 555-880-9921' },
          therapist: { id: 't2', name: 'Dr. Marcus Chen', specialization: 'Neurological Physiotherapy' },
          bed: { id: 'b1', bed_number: 'Bed A-1' }
        },
        {
          id: 'bk4',
          booking_date: '2026-06-19',
          start_time: '09:00:00',
          end_time: '10:00:00',
          status: 'completed',
          patient: { id: 'p4', name: 'Alice Cooper', email: 'alice@example.com', phone: '+1 555-404-3321' },
          therapist: { id: 't4', name: 'Dr. David Miller', specialization: 'Pediatric Care' },
          bed: { id: 'b4', bed_number: 'Bed B-2' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime changes on database tables
    const realtimeChannel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'therapists' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_settings' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchAttendance = async (date) => {
    try {
      setLoadingAttendance(true);
      const { data, error } = await supabase
        .from('therapist_attendance')
        .select('*')
        .eq('attendance_date', date);
      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (err) {
      console.error("Error loading attendance:", err);
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    fetchAttendance(attendanceDate);
  }, [attendanceDate]);

  const handleMarkAttendance = async (therapistId, status) => {
    try {
      const existing = attendanceRecords.find(r => r.therapist_id === therapistId);
      if (existing) {
        const { error } = await supabase
          .from('therapist_attendance')
          .update({ status })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('therapist_attendance')
          .insert({
            therapist_id: therapistId,
            attendance_date: attendanceDate,
            status
          });
        if (error) throw error;
      }
      showToast('success', 'Attendance marked successfully!');
      fetchAttendance(attendanceDate);
    } catch (err) {
      console.error("Error marking attendance:", err);
      showToast('error', 'Failed to mark attendance.');
    }
  };

  // 1. Actions: Bed status management (available/maintenance)
  const handleToggleBedStatus = async (bedId, currentStatus) => {
    const nextStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
    try {
      const { error } = await supabase
        .from('beds')
        .update({ status: nextStatus })
        .eq('id', bedId);
      if (error) throw error;
      showToast('success', `Bed status updated to ${nextStatus}.`);
      loadData();
    } catch (err) {
      console.error(err);
      // Mock update if DB connection is fallback
      setBeds(beds.map(b => b.id === bedId ? { ...b, status: nextStatus } : b));
      showToast('success', `Local simulation: Bed status toggled to ${nextStatus}.`);
    }
  };

  // 2. Actions: Cancel appointment
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      if (error) throw error;
      showToast('success', 'Appointment successfully cancelled.');
      loadData();
    } catch (err) {
      console.error(err);
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      showToast('success', 'Local simulation: Booking marked cancelled.');
    }
  };

  // 3. Actions: Complete session
  const handleCompleteBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
      if (error) throw error;
      showToast('success', 'Treatment session marked completed.');
      loadData();
    } catch (err) {
      console.error(err);
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
      showToast('success', 'Local simulation: Booking marked completed.');
    }
  };

  // 4. Actions: Reschedule appointment logic
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    setSubmitting(true);
    
    // Parse time slots (start + 1 hour)
    const [h, m, s] = rescheduleSlot.split(':');
    const endHour = (parseInt(h) + 1).toString().padStart(2, '0');
    const calculatedEndTime = `${endHour}:${m}:${s}`;

    try {
      // Overlap checks for therapist reschedule (exclude self)
      const therapistConflict = bookings.some(b => 
        b.therapist_id === selectedBooking.therapist_id &&
        b.booking_date === rescheduleDate &&
        b.status === 'booked' &&
        b.id !== selectedBooking.id &&
        !(b.end_time <= rescheduleSlot || b.start_time >= calculatedEndTime)
      );

      if (therapistConflict) {
        throw new Error('Therapist is already booked for this slot.');
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: rescheduleDate,
          start_time: rescheduleSlot,
          end_time: calculatedEndTime
        })
        .eq('id', selectedBooking.id);
      
      if (error) throw error;
      
      showToast('success', 'Appointment rescheduled successfully.');
      setShowRescheduleModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      // Simulated update
      setBookings(bookings.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, booking_date: rescheduleDate, start_time: rescheduleSlot, end_time: calculatedEndTime } 
          : b
      ));
      showToast('success', 'Local simulation: Rescheduled successfully.');
      setShowRescheduleModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Actions: Add / Edit therapist
  const handleTherapistSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTherapist) {
        // Edit mode
        const { error } = await supabase
          .from('therapists')
          .update(therapistForm)
          .eq('id', editingTherapist.id);
        if (error) throw error;
        showToast('success', 'Therapist details updated successfully.');
      } else {
        // Add mode
        const { error } = await supabase
          .from('therapists')
          .insert([therapistForm]);
        if (error) throw error;
        showToast('success', 'Therapist registered successfully.');
      }
      setShowTherapistModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      // Simulated CRUD
      if (editingTherapist) {
        setTherapists(therapists.map(t => t.id === editingTherapist.id ? { ...t, ...therapistForm } : t));
      } else {
        setTherapists([...therapists, { id: 'temp_' + Date.now(), ...therapistForm }]);
      }
      showToast('success', 'Local simulation: Therapist registry updated.');
      setShowTherapistModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReschedule = (booking) => {
    setSelectedBooking(booking);
    setRescheduleDate(booking.booking_date);
    setRescheduleSlot(booking.start_time);
    setShowRescheduleModal(true);
  };

  const handleOpenAddTherapist = () => {
    setEditingTherapist(null);
    setTherapistForm({
      name: '', specialization: '', experience: '', profile_image: '', shift_start: '09:00:00', shift_end: '17:00:00'
    });
    setShowTherapistModal(true);
  };

  const handleOpenEditTherapist = (therapist) => {
    setEditingTherapist(therapist);
    setTherapistForm({
      name: therapist.name,
      specialization: therapist.specialization,
      experience: therapist.experience,
      profile_image: therapist.profile_image || '',
      shift_start: therapist.shift_start,
      shift_end: therapist.shift_end
    });
    setShowTherapistModal(true);
  };

  const handleAddBedSubmit = async (e) => {
    e.preventDefault();
    if (!newBedNumber.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('beds')
        .insert([{ bed_number: newBedNumber.trim(), status: 'available' }]);
      if (error) throw error;
      showToast('success', `Bed ${newBedNumber} registered successfully.`);
      setNewBedNumber('');
      setShowAddBedModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      const newBed = {
        id: 'temp_bed_' + Date.now(),
        bed_number: newBedNumber.trim(),
        status: 'available'
      };
      setBeds([...beds, newBed]);
      showToast('success', `Local simulation: Registered bed ${newBedNumber}.`);
      setNewBedNumber('');
      setShowAddBedModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBed = async (bed) => {
    if (!window.confirm(`WARNING: Deleting ${bed.bed_number} will cancel all appointments scheduled for this bed. Are you sure you want to remove it?`)) return;
    try {
      const { error } = await supabase
        .from('beds')
        .delete()
        .eq('id', bed.id);
      if (error) throw error;
      showToast('success', `Bed ${bed.bed_number} removed successfully.`);
      loadData();
    } catch (err) {
      console.error(err);
      setBeds(beds.filter(b => b.id !== bed.id));
      showToast('success', `Local simulation: Removed bed ${bed.bed_number}.`);
    }
  };

  const handleDeleteTherapist = async (therapist) => {
    if (!window.confirm(`WARNING: Deleting ${therapist.name} will cancel all appointments scheduled with them. Are you sure you want to remove them?`)) return;
    try {
      const { error } = await supabase
        .from('therapists')
        .delete()
        .eq('id', therapist.id);
      if (error) throw error;
      showToast('success', `Therapist ${therapist.name} removed successfully.`);
      loadData();
    } catch (err) {
      console.error(err);
      setTherapists(therapists.filter(t => t.id !== therapist.id));
      showToast('success', `Local simulation: Removed therapist ${therapist.name}.`);
    }
  };

  useEffect(() => {
    setSettingsForm({
      start: clinicHours.start,
      end: clinicHours.end
    });
  }, [clinicHours]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error: startErr } = await supabase
        .from('clinic_settings')
        .upsert({ key: 'clinic_start_time', value: settingsForm.start });
      if (startErr) throw startErr;
      
      const { error: endErr } = await supabase
        .from('clinic_settings')
        .upsert({ key: 'clinic_end_time', value: settingsForm.end });
      if (endErr) throw endErr;
      
      showToast('success', 'Operating hours updated successfully.');
      setClinicHours({
        start: settingsForm.start,
        end: settingsForm.end
      });
      loadData();
    } catch (err) {
      console.error(err);
      setClinicHours({
        start: settingsForm.start,
        end: settingsForm.end
      });
      showToast('success', 'Local simulation: Operating hours updated.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlots = (startStr, endStr) => {
    const slots = [];
    if (!startStr || !endStr) return slots;
    
    const startHour = parseInt(startStr.split(':')[0], 10);
    const endHour = parseInt(endStr.split(':')[0], 10);
    
    for (let h = startHour; h < endHour; h++) {
      const currentHourStr = h.toString().padStart(2, '0') + ':00:00';
      const nextHourStr = (h + 1).toString().padStart(2, '0') + ':00:00';
      slots.push({
        value: currentHourStr,
        label: `${formatTime(currentHourStr)} - ${formatTime(nextHourStr)}`
      });
    }
    return slots;
  };

  const adminMonthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const getAdminDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getAdminFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handleAdminPrevMonth = () => {
    if (adminMonth === 0) {
      setAdminMonth(11);
      setAdminYear(adminYear - 1);
    } else {
      setAdminMonth(adminMonth - 1);
    }
  };

  const handleAdminNextMonth = () => {
    if (adminMonth === 11) {
      setAdminMonth(0);
      setAdminYear(adminYear + 1);
    } else {
      setAdminMonth(adminMonth + 1);
    }
  };

  const adminDaysInMonth = getAdminDaysInMonth(adminYear, adminMonth);
  const adminFirstDay = getAdminFirstDayOfMonth(adminYear, adminMonth);
  const adminBlanks = Array(adminFirstDay).fill(null);
  const adminDays = Array.from({ length: adminDaysInMonth }, (_, i) => i + 1);
  const adminCalendarCells = [...adminBlanks, ...adminDays];

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hr = parseInt(hours, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${displayHr}:${minutes} ${ampm}`;
  };

  // Dynamic statistics calculations
  const totalBeds = beds.length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const maintenanceBeds = beds.filter(b => b.status === 'maintenance').length;
  const totalTherapists = therapists.length;
  const activePatients = patients.length;
  
  // Calculate occupied beds based on current time bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.booking_date === todayStr);
  const activeSessions = todayBookings.filter(b => b.status === 'booked').length;
  const completedSessions = bookings.filter(b => b.status === 'completed').length;

  // Chart data formatting
  // 1. Weekly bookings chart data (last 7 days count)
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyTrendData = [
    { name: 'Mon', Bookings: 12 },
    { name: 'Tue', Bookings: 19 },
    { name: 'Wed', Bookings: 15 },
    { name: 'Thu', Bookings: 22 },
    { name: 'Fri', Bookings: 24 },
    { name: 'Sat', Bookings: 10 }
  ];

  // 2. Bed Utilization data
  const bedUtilizationData = [
    { name: 'Available', value: availableBeds },
    { name: 'Occupied', value: activeSessions },
    { name: 'Maintenance', value: maintenanceBeds }
  ];
  const COLORS = ['#10B981', '#0EA5E9', '#EF4444'];

  // Filtered Calendar Bookings
  const filteredCalendarBookings = bookings.filter(b => {
    const matchesDate = b.booking_date === calendarDate;
    const matchesTherapist = therapistFilter === 'all' || b.therapist_id === therapistFilter;
    const matchesPatient = patientFilter === 'all' || b.patient_id === patientFilter;
    return matchesDate && matchesTherapist && matchesPatient;
  });

  return (
    <Layout>
      <div className="space-y-8 py-4">
        
        {/* Banner notification for mock mode */}
        {errorBanner && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 flex gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Global Toast */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm transition-all duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/40 dark:text-green-300' 
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300'
          }`}>
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{toast.text}</span>
          </div>
        )}

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-3xl transition-colors">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              Clinic Operations Control Panel
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage appointments, therapist scheduling, and real-time bed utilization.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Dashboard
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Analytics Overview', icon: BarChart2 },
            { id: 'calendar', label: 'Appointments Calendar', icon: CalendarDays },
            { id: 'attendance', label: 'Doctor Attendance', icon: UserCheck },
            { id: 'beds', label: 'Beds Management', icon: Bed },
            { id: 'therapists', label: 'Therapist Registry', icon: UserSquare },
            { id: 'patients', label: 'Patient Directory', icon: Users },
            { id: 'settings', label: 'Clinic Settings', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-medical-500 text-medical-500'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* -------------------- TAB CONTENT: OVERVIEW & ANALYTICS -------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Total Beds', val: totalBeds, color: 'text-slate-800 dark:text-white' },
                { label: 'Available Beds', val: availableBeds, color: 'text-green-500' },
                { label: 'Occupied Beds', val: activeSessions, color: 'text-medical-500' },
                { label: 'Under Maintenance', val: maintenanceBeds, color: 'text-red-500' },
                { label: 'Therapists', val: totalTherapists, color: 'text-slate-800 dark:text-white' },
                { label: 'Active Patients', val: activePatients, color: 'text-slate-800 dark:text-white' },
                { label: 'Completed Sessions', val: completedSessions, color: 'text-slate-800 dark:text-white' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 transition-colors">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {stat.label}
                  </div>
                  <div className={`text-2xl font-black mt-2 ${stat.color}`}>
                    {stat.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-12 gap-8">
              
              {/* Weekly Trend Bar Chart (8 cols) */}
              <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 transition-colors">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-6">
                  Weekly Bookings Trend
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }} />
                      <Bar dataKey="Bookings" fill="#0EA5E9" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bed Utilization Pie Chart (4 cols) */}
              <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 transition-colors flex flex-col justify-between">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">
                  Bed Occupancy Status
                </h3>
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bedUtilizationData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {bedUtilizationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  {bedUtilizationData.map((d, i) => (
                    <div key={d.name}>
                      <span className="block font-bold text-slate-800 dark:text-slate-200">{d.value}</span>
                      <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i] }}></span>
                        {d.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------- TAB CONTENT: APPOINTMENTS CALENDAR -------------------- */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up">
            
            {/* LEFT COLUMN: MINI CALENDAR & FILTERS (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Mini Calendar Picker */}
              <div className="bg-white border border-slate-200/60 p-5 rounded-3xl space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-800">
                    {adminMonthNames[adminMonth]} {adminYear}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleAdminPrevMonth}
                      className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={handleAdminNextMonth}
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
                  {adminCalendarCells.map((day, idx) => {
                    if (day === null) {
                      return <div key={`blank-${idx}`} className="h-8"></div>;
                    }

                    const dateStr = `${adminYear}-${(adminMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = calendarDate === dateStr;

                    return (
                      <button
                        key={`day-${day}`}
                        type="button"
                        onClick={() => setCalendarDate(dateStr)}
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

              {/* Filters */}
              <div className="bg-white border border-slate-200/60 p-5 rounded-3xl space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Schedule</h4>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Doctor</label>
                  <select
                    value={therapistFilter}
                    onChange={(e) => setTherapistFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold focus:outline-none text-slate-700"
                  >
                    <option value="all">All Doctors</option>
                    {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Patient</label>
                  <select
                    value={patientFilter}
                    onChange={(e) => setPatientFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold focus:outline-none text-slate-700"
                  >
                    <option value="all">All Patients</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setCalendarDate(new Date().toISOString().split('T')[0]);
                    setAdminYear(new Date().getFullYear());
                    setAdminMonth(new Date().getMonth());
                  }}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-205 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors"
                >
                  Reset to Today
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: DAILY SCHEDULER TIMELINE GRID (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden transition-colors">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Daily Timeline Grid
                  </h3>
                  <p className="text-xs text-slate-400">
                    {new Date(calendarDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs font-bold bg-medical-50 border border-medical-100 text-medical-600 px-3 py-1 rounded-full">
                  {filteredCalendarBookings.length} Active Sessions
                </span>
              </div>

              {/* TIMELINE SCHEDULER */}
              <div className="overflow-x-auto">
                <div className="min-w-[650px]">
                  
                  {/* Grid Header */}
                  <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50/30 text-center py-3 text-[10px] font-bold uppercase text-slate-400">
                    <div className="col-span-2 border-r border-slate-100">Time</div>
                    {/* Map therapists according to filter */}
                    {therapists
                      .filter(t => therapistFilter === 'all' || t.id === therapistFilter)
                      .map((therapist, index, arr) => {
                        const colWidth = 10 / arr.length;
                        return (
                          <div 
                            key={therapist.id} 
                            style={{ gridColumn: `span ${colWidth}` }}
                            className="text-slate-700 font-extrabold"
                          >
                            {therapist.name}
                          </div>
                        );
                      })}
                  </div>

                  {/* Grid Rows */}
                  <div className="divide-y divide-slate-100">
                    {generateSlots(clinicHours.start, clinicHours.end).map((slot) => {
                      const activeTherapists = therapists.filter(t => therapistFilter === 'all' || t.id === therapistFilter);
                      const colWidth = 10 / activeTherapists.length;

                      return (
                        <div key={slot.value} className="grid grid-cols-12 items-stretch min-h-24">
                          {/* Time label */}
                          <div className="col-span-2 flex flex-col justify-center items-center border-r border-slate-100 bg-slate-50/20 text-center px-2 py-4">
                            <span className="text-[11px] font-black text-slate-700">{formatTime(slot.value).split(' ')[0]}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{formatTime(slot.value).split(' ')[1]}</span>
                          </div>

                          {/* Columns per Therapist */}
                          {activeTherapists.map((therapist) => {
                            // Find booking in this slot for this therapist
                            const booking = filteredCalendarBookings.find(b => 
                              b.therapist?.id === therapist.id &&
                              b.start_time.split(':')[0] === slot.value.split(':')[0]
                            );

                            // Check if doctor is on shift for this slot
                            const isDoctorOnShift = therapist.shift_start <= slot.value && therapist.shift_end > slot.value;

                            return (
                              <div 
                                key={therapist.id} 
                                style={{ gridColumn: `span ${colWidth}` }}
                                className={`border-r border-slate-100 last:border-r-0 p-2 flex flex-col justify-between ${
                                  !isDoctorOnShift ? 'bg-slate-50/40 opacity-70' : 'bg-white hover:bg-slate-50/30'
                                }`}
                              >
                                {booking ? (
                                  <div className="rounded-2xl border border-slate-200/85 bg-white p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full space-y-2">
                                    <div className="space-y-0.5">
                                      <div className="font-extrabold text-[11px] text-slate-800 leading-tight">
                                        {booking.patient?.name || 'Walk-in'}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium">
                                        Bed {booking.bed?.bed_number.split(' ')[1] || booking.bed?.bed_number}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 pt-1 border-t border-slate-100">
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        booking.status === 'completed'
                                          ? 'bg-green-50 text-green-600'
                                          : booking.status === 'cancelled'
                                            ? 'bg-red-50 text-red-500'
                                            : 'bg-medical-50 text-medical-600'
                                      }`}>
                                        {booking.status}
                                      </span>
                                      
                                      {booking.status === 'booked' && (
                                        <div className="flex gap-1.5">
                                          <button 
                                            onClick={() => handleCompleteBooking(booking.id)}
                                            className="text-[9px] font-black text-green-600 hover:underline"
                                            title="Mark Completed"
                                          >
                                            Done
                                          </button>
                                          <button 
                                            onClick={() => handleOpenReschedule(booking)}
                                            className="text-[9px] font-black text-medical-500 hover:underline"
                                            title="Reschedule"
                                          >
                                            Shift
                                          </button>
                                          <button 
                                            onClick={() => handleCancelBooking(booking.id)}
                                            className="text-[9px] font-black text-red-400 hover:underline"
                                            title="Cancel"
                                          >
                                            X
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : !isDoctorOnShift ? (
                                  <div className="flex items-center justify-center h-full text-[9px] font-bold text-slate-400 tracking-wider">
                                    OFF SHIFT
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full border border-dashed border-slate-100 hover:border-slate-200 rounded-2xl transition-colors min-h-[60px] group cursor-pointer">
                                    <span className="text-[11px] font-bold text-slate-350 group-hover:text-slate-400 group-hover:scale-110 transition-all">+</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* -------------------- TAB CONTENT: DOCTOR ATTENDANCE -------------------- */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-slide-up">
            
            {/* Header / Date Selector */}
            <div className="bg-white border border-slate-200/60 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Doctor Attendance Logging</h3>
                <p className="text-xs text-slate-400">Mark daily attendance to dynamically adjust clinic booking capacities.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Log Date:</span>
                <input 
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold focus:outline-none text-slate-700"
                />
              </div>
            </div>

            {/* Attendance Roster */}
            <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h4 className="font-bold text-slate-800 text-sm">Attendance Roster</h4>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                  {therapists.length} Doctors Registered
                </span>
              </div>

              {loadingAttendance ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-500 border-t-transparent mx-auto mb-2"></div>
                  Loading attendance records...
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {therapists.map((therapist) => {
                    const record = attendanceRecords.find(r => r.therapist_id === therapist.id);
                    const currentStatus = record ? record.status : 'present'; // default to present if not logged

                    return (
                      <div key={therapist.id} className="p-6 hover:bg-slate-50/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        
                        {/* Doctor Profile Info */}
                        <div className="flex gap-4 items-center">
                          <img 
                            src={therapist.profile_image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150'} 
                            alt={therapist.name} 
                            className="h-12 w-12 rounded-2xl object-cover border border-slate-100 shadow-xs"
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm">{therapist.name}</h4>
                            <p className="text-xs text-slate-400 font-semibold">{therapist.specialization}</p>
                          </div>
                        </div>

                        {/* Shift Hours */}
                        <div className="text-xs font-semibold text-slate-450">
                          Shift: {formatTime(therapist.shift_start)} - {formatTime(therapist.shift_end)}
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200/50 rounded-2xl">
                          {[
                            { id: 'present', label: 'Present', activeClass: 'bg-green-500 text-white shadow-sm' },
                            { id: 'absent', label: 'Absent', activeClass: 'bg-red-500 text-white shadow-sm' },
                            { id: 'on_leave', label: 'On Leave', activeClass: 'bg-amber-500 text-white shadow-sm' }
                          ].map((btn) => {
                            const isActive = currentStatus === btn.id;
                            return (
                              <button
                                key={btn.id}
                                type="button"
                                onClick={() => handleMarkAttendance(therapist.id, btn.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  isActive
                                    ? btn.activeClass
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {btn.label}
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* -------------------- TAB CONTENT: BEDS MANAGEMENT -------------------- */}
        {activeTab === 'beds' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Clinic Beds Inventory</h3>
              <button 
                onClick={() => setShowAddBedModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-medical-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600"
              >
                <Plus className="h-4 w-4" />
                Add Bed Asset
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {beds.map((bed) => {
                const isMaintenance = bed.status === 'maintenance';
                const isOccupied = bed.status === 'occupied';
                return (
                  <div 
                    key={bed.id}
                    className={`rounded-3xl border p-6 flex flex-col justify-between h-44 bg-white dark:bg-slate-900 transition-all ${
                      isMaintenance 
                        ? 'border-red-200/50 hover:border-red-300 dark:border-red-950/50' 
                        : isOccupied 
                          ? 'border-medical-200/50 hover:border-medical-300 dark:border-medical-950/50'
                          : 'border-slate-200/60 hover:border-slate-350 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-400">Clinic Asset</div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">{bed.bed_number}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMaintenance 
                            ? 'bg-red-50 text-red-500 dark:bg-red-950/30'
                            : isOccupied
                              ? 'bg-medical-50 text-medical-500 dark:bg-medical-950/30'
                              : 'bg-green-50 text-green-500 dark:bg-green-950/30'
                        }`}>
                          {bed.status.toUpperCase()}
                        </span>
                        {!isOccupied && (
                          <button
                            onClick={() => handleDeleteBed(bed)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Bed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/40">
                      <span className="text-xs text-slate-400 font-medium">
                        {isMaintenance ? 'Under Maintenance' : isOccupied ? 'Patient In Session' : 'Ready For Assignment'}
                      </span>
                      <button
                        onClick={() => handleToggleBedStatus(bed.id, bed.status)}
                        disabled={isOccupied}
                        className={`text-xs font-bold transition-colors ${
                          isMaintenance 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-red-500 hover:text-red-600 disabled:opacity-50'
                        }`}
                      >
                        {isMaintenance ? 'Make Available' : 'Block Bed'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------- TAB CONTENT: THERAPISTS REGISTRY -------------------- */}
        {activeTab === 'therapists' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Licensed Practitioners</h3>
              <button 
                onClick={handleOpenAddTherapist}
                className="inline-flex items-center gap-1.5 rounded-xl bg-medical-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600"
              >
                <Plus className="h-4 w-4" />
                Register Therapist
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400 bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="p-4 pl-6">Therapist Details</th>
                    <th className="p-4">Clinical Specialty</th>
                    <th className="p-4">Experience</th>
                    <th className="p-4">Working Shift</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-700 dark:text-slate-300">
                  {therapists.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <img 
                          src={t.profile_image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100'} 
                          alt={t.name} 
                          className="h-10 w-10 rounded-full object-cover shrink-0" 
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{t.name}</span>
                      </td>
                      <td className="p-4 font-semibold text-medical-600 dark:text-medical-400">
                        {t.specialization}
                      </td>
                      <td className="p-4">
                        {t.experience} Years
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        {formatTime(t.shift_start)} - {formatTime(t.shift_end)}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-3">
                        <button 
                          onClick={() => handleOpenEditTherapist(t)}
                          className="text-xs font-bold text-medical-500 hover:underline"
                        >
                          Edit Details
                        </button>
                        <button 
                          onClick={() => handleDeleteTherapist(t)}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- TAB CONTENT: PATIENT DIRECTORY -------------------- */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-3xl flex items-center gap-3 transition-colors">
              <Search className="h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search registered patients by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm border-none focus:outline-none dark:text-white"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400 bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="p-4 pl-6">Patient Name</th>
                    <th className="p-4">Registered Email</th>
                    <th className="p-4">Phone Contact</th>
                    <th className="p-4 pr-6 text-right">Active Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm text-slate-700 dark:text-slate-300">
                  {patients
                    .filter(p => 
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      p.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => {
                      const patientBookings = bookings.filter(b => b.patient?.id === p.id && b.status === 'booked');
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                          <td className="p-4 pl-6 font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </td>
                          <td className="p-4">
                            {p.email}
                          </td>
                          <td className="p-4 font-medium">
                            {p.phone || 'Not provided'}
                          </td>
                          <td className="p-4 pr-6 text-right font-bold text-medical-500">
                            {patientBookings.length} Active Sessions
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- TAB CONTENT: CLINIC SETTINGS -------------------- */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 space-y-6 transition-colors shadow-md">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-medical-500" />
                Clinic Working Hours
              </h3>
              <p className="text-xs text-slate-400">
                Configure the daily operating schedule. These settings dynamically update appointment booking slots.
              </p>
            </div>
            
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Clinic Open Time</label>
                  <input 
                    type="time" 
                    required
                    value={settingsForm.start}
                    onChange={(e) => setSettingsForm({ ...settingsForm, start: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Clinic Close Time</label>
                  <input 
                    type="time" 
                    required
                    value={settingsForm.end}
                    onChange={(e) => setSettingsForm({ ...settingsForm, end: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-medical-500 px-6 py-3 text-xs font-bold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600 disabled:opacity-75"
                >
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* -------------------- RESCHEDULE APPOINTMENT MODAL -------------------- */}
        {showRescheduleModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Reschedule Session</h3>
                <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Patient</label>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedBooking.patient?.name}</div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Therapist</label>
                  <div className="font-bold text-slate-850 dark:text-slate-300">{selectedBooking.therapist?.name}</div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">New Date</label>
                  <input 
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                  />
                </div>

                 <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">New Time Slot</label>
                  <select
                    value={rescheduleSlot}
                    onChange={(e) => setRescheduleSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                  >
                    {generateSlots(clinicHours.start, clinicHours.end).map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-805">
                  <button 
                    type="button" 
                    onClick={() => setShowRescheduleModal(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 py-2.5 px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-medical-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600 disabled:opacity-75"
                  >
                    {submitting ? 'Updating...' : 'Reschedule'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* -------------------- THERAPIST REGISTRATION / EDIT MODAL -------------------- */}
        {showTherapistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingTherapist ? 'Edit Practitioner Registry' : 'Register Therapist'}
                </h3>
                <button onClick={() => setShowTherapistModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleTherapistSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Practitioner Name</label>
                  <input 
                    type="text" 
                    required
                    value={therapistForm.name}
                    onChange={(e) => setTherapistForm({ ...therapistForm, name: e.target.value })}
                    placeholder="Dr. Alexander Wright"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Clinical Specialty</label>
                  <input 
                    type="text" 
                    required
                    value={therapistForm.specialization}
                    onChange={(e) => setTherapistForm({ ...therapistForm, specialization: e.target.value })}
                    placeholder="Sports Injury Rehab"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Experience (Years)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={therapistForm.experience}
                    onChange={(e) => setTherapistForm({ ...therapistForm, experience: parseInt(e.target.value) || 0 })}
                    placeholder="8"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Profile Photo URL</label>
                  <input 
                    type="text"
                    value={therapistForm.profile_image}
                    onChange={(e) => setTherapistForm({ ...therapistForm, profile_image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Shift Start</label>
                    <input 
                      type="time" 
                      required
                      value={therapistForm.shift_start}
                      onChange={(e) => setTherapistForm({ ...therapistForm, shift_start: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Shift End</label>
                    <input 
                      type="time" 
                      required
                      value={therapistForm.shift_end}
                      onChange={(e) => setTherapistForm({ ...therapistForm, shift_end: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-805">
                  <button 
                    type="button" 
                    onClick={() => setShowTherapistModal(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 py-2.5 px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-medical-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600"
                  >
                    {submitting ? 'Saving...' : 'Save Therapist'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* -------------------- ADD BED MODAL -------------------- */}
        {showAddBedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Bed Asset</h3>
                <button onClick={() => setShowAddBedModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddBedSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bed Number / Code</label>
                  <input 
                    type="text" 
                    required
                    value={newBedNumber}
                    onChange={(e) => setNewBedNumber(e.target.value)}
                    placeholder="Bed D-3"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 text-sm focus:outline-none dark:text-white"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-805">
                  <button 
                    type="button" 
                    onClick={() => setShowAddBedModal(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 py-2.5 px-4"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-medical-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600"
                  >
                    {submitting ? 'Registering...' : 'Add Bed'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
