const db = require('../config/db');

// FLASHCARDS CONTROLLER
const getFlashcards = async (req, res) => {
  try {
    const { docId } = req.params;
    let flashcardSet;
    if (docId) {
      flashcardSet = db.findOne('flashcards', f => f.docId === docId && f.userId === req.user.id);
    } else {
      const allSets = db.find('flashcards', f => f.userId === req.user.id);
      return res.json({ success: true, flashcardSets: allSets });
    }

    if (!flashcardSet) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found.' });
    }

    return res.json({ success: true, flashcardSet });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching flashcards.', error: error.message });
  }
};

const updateFlashcardStatus = async (req, res) => {
  try {
    const { setId, cardId } = req.params;
    const { status } = req.body; // 'mastered', 'review', 'unseen'

    const set = db.findById('flashcards', setId);
    if (!set || set.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found or access denied.' });
    }

    const cards = set.cards || [];
    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ success: false, message: 'Card not found in set.' });
    }

    cards[cardIndex].status = status;
    const updatedSet = db.update('flashcards', setId, { cards });

    return res.json({ success: true, flashcardSet: updatedSet });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update card status.', error: error.message });
  }
};

// QUIZ CONTROLLER
const getQuizzes = async (req, res) => {
  try {
    const { docId } = req.params;
    if (docId) {
      const quiz = db.findOne('quizzes', q => q.docId === docId && q.userId === req.user.id);
      if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
      return res.json({ success: true, quiz });
    }

    const allQuizzes = db.find('quizzes', q => q.userId === req.user.id);
    return res.json({ success: true, quizzes: allQuizzes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching quizzes.', error: error.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedIndex }

    const quiz = db.findById('quizzes', quizId);
    if (!quiz || quiz.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers array is required.' });
    }

    let correctCount = 0;
    const detailedResults = quiz.questions.map(q => {
      const userAns = answers.find(a => a.questionId === q.id);
      const selectedIndex = userAns ? userAns.selectedIndex : null;
      const isCorrect = selectedIndex === q.correctAnswerIndex;

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        selectedIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePercentage >= (quiz.passingScore || 70);

    const newAttempt = {
      attemptId: `att_${Date.now()}`,
      takenAt: new Date().toISOString(),
      scorePercentage,
      correctCount,
      totalQuestions: quiz.questions.length,
      passed,
      answers: detailedResults
    };

    const updatedHistory = [...(quiz.scoreHistory || []), newAttempt];
    const updatedQuiz = db.update('quizzes', quizId, { scoreHistory: updatedHistory });

    return res.json({
      success: true,
      message: passed ? 'Congratulations! You passed the quiz!' : 'Quiz submitted. Keep practicing to improve!',
      result: newAttempt,
      quiz: updatedQuiz
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error submitting quiz.', error: error.message });
  }
};

// STUDY PLAN CONTROLLER
const getStudyPlans = async (req, res) => {
  try {
    const { docId } = req.params;
    if (docId) {
      const plan = db.findOne('study_plans', sp => sp.docId === docId && sp.userId === req.user.id);
      if (!plan) return res.status(404).json({ success: false, message: 'Study plan not found.' });
      return res.json({ success: true, studyPlan: plan });
    }

    const allPlans = db.find('study_plans', sp => sp.userId === req.user.id);
    return res.json({ success: true, studyPlans: allPlans });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching study plans.', error: error.message });
  }
};

const toggleStudyTask = async (req, res) => {
  try {
    const { planId, taskId } = req.params;
    const plan = db.findById('study_plans', planId);

    if (!plan || plan.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Study plan not found.' });
    }

    const schedule = plan.schedule || [];
    let updated = false;

    schedule.forEach(dayItem => {
      if (dayItem.tasks) {
        dayItem.tasks.forEach(task => {
          if (task.id === taskId) {
            task.completed = !task.completed;
            updated = true;
          }
        });
      }
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Task ID not found in plan.' });
    }

    const updatedPlan = db.update('study_plans', planId, { schedule });

    return res.json({
      success: true,
      message: 'Task progress updated.',
      studyPlan: updatedPlan
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update study task.', error: error.message });
  }
};

module.exports = {
  getFlashcards,
  updateFlashcardStatus,
  getQuizzes,
  submitQuiz,
  getStudyPlans,
  toggleStudyTask
};
