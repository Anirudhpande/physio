import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Activity, Mail, Lock, ArrowRight, Loader2, AlertCircle, HeartPulse } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: email.split('@')[0] }
          }
        });
        if (signUpErr) throw signUpErr;
      }
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">

      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-medical-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-medical-500 flex items-center justify-center shadow-lg shadow-medical-500/30">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tight">
              Physio<span className="text-medical-400">Care</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Receptionist Portal</p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-medical-500/10 border border-medical-500/20 rounded-full px-3 py-1">
            <HeartPulse className="h-3.5 w-3.5 text-medical-400" />
            <span className="text-[11px] font-bold text-medical-400 uppercase tracking-wider">Staff Access Only</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">{isSignUp ? 'Register Staff Account' : 'Welcome back'}</h2>
          <p className="text-slate-400 text-sm mb-7">{isSignUp ? 'Create a receptionist account with staff access' : 'Sign in to access the clinic dashboard'}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex gap-3 text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="receptionist@clinic.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-medical-500/60 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-medical-500/60 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-medical-500 hover:bg-medical-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-medical-500/25 transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {isSignUp ? 'Creating account...' : 'Signing in...'}</>
              ) : (
                <><span>{isSignUp ? 'Create Account' : 'Sign In'}</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
              {isSignUp ? 'Already have an account? Sign In' : 'Need a receptionist account? Register Staff'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          PhysioCare Management System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
