import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  Flame,
  Target,
  Clock,
  Lock,
  Save,
  Award,
  FileText,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function ProfileView() {
  const { user, stats, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [studyGoals, setStudyGoals] = useState(user?.studyGoals || '');
  const [dailyTargetHours, setDailyTargetHours] = useState(user?.dailyTargetHours || 2);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateProfile({
      name,
      studyGoals,
      dailyTargetHours: parseFloat(dailyTargetHours) || 2
    });
    setSavingProfile(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setSavingPassword(true);
    const res = await updateProfile({
      currentPassword,
      newPassword
    });
    setSavingPassword(false);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* User Header Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40">
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-brand-500/40 object-cover shadow-xl"
        />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold inline-self-center">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{user?.studyStreak || stats?.studyStreak || 1} Days Active Streak</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>
          <p className="text-xs text-brand-300 font-medium">{user?.studyGoals}</p>
        </div>
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <FileText className="w-5 h-5 text-brand-400 mx-auto" />
          <div className="text-lg font-bold text-white">{stats?.totalDocuments || 0}</div>
          <p className="text-[10px] text-slate-400">Documents</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <Layers className="w-5 h-5 text-emerald-400 mx-auto" />
          <div className="text-lg font-bold text-emerald-400">{stats?.masteredFlashcards || 0}</div>
          <p className="text-[10px] text-slate-400">Mastered Cards</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <HelpCircle className="w-5 h-5 text-purple-400 mx-auto" />
          <div className="text-lg font-bold text-purple-300">{stats?.avgQuizScore || 0}%</div>
          <p className="text-[10px] text-slate-400">Avg Quiz Score</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <Clock className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-lg font-bold text-amber-400">{user?.dailyTargetHours || 2}h</div>
          <p className="text-[10px] text-slate-400">Daily Target</p>
        </div>
      </div>

      {/* Settings Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-brand-400" /> Profile Preferences
          </h2>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Study Goals</label>
              <textarea
                rows={2}
                value={studyGoals}
                onChange={(e) => setStudyGoals(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Daily Target Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* Password Security Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" /> Security & Password
          </h2>

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Lock className="w-4 h-4" />
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
