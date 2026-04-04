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

const passthroughLimiter = (req, res, next) => next();
const isProduction = process.env.NODE_ENV === 'production';

const createAiLimiter = (defaultMax, message) => {
  if (!isProduction) {
    return passthroughLimiter;
  }

  const max = Number(process.env.AI_RATE_LIMIT_MAX || defaultMax);
  return rateLimit({
    windowMs: 60 * 1000,
    max: Number.isFinite(max) && max > 0 ? max : defaultMax,
    message
  });
};

// In production, keep throttling enabled to protect AI endpoints.
const summarizeLimiter = createAiLimiter(
  3,
  'Too many summary requests from this IP, please try again after a minute.'
);

const analyzeLimiter = createAiLimiter(
  3,
  'Too many analysis requests from this IP, please try again after a minute.'
);

router.post('/upload', upload.single('file'), uploadDocument);

// Route to get all documents (before :id to avoid matching :id)
router.get('/', getAllDocuments);

// Route to analyze a document (rate limited)
router.post('/analyze/:id', analyzeLimiter, analyzeDocument);

// Route to summarize a document (rate limited)
router.post('/summarize/:id', summarizeLimiter, summarizeDocument);

// Route to get a single document by ID (must be after specific routes)
router.get('/:id', getDocumentById);

// Route to delete a document
router.delete('/:id', deleteDocument);

module.exports = router;
