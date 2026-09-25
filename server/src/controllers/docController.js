const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { extractTextFromFile } = require('../services/pdfService');
const { generateSummary, generateFlashcards, generateQuiz, generateStudyPlan } = require('../services/aiService');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please choose a valid PDF, TXT, or MD file.'
      });
    }

    const { originalname, filename, path: filePath, size } = req.file;
    const fileType = path.extname(originalname).toLowerCase();
    const userId = req.user.id;

    // Extract Text
    let extractionResult;
    try {
      extractionResult = await extractTextFromFile(filePath, fileType);
    } catch (extractError) {
      // Clean up uploaded file if extraction fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(422).json({
        success: false,
        message: `Failed to extract text from file: ${extractError.message}`
      });
    }

    const extractedText = extractionResult.text;
    const wordCount = extractedText.split(/\s+/).length;

    // Generate AI Study Assets
    const summary = await generateSummary(extractedText, originalname);
    const rawFlashcards = await generateFlashcards(extractedText, originalname);
    const rawQuiz = await generateQuiz(extractedText, originalname);
    const rawStudyPlan = await generateStudyPlan(extractedText, originalname, 7, req.user.dailyTargetHours || 2);

    // Save document to DB
    const newDoc = db.insert('documents', {
      userId,
      originalName: originalname,
      filename,
      filePath,
      fileType,
      fileSize: size,
      extractedText,
      wordCount,
      pageCount: extractionResult.numPages || 1,
      summary
    });

    // Save Associated Flashcards Set
    const flashcardSet = db.insert('flashcards', {
      userId,
      docId: newDoc.id,
      docName: originalname,
      title: `Flashcards: ${originalname}`,
      cards: rawFlashcards
    });

    // Save Associated Quiz Set
    const quizSet = db.insert('quizzes', {
      userId,
      docId: newDoc.id,
      docName: originalname,
      title: rawQuiz.title,
      questions: rawQuiz.questions,
      passingScore: rawQuiz.passingScore,
      scoreHistory: []
    });

    // Save Associated Study Plan
    const studyPlanSet = db.insert('study_plans', {
      userId,
      docId: newDoc.id,
      docName: originalname,
      title: rawStudyPlan.title,
      targetDays: rawStudyPlan.targetDays,
      dailyHours: rawStudyPlan.dailyHours,
      totalEstimatedHours: rawStudyPlan.totalEstimatedHours,
      schedule: rawStudyPlan.schedule
    });

    // Update document record with references
    db.update('documents', newDoc.id, {
      flashcardSetId: flashcardSet.id,
      quizSetId: quizSet.id,
      studyPlanSetId: studyPlanSet.id
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully!',
      document: {
        ...newDoc,
        flashcardSetId: flashcardSet.id,
        quizSetId: quizSet.id,
        studyPlanSetId: studyPlanSet.id
      },
      summary,
      flashcardSet,
      quizSet,
      studyPlanSet
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: 'Server error processing document upload.',
      error: error.message
    });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const docs = db.find('documents', d => d.userId === req.user.id);
    const sanitizedDocs = docs.map(d => ({
      id: d.id,
      originalName: d.originalName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      wordCount: d.wordCount,
      pageCount: d.pageCount,
      createdAt: d.createdAt,
      flashcardSetId: d.flashcardSetId,
      quizSetId: d.quizSetId,
      studyPlanSetId: d.studyPlanSetId,
      summaryPreview: d.summary?.executiveSummary?.slice(0, 150) + '...'
    }));

    return res.json({
      success: true,
      documents: sanitizedDocs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.',
      error: error.message
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = db.findById('documents', id);

    if (!doc || doc.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied.'
      });
    }

    const flashcards = db.findOne('flashcards', f => f.docId === id);
    const quiz = db.findOne('quizzes', q => q.docId === id);
    const studyPlan = db.findOne('study_plans', sp => sp.docId === id);

    return res.json({
      success: true,
      document: doc,
      flashcards,
      quiz,
      studyPlan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch document details.',
      error: error.message
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = db.findById('documents', id);

    if (!doc || doc.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or unauthorized.'
      });
    }

    // Delete physical file from filesystem
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (fsErr) {
        console.warn('Could not delete physical file:', fsErr.message);
      }
    }

    // Delete associated items in DB
    db.deleteWhere('flashcards', f => f.docId === id);
    db.deleteWhere('quizzes', q => q.docId === id);
    db.deleteWhere('study_plans', sp => sp.docId === id);
    db.delete('documents', id);

    return res.json({
      success: true,
      message: `Document "${doc.originalName}" and all associated study materials were deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document.',
      error: error.message
    });
  }
};

module.exports = {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument
};
