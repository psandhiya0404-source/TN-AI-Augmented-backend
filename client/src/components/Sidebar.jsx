import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Sparkles, Layers, HelpCircle, Calendar, User } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/materials', label: 'Study Materials', icon: FileText },
    { to: '/summary', label: 'AI Summaries', icon: Sparkles },
    { to: '/flashcards', label: 'Flashcards', icon: Layers },
    { to: '/quiz', label: 'Practice Quizzes', icon: HelpCircle },
    { to: '/study-plan', label: 'Study Plan', icon: Calendar },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900/50 border-r border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 hidden md:block">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 border border-brand-500/30 text-brand-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
