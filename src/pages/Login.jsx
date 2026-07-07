import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill convenience for testing
  const handlePrefill = (role) => {
    if (role === 'admin') {
      setEmail('admin@physiocare.com');
      setPassword('admin123');
    } else {
      setEmail('patient@physiocare.com');
      setPassword('patient123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await signIn(email, password);
      // Wait for AuthContext to fetch the profile
      // Redirection is handled either here or in ProtectedRoute, but let's check profile role.
      // Since fetching profile happens asynchronously on session change, let's query profiles directly
      // or navigate to a transitional check route. Let's redirect to `/dashboard` for patients or `/admin` for admins.
      // To do this reliably, we can check the metadata or let AuthContext handle the redirection.
      // Let's redirect based on user metadata or check profiles
      const userMeta = data?.user?.user_metadata || {};
      const role = userMeta.role || 'patient';
      
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'therapist') {
        navigate('/doctor');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 group justify-center">
          <div className="rounded-xl bg-medical-500 p-2 text-white shadow-lg shadow-medical-500/30">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">
            Physio<span className="text-medical-500">Care</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Or{' '}
          <Link to="/register" className="font-bold text-medical-500 hover:text-medical-600 dark:hover:text-medical-400 transition-colors">
            create a new patient account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 border border-slate-200/50 dark:border-slate-800/50 shadow-md sm:rounded-3xl sm:px-10 transition-colors duration-200">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4 flex gap-3 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-medical-500 hover:text-medical-600 dark:hover:text-medical-400">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-medical-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-medical-500/20 hover:bg-medical-600 transition-colors disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Test Prefills Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
              Developer Test Credentials
            </span>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => handlePrefill('patient')}
                className="text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
              >
                Use Patient Demo
              </button>
              <button 
                onClick={() => handlePrefill('admin')}
                className="text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
              >
                Use Admin Demo
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Note: You can also register a fresh account with your chosen role.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
