const fs = require('fs');
const db = require('../config/firebase'); // Import Firestore database instance
const { extractTextFromFile } = require('../services/textExtractionService');
const { classifyDocumentType, extractHighlights } = require('../services/analysisService');
const { summarizeDocumentText } = require('../services/openaiService');

const documentsCollection = db.collection('documents');

// Upload a document, extract text, and save to Firestore
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalname = req.file.originalname;

    // Extract text from the uploaded file
    const text = await extractTextFromFile(filePath, originalname);

    // Document data to be saved in Firestore
    const documentData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path, // Still storing path for potential temporary access or deletion
      text: text,
      createdAt: new Date().toISOString()
    };
    
    // Add a new document to the 'documents' collection in Firestore
    const docRef = await documentsCollection.add(documentData);

    res.json({ 
      message: 'Document uploaded successfully', 
      document: { id: docRef.id, ...documentData } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Analyze a document by its ID
exports.analyzeDocument = async (req, res) => {
  try {
    const docRef = documentsCollection.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // --- Caching: Return cached analysis if available ---
    if (documentData.type && documentData.highlights) {
      return res.json({ type: documentData.type, highlights: documentData.highlights, text: documentData.text });
    }

    const type = classifyDocumentType(documentData.text);
    const highlights = extractHighlights(documentData.text);

    // Update the document in Firestore with analysis results
    await docRef.update({ 
      type: type, 
      highlights: highlights 
    });

    res.json({ type, highlights, text: documentData.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Summarize a document by its ID
exports.summarizeDocument = async (req, res) => {
  try {
    const docRef = documentsCollection.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const documentData = doc.data();

    // --- Caching: Return cached summary if available ---
    if (documentData.summary) {
      return res.json({ summary: documentData.summary });
    }

    // Always use single-chunk summarization
    const summary = await summarizeDocumentText(documentData.text);

    // Update the document in Firestore with the summary
    await docRef.update({ summary: summary });

    res.json({ summary });
  } catch (err) {
    console.error('Error summarizing document:', err.message);
    res.status(500).json({ error: 'Failed to summarize document. Please try again later.' });
  }
};

// Get all documents from Firestore
exports.getAllDocuments = async (req, res) => {
  try {
    const snapshot = await documentsCollection.orderBy('createdAt', 'desc').get();
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a document from Firestore and its associated file
exports.deleteDocument = async (req, res) => {
  try {
    const docRef = documentsCollection.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();
    const filePath = documentData.path;

    // Delete the physical file if the path exists
    if (filePath) {
      try {
        await fs.promises.unlink(filePath);
      } catch (fileErr) {
        if (fileErr.code !== 'ENOENT') {
          console.error('Error deleting file:', fileErr.message);
          // Don't block deletion from DB if file is already gone
        }
      }
    }

    // Delete the document from Firestore
    await docRef.delete();
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err.message);
    res.status(500).json({ error: 'Failed to delete document. Please try again later.' });
  }
};
