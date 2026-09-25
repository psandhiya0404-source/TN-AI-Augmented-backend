const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getFlashcards,
  updateFlashcardStatus,
  getQuizzes,
  submitQuiz,
  getStudyPlans,
  toggleStudyTask
} = require('../controllers/studyAssetsController');

// Flashcard routes
router.get('/flashcards', authMiddleware, getFlashcards);
router.get('/flashcards/:docId', authMiddleware, getFlashcards);
router.patch('/flashcards/:setId/card/:cardId', authMiddleware, updateFlashcardStatus);

// Quiz routes
router.get('/quizzes', authMiddleware, getQuizzes);
router.get('/quizzes/:docId', authMiddleware, getQuizzes);
router.post('/quizzes/:quizId/submit', authMiddleware, submitQuiz);

// Study Plan routes
router.get('/study-plans', authMiddleware, getStudyPlans);
router.get('/study-plans/:docId', authMiddleware, getStudyPlans);
router.patch('/study-plans/:planId/task/:taskId', authMiddleware, toggleStudyTask);

module.exports = router;
