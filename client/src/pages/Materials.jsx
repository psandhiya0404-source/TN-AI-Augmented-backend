import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Sparkles,
  Layers,
  HelpCircle,
  Calendar,
  X,
  CheckCircle2,
  FileCheck,
  Search
} from 'lucide-react';

export default function Materials() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocForView, setSelectedDocForView] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const { showSuccess, showError } = useToast();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      showError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
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
        showSuccess(`"${file.name}" uploaded & parsed! 🎉`);
        await fetchDocuments();
        await refreshProfile();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload document.';
      showError(msg);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleInspectDoc = async (id) => {
    try {
      const res = await api.get(`/documents/${id}`);
      if (res.data.success) {
        setSelectedDocForView(res.data.document);
      }
    } catch (err) {
      showError('Failed to fetch document content.');
    }
  };

  const handleDeleteDoc = async (id) => {
    try {
      const res = await api.delete(`/documents/${id}`);
      if (res.data.success) {
        showSuccess(res.data.message);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setDeleteConfirmId(null);
        await refreshProfile();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete material.');
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" />
            Study Materials Library
          </h1>
          <p className="text-xs text-slate-400">Manage your uploaded PDFs, TXT notes, and Markdown documents</p>
        </div>

        <label className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-brand-600/20 transition-all">
          <Upload className="w-4 h-4" />
          {isUploading ? 'Extracting Text...' : 'Upload PDF / TXT / MD'}
          <input
            type="file"
            accept=".pdf,.txt,.md,.markdown"
            disabled={isUploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search uploaded materials by filename..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
        />
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading study library...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No materials found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery ? 'No materials match your search query.' : 'Upload your course documents to generate flashcards, summaries, and quizzes automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                    {doc.fileType.replace('.', '')}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white line-clamp-1" title={doc.originalName}>
                    {doc.originalName}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {doc.summaryPreview || 'Document parsed and ready for study.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{doc.wordCount} words</span>
                  <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    onClick={() => navigate(`/summary/${doc.id}`)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-brand-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Summary"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/flashcards/${doc.id}`)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Flashcards"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/quiz/${doc.id}`)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-purple-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Quiz"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleInspectDoc(doc.id)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Inspect Text"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/study-plan/${doc.id}`)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3 text-amber-400" />
                    Study Schedule
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(doc.id)}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-rose-500/30 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              Confirm Material Deletion
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this study material? This will permanently erase the document, extracted text, generated flashcards, quizzes, and study schedules.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDoc(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20"
              >
                Delete Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Extracted Text Viewer Modal */}
      {selectedDocForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full glass-panel rounded-3xl border border-slate-800 flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedDocForView.originalName}</h3>
                <p className="text-[11px] text-slate-400">Extracted Text Content • {selectedDocForView.wordCount} Words</p>
              </div>
              <button
                onClick={() => setSelectedDocForView(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap bg-slate-950/60 select-text">
              {selectedDocForView.extractedText}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
              <button
                onClick={() => setSelectedDocForView(null)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
