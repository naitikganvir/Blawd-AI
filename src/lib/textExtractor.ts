import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function extractTextFromImage(file: File): Promise<string> {
  // Convert image to base64 and use the book-ai edge function for OCR via AI
  const base64 = await fileToBase64(file);
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/book-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      action: 'ocr',
      imageBase64: base64,
      mimeType: file.type,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to extract text from image');
  }

  const data = await response.json();
  return data.text || '';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractText(file: File): Promise<string> {
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }

  if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
    return readTextFile(file);
  }

  if (type.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
    return extractTextFromImage(file);
  }

  throw new Error('Unsupported file type. Please upload a PDF, text file, or image.');
}
