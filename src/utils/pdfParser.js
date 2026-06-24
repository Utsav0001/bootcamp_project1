/**
 * Client-side file parsing utilities for PDF, DOCX, and TXT files
 */

// CDN links
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
const MAMMOTH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

/**
 * Load external script dynamically
 */
function loadScript(url, globalVarName) {
  return new Promise((resolve, reject) => {
    if (window[globalVarName]) {
      resolve(window[globalVarName]);
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve(window[globalVarName]);
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

/**
 * Parse a PDF file and return its text content
 */
async function parsePdf(file) {
  // Load pdfjs-dist
  const pdfjsLib = await loadScript(PDFJS_CDN, 'pdfjsLib');
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * Parse a DOCX file and return its plain text content using Mammoth.js
 */
async function parseDocx(file) {
  const mammoth = await loadScript(MAMMOTH_CDN, 'mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value; // Plain text
}

/**
 * Main function to extract text from file based on extension
 */
export async function extractTextFromFile(file) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return await parsePdf(file);
  } else if (fileName.endsWith('.docx')) {
    return await parseDocx(file);
  } else if (fileName.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read TXT file'));
      reader.readAsText(file);
    });
  } else {
    throw new Error('Unsupported file format. Please upload .pdf, .docx, or .txt, or paste the text directly.');
  }
}
