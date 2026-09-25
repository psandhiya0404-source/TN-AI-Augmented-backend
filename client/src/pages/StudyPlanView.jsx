import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  CheckSquare,
  Square,
  Clock,
  Target,
  Sparkles,
  ChevronDown,
  BookOpen
} from 'lucide-react';

export default function StudyPlanView() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [documents, setDocuments] = useState([]);
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentsAndPlan();
  }, [docId]);

  const fetchDocumentsAndPlan = async () => {
    try {
      const docsRes = await api.get('/documents');
      if (docsRes.data.success && docsRes.data.documents.length > 0) {
        setDocuments(docsRes.data.documents);
        const targetDocId = docId || docsRes.data.documents[0].id;
        fetchPlanForDoc(targetDocId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchPlanForDoc = async (targetDocId) => {
    setLoading(true);
    try {
      const res = await api.get(`/study-plans/${targetDocId}`);
      if (res.data.success) {
        setStudyPlan(res.data.studyPlan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (planId, taskId) => {
    try {
      const res = await api.patch(`/study-plans/${planId}/task/${taskId}`);
      if (res.data.success) {
        setStudyPlan(res.data.studyPlan);
        showSuccess('Task status updated! 🚀');
      }
    } catch (err) {
      showError('Failed to update task.');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 text-xs">Loading structured study plan...</div>;
  }

  if (!studyPlan || !studyPlan.schedule) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800 max-w-lg mx-auto">
        <Calendar className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-base font-bold text-white">No Study Plan Created</h2>
        <p className="text-xs text-slate-400">Upload study materials to auto-generate a daily mastery schedule.</p>
        <button
          onClick={() => navigate('/materials')}
          className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold"
        >
          Go to Materials
        </button>
      </div>
    );
  }

  const schedule = studyPlan.schedule || [];
  let totalTasks = 0;
  let completedTasks = 0;

  schedule.forEach((dayItem) => {
    if (dayItem.tasks) {
      totalTasks += dayItem.tasks.length;
      completedTasks += dayItem.tasks.filter((t) => t.completed).length;
    }
  });

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{studyPlan.title}</h1>
            <p className="text-[11px] text-slate-400">
              {studyPlan.targetDays} Days Target • {studyPlan.dailyHours} hrs/day • Total {studyPlan.totalEstimatedHours} Hours
            </p>
          </div>
        </div>

        {documents.length > 1 && (
          <select
            value={studyPlan.docId}
            onChange={(e) => {
              navigate(`/study-plan/${e.target.value}`);
              fetchPlanForDoc(e.target.value);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.originalName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Progress Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Overall Plan Completion</span>
          <span className="text-amber-400 font-bold">{completionPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
          <span>{completedTasks} of {totalTasks} tasks completed</span>
          <span>Target Date: {studyPlan.targetDays} days from upload</span>
        </div>
      </div>

      {/* Daily Schedule Cards */}
      <div className="space-y-4">
        {schedule.map((dayItem) => (
          <div
            key={dayItem.day}
            className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                  D{dayItem.day}
                </span>
                <h3 className="text-sm font-bold text-white">{dayItem.title}</h3>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> {dayItem.dailyTargetHours} hrs
              </span>
            </div>

            {/* Task list for the day */}
            <div className="space-y-2">
              {dayItem.tasks?.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleToggleTask(studyPlan.id, task.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                    task.completed
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200 line-through'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span>{task.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{task.estimatedMinutes} mins</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
