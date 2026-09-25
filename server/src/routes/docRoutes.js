const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadDocument, getAllDocuments, getDocumentById, deleteDocument } = require('../controllers/docController');

router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.get('/', authMiddleware, getAllDocuments);
router.get('/:id', authMiddleware, getDocumentById);
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;
