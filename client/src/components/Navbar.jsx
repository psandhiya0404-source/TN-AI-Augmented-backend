import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, LogOut, User, BookOpen, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { user, stats, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
            <BookOpen className="w-5 h-5" />
          </div>
          StudyBuddy AI
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
              <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
              <span>{user.studyStreak || stats?.studyStreak || 1} Day Streak</span>
            </div>

            {/* Quick Upload Action */}
            <button
              onClick={() => navigate('/materials')}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-brand-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              Upload Document
            </button>

            {/* User Profile dropdown or button */}
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover"
              />
              <span className="hidden md:inline text-xs font-semibold text-slate-200">{user.name}</span>
            </Link>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-brand-600/20"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
