import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  FileText,
  Sparkles,
  Layers,
  HelpCircle,
  Calendar,
  Upload,
  Flame,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const { user, stats, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [recentDocs, setRecentDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      if (res.data.success) {
        setRecentDocs(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowed = ['.pdf', '.txt', '.md', '.markdown'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      showError(`Unsupported file format '${ext}'. Please upload a PDF, TXT, or MD file.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showSuccess(`"${file.name}" uploaded and analyzed! AI assets generated. 🎉`);
        await fetchDocuments();
        await refreshProfile();
        // Redirect to summary view of newly uploaded doc
        navigate(`/summary/${res.data.document.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload document.';
      showError(msg);
    } fontSettled: {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900/60 via-indigo-900/40 to-slate-900 border border-brand-500/20 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-300 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Study Ecosystem
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to master your courses, {user?.name}?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Upload your lecture notes, PDFs, or Markdown study materials. We'll automatically generate concise summaries, smart flashcards, interactive quizzes, and a structured study plan!
          </p>
        </div>

        {/* Decorative ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Overview Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Documents</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalDocuments || 0}</div>
          <p className="text-[11px] text-slate-400">Uploaded & extracted</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Flashcards Mastered</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.masteredFlashcards || 0} <span className="text-xs font-normal text-slate-400">/ {stats?.totalFlashcards || 0}</span>
          </div>
          <p className="text-[11px] text-slate-400">Active memory retention</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Average Quiz Score</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-300">{stats?.avgQuizScore || 0}%</div>
          <p className="text-[11px] text-slate-400">{stats?.quizzesTakenCount || 0} quiz attempts completed</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Study Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">{user?.studyStreak || stats?.studyStreak || 1} Days</div>
          <p className="text-[11px] text-slate-400">Target: {user?.dailyTargetHours || 2} hrs/day</p>
        </div>
      </div>

      {/* Main Grid: File Uploader & Quick Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop Quick Upload Area */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand-400" />
              Quick Material Upload
            </h2>
            <p className="text-xs text-slate-400">Upload PDF, TXT, or MD to immediately create study assets</p>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`my-4 border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px] ${
              dragActive
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
            }`}
          >
            {isUploading ? (
              <div className="space-y-3">
                <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-brand-300">Extracting text & generating assets...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">Drag & drop study file here</p>
                <p className="text-[11px] text-slate-500 mt-1">Supports PDF, TXT, MD (Max 15MB)</p>
                <label className="mt-4 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-colors border border-slate-700">
                  <Plus className="w-3.5 h-3.5" />
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Automatic text extraction, flashcard generator & quiz creator included.</span>
          </div>
        </div>

        {/* Recent Study Materials & Quick Launch */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Recent Study Materials</h2>
              <p className="text-xs text-slate-400">Continue learning from your uploaded files</p>
            </div>
            <button
              onClick={() => navigate('/materials')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingDocs ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading study materials...</div>
          ) : recentDocs.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-950/30 rounded-2xl border border-slate-800/60 p-6">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400 font-medium">No study materials uploaded yet</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Upload your first lecture notes, PDF textbook, or markdown document to unlock automated AI summaries, cards & quizzes!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocs.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-800/50 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white line-clamp-1">{doc.originalName}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>{doc.wordCount} words</span>
                        <span>•</span>
                        <span>{doc.fileType.toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => navigate(`/summary/${doc.id}`)}
                      title="View Summary"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      Summary
                    </button>
                    <button
                      onClick={() => navigate(`/flashcards/${doc.id}`)}
                      title="Study Flashcards"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      Cards
                    </button>
                    <button
                      onClick={() => navigate(`/quiz/${doc.id}`)}
                      title="Take Practice Quiz"
                      className="px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
