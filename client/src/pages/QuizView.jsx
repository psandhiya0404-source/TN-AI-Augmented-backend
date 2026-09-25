import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function QuizView() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { refreshProfile } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: selectedIndex }
  const [submittedResult, setSubmittedResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentsAndQuiz();
  }, [docId]);

  const fetchDocumentsAndQuiz = async () => {
    try {
      const docsRes = await api.get('/documents');
      if (docsRes.data.success && docsRes.data.documents.length > 0) {
        setDocuments(docsRes.data.documents);
        const targetDocId = docId || docsRes.data.documents[0].id;
        fetchQuizForDoc(targetDocId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchQuizForDoc = async (targetDocId) => {
    setLoading(true);
    try {
      const res = await api.get(`/quizzes/${targetDocId}`);
      if (res.data.success) {
        setQuiz(res.data.quiz);
        setSelectedAnswers({});
        setSubmittedResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, index) => {
    if (submittedResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: index
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < quiz.questions.length) {
      showError(`Please answer all ${quiz.questions.length} questions before submitting.`);
      return;
    }

    const payloadAnswers = quiz.questions.map((q) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id]
    }));

    setIsSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${quiz.id}/submit`, { answers: payloadAnswers });
      if (res.data.success) {
        setSubmittedResult(res.data.result);
        setQuiz(res.data.quiz);
        showSuccess(res.data.message);
        await refreshProfile();

        // Trigger confetti celebration on passing score (70%+)
        if (res.data.result.scorePercentage >= 70) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswers({});
    setSubmittedResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500 text-xs">Loading practice quiz...</div>;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-800 max-w-lg mx-auto">
        <HelpCircle className="w-12 h-12 text-purple-400 mx-auto" />
        <h2 className="text-base font-bold text-white">No Quiz Available</h2>
        <p className="text-xs text-slate-400">Upload study materials to auto-generate multiple-choice practice quizzes.</p>
        <button
          onClick={() => navigate('/materials')}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
        >
          Go to Materials
        </button>
      </div>
    );
  }

  const questions = quiz.questions;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{quiz.title || 'Practice Quiz'}</h1>
            <p className="text-[11px] text-slate-400">
              {questions.length} Questions • Passing score: {quiz.passingScore || 70}%
            </p>
          </div>
        </div>

        {documents.length > 1 && (
          <select
            value={quiz.docId}
            onChange={(e) => {
              navigate(`/quiz/${e.target.value}`);
              fetchQuizForDoc(e.target.value);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.originalName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Quiz Score Summary Banner (When Submitted) */}
      {submittedResult && (
        <div className={`glass-panel p-6 rounded-3xl border space-y-4 animate-fade-in ${
          submittedResult.passed
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : 'bg-rose-950/40 border-rose-500/40'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl ${
                submittedResult.passed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {submittedResult.scorePercentage}%
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {submittedResult.passed ? 'Great Job! Quiz Passed 🎉' : 'Keep Practicing! 💪'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  You answered {submittedResult.correctCount} out of {submittedResult.totalQuestions} questions correctly.
                </p>
              </div>
            </div>

            <button
              onClick={handleTryAgain}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all self-start sm:self-auto"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const resultItem = submittedResult?.answers?.find((a) => a.questionId === q.id);
          const userSelectedIndex = selectedAnswers[q.id];

          return (
            <div
              key={q.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-slate-300">
                  Question {qIndex + 1} of {questions.length}
                </span>
                {resultItem && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    resultItem.isCorrect
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {resultItem.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {resultItem.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-white leading-relaxed">{q.questionText}</p>

              {/* Options Grid */}
              <div className="space-y-2">
                {q.options.map((opt, optIndex) => {
                  const isSelected = userSelectedIndex === optIndex;
                  let optionStyle = 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700';

                  if (submittedResult) {
                    if (optIndex === q.correctAnswerIndex) {
                      optionStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isSelected && !resultItem?.isCorrect) {
                      optionStyle = 'bg-rose-950/70 border-rose-500 text-rose-200 line-through';
                    } else {
                      optionStyle = 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-purple-500/20 border-purple-500 text-purple-200 font-semibold';
                  }

                  return (
                    <button
                      key={optIndex}
                      type="button"
                      disabled={!!submittedResult}
                      onClick={() => handleOptionSelect(q.id, optIndex)}
                      className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && !submittedResult && <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (After submission) */}
              {submittedResult && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-purple-300 block">💡 Explanation:</span>
                  <p className="leading-relaxed text-slate-400">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit / Retry Actions Bar */}
      {!submittedResult ? (
        <div className="sticky bottom-6 glass-panel p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between shadow-2xl bg-slate-900/90 backdrop-blur-md">
          <span className="text-xs text-slate-300 font-medium">
            Answered {answeredCount} of {questions.length} questions
          </span>
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting || answeredCount < questions.length}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
          >
            {isSubmitting ? 'Grading Answers...' : 'Submit & Grade Quiz'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleTryAgain}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
          >
            <RotateCcw className="w-4 h-4" /> Try Quiz Again
          </button>
        </div>
      )}
    </div>
  );
}
