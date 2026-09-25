const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extracts raw text content from uploaded files (.pdf, .txt, .md)
 */
async function extractTextFromFile(filePath, fileType) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found on server filesystem');
  }

  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      let text = data.text ? data.text.trim() : '';

      if (!text || text.length === 0) {
        throw new Error('No readable text extracted from PDF. It may be scanned images or password protected.');
      }

      // Clean up whitespace
      text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
      return {
        text,
        numPages: data.numpages || 1,
        info: data.info || {}
      };
    } else if (ext === '.txt' || ext === '.md' || ext === '.markdown') {
      const text = fs.readFileSync(filePath, 'utf-8').trim();
      if (!text) {
        throw new Error('Uploaded document is empty.');
      }
      return {
        text,
        numPages: 1,
        info: {}
      };
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

module.exports = {
  extractTextFromFile
};
