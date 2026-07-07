import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 transition-colors duration-200">
      <div className="text-center space-y-6 max-w-md">
        
        <Link to="/" className="inline-flex items-center gap-2 group justify-center mb-4">
          <div className="rounded-xl bg-medical-500 p-2 text-white shadow-lg shadow-medical-500/30">
            <Activity className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-800 dark:text-white">
            Physio<span className="text-medical-500">Care</span>
          </span>
        </Link>

        <h1 className="text-6xl font-black text-slate-900 dark:text-white">404</h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-350">Page Not Found</h2>
        
        <p className="text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Homepage
        </Link>

      </div>
    </div>
  );
}
