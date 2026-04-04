const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const rateLimit = require('express-rate-limit');

const {
  uploadDocument,
  analyzeDocument,
  summarizeDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument
} = require('../controllers/documentController');

// Rate limiter: max 3 requests per minute per IP for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: 'Too many AI requests from this IP, please try again after a minute.'
});

router.post('/upload', upload.single('file'), uploadDocument);

// Route to get all documents (before :id to avoid matching :id)
router.get('/', getAllDocuments);

// Route to analyze a document (rate limited)
router.post('/analyze/:id', aiLimiter, analyzeDocument);

// Route to summarize a document (rate limited)
router.post('/summarize/:id', aiLimiter, summarizeDocument);

// Route to get a single document by ID (must be after specific routes)
router.get('/:id', getDocumentById);

// Route to delete a document
router.delete('/:id', deleteDocument);

module.exports = router;
