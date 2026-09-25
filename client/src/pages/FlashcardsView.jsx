import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Shuffle
} from 'lucide-react';

export default function FlashcardsView() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [documents, setDocuments] = useState([]);
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentsAndCards();
  }, [docId]);

  const fetchDocumentsAndCards = async () => {
    try {
      const docsRes = await api.get('/documents');
      if (docsRes.data.success && docsRes.data.documents.length > 0) {
        setDocuments(docsRes.data.documents);
        const targetDocId = docId || docsRes.data.documents[0].id;
        fetchCardsForDoc(targetDocId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchCardsForDoc = async (targetDocId) => {
    setLoading(true);
    try {
      const res = await api.get(`/flashcards/${targetDocId}`);
      if (res.data.success) {
        setFlashcardSet(res.data.flashcardSet);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowHint(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardStatusUpdate = async (status) => {
    if (!flashcardSet || !flashcardSet.cards[currentIndex]) return;
    const card = flashcardSet.cards[currentIndex];

    try {
      const res = await api.patch(`/flashcards/${flashcardSet.id}/card/${card.id}`, { status });
      if (res.data.success) {
        setFlashcardSet(res.data.flashcardSet);
        showSuccess(status === 'mastered' ? 'Marked as Mastered! 🎉' : 'Marked for Review 💡');
        
        // Auto advance to next card if not at end
        if (currentIndex < flashcardSet.cards.length - 1) {
          handleNext();
        }
      }
    } catch (err) {
      showError('Failed to update card status.');
    }
  };

  const handleNext = () => {
    if (currentIndex < (flashcardSet?.cards?.length || 1) - 1) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    if (!flashcardSet || !flashcardSet.cards) return;
    const shuffled = [...flashcardSet.cards].sort(() => Math.random() - 0.5);
    setFlashcardSet({ ...flashcardSet, cards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    showSuccess('Cards shuffled!');
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 text-xs">Loading flashcards...</div>;
  }

  if (!flashcardSet || !flashcardSet.cards || flashcardSet.cards.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800 max-w-lg mx-auto">
        <Layers className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-base font-bold text-white">No Flashcards Generated</h2>
        <p className="text-xs text-slate-400">Upload study materials to auto-generate active recall cards.</p>
        <button
          onClick={() => navigate('/materials')}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
        >
          Go to Materials
        </button>
      </div>
    );
  }

  const cards = flashcardSet.cards;
  const currentCard = cards[currentIndex];
  const masteredCount = cards.filter((c) => c.status === 'mastered').length;
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{flashcardSet.title || 'Flashcards'}</h1>
            <p className="text-[11px] text-slate-400">
              Card {currentIndex + 1} of {cards.length} • {masteredCount} Mastered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Shuffle Deck"
          >
            <Shuffle className="w-3.5 h-3.5 text-brand-400" />
            Shuffle
          </button>

          {documents.length > 1 && (
            <select
              value={flashcardSet.docId}
              onChange={(e) => {
                navigate(`/flashcards/${e.target.value}`);
                fetchCardsForDoc(e.target.value);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.originalName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Deck Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Deck Progress</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-brand-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] cursor-pointer select-none"
      >
        <div
          className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Front (Question Side) */}
          <div className="absolute inset-0 w-full h-full glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col justify-between backface-hidden shadow-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/30 text-brand-300">
                Question
              </span>
              {currentCard.status === 'mastered' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                </span>
              )}
            </div>

            <div className="my-auto py-6 text-center space-y-4">
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentCard.question}
              </p>
              {showHint && currentCard.hint && (
                <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl animate-fade-in max-w-md mx-auto">
                  💡 Hint: {currentCard.hint}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
              {currentCard.hint ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="hover:text-amber-300 transition-colors flex items-center gap-1 font-semibold text-[11px]"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              ) : (
                <span />
              )}
              <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-400">
                <RotateCw className="w-3.5 h-3.5" /> Click or Space to reveal answer
              </span>
            </div>
          </div>

          {/* Card Back (Answer Side) */}
          <div className="absolute inset-0 w-full h-full glass-panel p-8 rounded-3xl border border-emerald-500/30 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Answer & Explanation
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Card #{currentIndex + 1}</span>
            </div>

            <div className="my-auto py-6 text-center space-y-3">
              <p className="text-sm sm:text-base font-semibold text-emerald-200 leading-relaxed">
                {currentCard.answer}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardStatusUpdate('review');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <AlertCircle className="w-4 h-4" /> Need Review
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardStatusUpdate('mastered');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Got It Mastered!
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <span className="text-xs font-bold text-slate-400">
          {currentIndex + 1} / {cards.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="px-4 py-2.5 rounded-xl bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
