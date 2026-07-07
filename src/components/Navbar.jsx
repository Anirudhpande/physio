import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Menu, X, Sun, Moon, LogOut, User, Calendar, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  const isLandingPage = location.pathname === '/';

  const scrollToSection = (id) => {
    setIsOpen(false);
    if (!isLandingPage) {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (isLandingPage && location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      // Clear state so it doesn't re-scroll on navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, isLandingPage, navigate]);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="rounded-xl bg-medical-500 p-2 text-white shadow-lg shadow-medical-500/30 transition-transform group-hover:scale-105">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
              Physio<span className="text-medical-500">Care</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-slate-600 hover:text-medical-500 dark:text-slate-300 dark:hover:text-medical-400 transition-colors">
              About
            </button>
            <button onClick={() => scrollToSection('services')} className="text-sm font-medium text-slate-600 hover:text-medical-500 dark:text-slate-300 dark:hover:text-medical-400 transition-colors">
              Services
            </button>
            <button onClick={() => scrollToSection('therapists')} className="text-sm font-medium text-slate-600 hover:text-medical-500 dark:text-slate-300 dark:hover:text-medical-400 transition-colors">
              Therapists
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-slate-600 hover:text-medical-500 dark:text-slate-300 dark:hover:text-medical-400 transition-colors">
              Contact
            </button>



            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                {profile?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 rounded-xl bg-medical-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600 hover:shadow-lg transition-all"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                {profile?.role === 'therapist' && (
                  <Link 
                    to="/doctor" 
                    className="flex items-center gap-1.5 rounded-xl bg-medical-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600 hover:shadow-lg transition-all"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Doctor Portal
                  </Link>
                )}
                {profile?.role === 'patient' && (
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-1.5 rounded-xl bg-medical-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600 hover:shadow-lg transition-all"
                  >
                    <Calendar className="h-4 w-4" />
                    Book Slots
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-medical-500 dark:text-slate-300 dark:hover:text-medical-400 transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/login" 
                  className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900 transition-colors duration-200">
          <div className="space-y-1 px-4 py-4">
            <button 
              onClick={() => scrollToSection('about')} 
              className="block w-full text-left rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-medical-500 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('services')} 
              className="block w-full text-left rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-medical-500 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('therapists')} 
              className="block w-full text-left rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-medical-500 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Therapists
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className="block w-full text-left rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-medical-500 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Contact
            </button>

            <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>

            {user ? (
              <div className="space-y-2">
                {profile?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-medical-500 py-3 text-base font-semibold text-white shadow-md shadow-medical-500/20"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Admin Panel
                  </Link>
                )}
                {profile?.role === 'therapist' && (
                  <Link 
                    to="/doctor" 
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-medical-500 py-3 text-base font-semibold text-white shadow-md shadow-medical-500/20"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Doctor Portal
                  </Link>
                )}
                {profile?.role === 'patient' && (
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-medical-500 py-3 text-base font-semibold text-white shadow-md shadow-medical-500/20"
                  >
                    <Calendar className="h-5 w-5" />
                    Book Slots
                  </Link>
                )}
                
                <button 
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 py-3 text-base font-semibold text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="flex justify-center items-center rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="flex justify-center items-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 text-base font-medium shadow-md"
                >
                  Book Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
