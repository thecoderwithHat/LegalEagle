// services/textExtractionService.js
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

exports.extractTextFromFile = async (filePath, originalname) => {
  try {
    if (!filePath || !originalname) {
      throw new Error('Invalid file path or original file name');
    }

    const ext = originalname.split('.').pop().toLowerCase();
    
    if (ext === 'pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        
        if (!pdfData.text || pdfData.text.trim().length === 0) {
          console.warn('PDF parsing succeeded but no text was extracted');
          return '[PDF content could not be extracted. Document may be image-based or encrypted.]';
        }
        
        return pdfData.text;
      } catch (pdfErr) {
        console.error('PDF parsing error:', pdfErr.message);
        // Detailed debugging for common PDF issues
        if (pdfErr.message.includes('bad XRef') || pdfErr.message.includes('FormatError')) {
          throw new Error(`Invalid or corrupted PDF file: ${pdfErr.message}`);
        }
        throw new Error(`PDF parsing failed: ${pdfErr.message}`);
      }
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (ext === 'txt') {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      throw new Error('Unsupported file type. Supported types: PDF, DOCX, TXT');
    }
  } catch (err) {
    console.error('Error extracting text from file:', err);
    throw new Error(`Text extraction failed: ${err.message}`);
  }
};
