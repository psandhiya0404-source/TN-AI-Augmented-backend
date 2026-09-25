import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import SummaryView from './pages/SummaryView';
import FlashcardsView from './pages/FlashcardsView';
import QuizView from './pages/QuizView';
import StudyPlanView from './pages/StudyPlanView';
import ProfileView from './pages/ProfileView';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400 bg-slate-900">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-400 bg-slate-900">
        Loading Study Buddy...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {isAuthenticated ? (
        <div className="flex flex-1 max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/summary" element={<SummaryView />} />
              <Route path="/summary/:docId" element={<SummaryView />} />
              <Route path="/flashcards" element={<FlashcardsView />} />
              <Route path="/flashcards/:docId" element={<FlashcardsView />} />
              <Route path="/quiz" element={<QuizView />} />
              <Route path="/quiz/:docId" element={<QuizView />} />
              <Route path="/study-plan" element={<StudyPlanView />} />
              <Route path="/study-plan/:docId" element={<StudyPlanView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      )}
    </div>
  );
}
