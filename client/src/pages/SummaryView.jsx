import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Sparkles, BookOpen, Clock, FileText, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react';

export default function SummaryView() {
  const { docId } = useParams();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentsAndSummary();
  }, [docId]);

  const fetchDocumentsAndSummary = async () => {
    try {
      const res = await api.get('/documents');
      if (res.data.success && res.data.documents.length > 0) {
        setDocuments(res.data.documents);

        const targetId = docId || res.data.documents[0].id;
        fetchSingleDoc(targetId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchSingleDoc = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/documents/${id}`);
      if (res.data.success) {
        setSelectedDoc(res.data.document);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 text-xs">Generating summary breakdown...</div>;
  }

  if (!selectedDoc || !selectedDoc.summary) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800">
        <Sparkles className="w-12 h-12 text-brand-400 mx-auto" />
        <h2 className="text-base font-bold text-white">No Summary Available</h2>
        <p className="text-xs text-slate-400">Upload a study material first to generate a detailed summary.</p>
        <button
          onClick={() => navigate('/materials')}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
        >
          Go to Materials
        </button>
      </div>
    );
  }

  const { summary } = selectedDoc;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Document Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{summary.title || selectedDoc.originalName}</h1>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> {summary.wordCount} words
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> ~{summary.readingTimeMinutes} min read
              </span>
            </div>
          </div>
        </div>

        {documents.length > 1 && (
          <select
            value={selectedDoc.id}
            onChange={(e) => {
              navigate(`/summary/${e.target.value}`);
              fetchSingleDoc(e.target.value);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.originalName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Executive Summary Block */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-brand-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/30 space-y-3">
        <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          Executive Overview
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {summary.executiveSummary}
        </p>
      </div>

      {/* Key Takeaways Grid */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Key Concepts & Takeaways
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summary.keyPoints?.map((point, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Terminology & Definitions */}
      {summary.keyTerminology && summary.keyTerminology.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" />
            Key Terminology & Definitions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summary.keyTerminology.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-xs font-bold text-amber-300 block">{item.term}</span>
                <p className="text-[11px] text-slate-400 leading-normal">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep-Dive Sections */}
      {summary.deepDiveSections && summary.deepDiveSections.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-brand-400" />
            Section Breakdown
          </h2>
          <div className="space-y-3">
            {summary.deepDiveSections.map((sec, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h3 className="text-xs font-bold text-slate-100">{sec.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{sec.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
