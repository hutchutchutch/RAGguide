import { getDocument, PDFDocumentProxy, GlobalWorkerOptions } from 'pdfjs-dist';

// Set up worker
GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.320/build/pdf.worker.min.js`;

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string[]> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    // Extract text from each page
    const pages: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Join all the text items from the page
      const pageText = textContent.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
      
      pages.push(pageText);
    }
    
    return pages;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Preprocess the text according to a cleanup strategy
 */
export function cleanText(text: string, strategy: 'simple' | 'advanced' | 'ocr-optimized'): string {
  switch (strategy) {
    case 'simple':
      // Basic cleaning: remove extra whitespace
      return text
        .replace(/\s+/g, ' ')
        .trim();
      
    case 'advanced':
      // Advanced cleaning: fix common PDF issues
      return text
        .replace(/\s+/g, ' ')           // Remove extra whitespace
        .replace(/-\s+/g, '')           // Fix hyphenated words
        .replace(/\f/g, ' ')            // Replace form feeds
        .replace(/[^\x00-\x7F]/g, ' ')  // Remove non-ASCII characters
        .trim();
      
    case 'ocr-optimized':
      // OCR-optimized: handle common OCR errors
      return text
        .replace(/\s+/g, ' ')              // Remove extra whitespace
        .replace(/(\w)- (\w)/g, '$1$2')    // Fix hyphenated words
        .replace(/\f/g, ' ')               // Replace form feeds
        .replace(/[^\x20-\x7E]/g, ' ')     // Keep only printable ASCII
        .replace(/([.,!?:;])(\w)/g, '$1 $2')  // Add space after punctuation if missing
        .trim();
      
    default:
      return text;
  }
}

/**
 * Split text into chunks with a given size and overlap
 */
export function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  if (!text) return [];
  
  // Convert to words array
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  // Calculate step size (accounting for overlap)
  const step = chunkSize - overlap;
  
  // Create chunks
  for (let i = 0; i < words.length; i += step) {
    const chunkWords = words.slice(i, i + chunkSize);
    if (chunkWords.length > 0) {
      chunks.push(chunkWords.join(' '));
    }
    
    // If the remaining text is shorter than the overlap, we're done
    if (i + chunkSize >= words.length) break;
  }
  
  return chunks;
}

/**
 * Recursively split text into semantic chunks
 */
export function recursiveTextSplitter(
  text: string, 
  chunkSize: number, 
  overlap: number
): string[] {
  // First split by paragraphs
  const paragraphs = text.split(/\n{2,}/);
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph keeps us under the chunk size, add it
    if (currentChunk.length + paragraph.length <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      // If current chunk is not empty, save it
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // If paragraph is longer than chunk size, split it further
      if (paragraph.length > chunkSize) {
        // Split by sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        
        currentChunk = '';
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= chunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            
            // If sentence is longer than chunk size, split it by words
            if (sentence.length > chunkSize) {
              const sentenceChunks = splitIntoChunks(sentence, chunkSize, overlap);
              chunks.push(...sentenceChunks);
              currentChunk = '';
            } else {
              currentChunk = sentence;
            }
          }
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}
