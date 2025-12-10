
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { DocumentMetadata, FileRegistry, BundleFolder } from '../types';

// Helper to wrap text for PDF rendering
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const wrappedLines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      wrappedLines.push(''); 
      continue;
    }
    
    const words = paragraph.split(/\s+/);
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width < maxWidth) {
        currentLine = testLine;
      } else {
        wrappedLines.push(currentLine);
        currentLine = word;
      }
    }
    wrappedLines.push(currentLine);
  }
  return wrappedLines;
}

// NEW: Validate and sanitize PDF to prevent Gemini 400 errors
// Uses "Deep Copy" strategy to reconstruct the PDF structure, with a fallback to "Simple Save"
export const validateAndSanitizePdf = async (file: File): Promise<Uint8Array | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Load document to check validity, ignore encryption if possible
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    // Check page count
    if (srcDoc.getPageCount() === 0) {
        console.warn("PDF has 0 pages");
        return null;
    }
    
    // Strategy 1: DEEP SANITIZATION (Best quality)
    // Create a fresh document and copy pages. This strips out corrupt cross-reference tables and metadata.
    // This is crucial for "Print to PDF" files which often have structural errors that Gemini rejects.
    try {
        const newDoc = await PDFDocument.create();
        const indices = srcDoc.getPageIndices();
        const copiedPages = await newDoc.copyPages(srcDoc, indices);
        copiedPages.forEach(page => newDoc.addPage(page));
        return await newDoc.save();
    } catch (deepCopyError) {
        console.warn("Deep sanitization failed, attempting simple re-save...", deepCopyError);
        
        // Strategy 2: SIMPLE SANITIZATION (Fallback)
        // Just saving the loaded document re-writes the XRef table, fixing many structural issues
        // without attempting the complex object copying of Strategy 1.
        return await srcDoc.save();
    }
  } catch (e) {
    console.warn("PDF Validation Failed:", e);
    return null;
  }
};

export const generateMergedBundle = async (
  files: FileRegistry, 
  documents: DocumentMetadata[], 
  caseName: string,
  onProgress: (msg: string) => void,
  folders?: BundleFolder[]
): Promise<Uint8Array | null> => {
  try {
    onProgress("Initializing PDF Engine (2-Pass Mode)...");
    
    const contentPdf = await PDFDocument.create();
    const helveticaContent = await contentPdf.embedFont(StandardFonts.Helvetica);
    const helveticaBoldContent = await contentPdf.embedFont(StandardFonts.HelveticaBold);
    
    const indexEntries: {
        type: 'header' | 'doc';
        name: string;
        pageCount: number;
        date: string;
        ref?: string;
    }[] = [];

    // --- STRATEGY SELECTION: FOLDERS vs CHRONOLOGICAL ---
    let processQueue: { docId: string; section?: string }[] = [];

    if (folders && folders.length > 0) {
        // Folder-based ordering
        folders.forEach(folder => {
            // Add a marker for section start
            processQueue.push({ docId: `SECTION_HEADER::${folder.name}`, section: folder.name });
            folder.docIds.forEach(docId => {
                processQueue.push({ docId, section: folder.name });
            });
        });
    } else {
        // Chronological ordering
        const sortedDocs = documents.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
        sortedDocs.forEach(doc => processQueue.push({ docId: doc.id }));
    }

    // --- PASS 1: Process Content ---
    for (const item of processQueue) {
        
        // Handle Section Headers
        if (item.docId.startsWith('SECTION_HEADER::')) {
            const sectionTitle = item.docId.split('::')[1];
            const page = contentPdf.addPage();
            const { width, height } = page.getSize();
            
            page.drawText(sectionTitle.toUpperCase(), {
                x: 50,
                y: height / 2,
                size: 24,
                font: helveticaBoldContent,
                color: rgb(0, 0, 0),
            });
            
            indexEntries.push({
                type: 'header',
                name: sectionTitle,
                pageCount: 1,
                date: ''
            });
            continue;
        }

        const doc = documents.find(d => d.id === item.docId);
        const file = files[item.docId];
        
        if (!doc || !file) {
            console.warn(`File missing for ${item.docId}`);
            continue;
        }

        onProgress(`Processing: ${doc.fileName}...`);
        const startPageCount = contentPdf.getPageCount();

        try {
            if (file.type === 'application/pdf') {
                // Sanitize PDF content before merging if needed, though we assume file is valid here.
                // Using copyPages handles structural issues well.
                const fileBuffer = await file.arrayBuffer();
                const srcPdf = await PDFDocument.load(fileBuffer);
                const copiedPages = await contentPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                copiedPages.forEach((page) => contentPdf.addPage(page));
            } else if (file.type.startsWith('image/')) {
                const imgBuffer = await file.arrayBuffer();
                let image;
                if (file.type === 'image/png') image = await contentPdf.embedPng(imgBuffer);
                else if (file.type === 'image/jpeg') image = await contentPdf.embedJpg(imgBuffer);
                
                if (image) {
                    const page = contentPdf.addPage();
                    const { width, height } = page.getSize();
                    const imgDims = image.scaleToFit(width - 100, height - 100);
                    page.drawImage(image, {
                        x: 50,
                        y: height - imgDims.height - 50,
                        width: imgDims.width,
                        height: imgDims.height,
                    });
                }
            } else {
                // Text/Docx
                const content = doc.textContent || "(No text content extracted or file is audio)";
                const fontSize = 10;
                const lineHeight = 12;
                const margin = 50;
                
                let page = contentPdf.addPage();
                let { width, height } = page.getSize();
                const maxWidth = width - (margin * 2);
                
                page.drawText(`Document: ${doc.fileName}`, { x: margin, y: height - margin, size: 14, font: helveticaBoldContent });
                let y = height - margin - 30;

                const lines = wrapText(content, helveticaContent, fontSize, maxWidth);

                for (const line of lines) {
                    if (y < 50) {
                        page = contentPdf.addPage();
                        y = height - 50;
                    }
                    page.drawText(line, { x: margin, y: y, size: fontSize, font: helveticaContent });
                    y -= lineHeight;
                }
            }
        } catch (e) {
            console.error(`Error processing ${doc.fileName}`, e);
            const errPage = contentPdf.addPage();
            errPage.drawText(`Error loading file: ${doc.fileName}`, { x: 50, y: 700, size: 12 });
        }

        const endPageCount = contentPdf.getPageCount();
        const docPages = endPageCount - startPageCount;
        if (docPages === 0) contentPdf.addPage(); // Ensure at least 1 page placeholder
        
        indexEntries.push({ 
            type: 'doc',
            name: doc.fileName, 
            pageCount: Math.max(docPages, 1),
            date: new Date(doc.uploadedAt).toLocaleDateString()
        });
    }

    // --- PASS 2: Assemble Final PDF ---
    onProgress("Assembling Master Bundle...");
    const finalPdf = await PDFDocument.create();
    const finalBold = await finalPdf.embedFont(StandardFonts.HelveticaBold);
    const finalRegular = await finalPdf.embedFont(StandardFonts.Helvetica);

    // 1. Cover Page
    const coverPage = finalPdf.addPage();
    const { width, height } = coverPage.getSize();
    
    coverPage.drawText('EMPLOYMENT TRIBUNAL BUNDLE', { x: 50, y: height - 150, size: 24, font: finalBold });
    coverPage.drawText(`Case: ${caseName}`, { x: 50, y: height - 200, size: 18, font: finalRegular });
    coverPage.drawText(`Generated: ${new Date().toLocaleDateString()}`, { x: 50, y: height - 230, size: 12, font: finalRegular, color: rgb(0.4, 0.4, 0.4) });

    // 2. Calculate Index Pages
    const linesPerPage = Math.floor((height - 150) / 20); 
    const totalIndexEntries = indexEntries.length;
    const requiredIndexPages = Math.ceil(totalIndexEntries / linesPerPage) || 1;
    
    let currentContentPage = 1 + requiredIndexPages + 1; 

    // 3. Generate Index Pages
    onProgress("Generating Dynamic Index...");
    
    let indexPage = finalPdf.addPage();
    let indexY = height - 80;
    indexPage.drawText('INDEX OF DOCUMENTS', { x: 50, y: indexY, size: 18, font: finalBold });
    indexY -= 40;
    
    let entriesOnCurrentPage = 0;

    for (let i = 0; i < indexEntries.length; i++) {
        const entry = indexEntries[i];
        
        if (entriesOnCurrentPage >= linesPerPage) {
            indexPage = finalPdf.addPage();
            indexY = height - 50;
            entriesOnCurrentPage = 0;
        }
        
        if (entry.type === 'header') {
            indexY -= 10; // Extra spacing
            indexPage.drawText(entry.name.toUpperCase(), { x: 50, y: indexY, size: 11, font: finalBold });
        } else {
            const pageNum = `p.${currentContentPage}`;
            const desc = entry.name.length > 60 ? entry.name.substring(0, 60) + "..." : entry.name;
            
            indexPage.drawText(pageNum, { x: 50, y: indexY, size: 10, font: finalRegular });
            indexPage.drawText(desc, { x: 100, y: indexY, size: 10, font: finalRegular });
            indexPage.drawText(entry.date, { x: 450, y: indexY, size: 10, font: finalRegular });
        }
        
        indexY -= 20;
        entriesOnCurrentPage++;
        currentContentPage += entry.pageCount;
    }
    
    // 4. Merge Content
    onProgress("Merging Evidence...");
    const contentIndices = contentPdf.getPageIndices();
    if (contentIndices.length > 0) {
        const copiedPages = await finalPdf.copyPages(contentPdf, contentIndices);
        copiedPages.forEach(page => finalPdf.addPage(page));
    }

    // 5. Bates Stamping
    onProgress("Applying Bates Stamp...");
    const pages = finalPdf.getPages();
    const totalPages = pages.length;
    
    pages.forEach((page, idx) => {
        const { width } = page.getSize();
        page.drawText(`Page ${idx + 1} of ${totalPages}`, {
            x: width - 100,
            y: 20,
            size: 10,
            font: finalRegular,
            color: rgb(0, 0, 0),
        });
    });

    const pdfBytes = await finalPdf.save();
    return pdfBytes;

  } catch (e) {
    console.error("Bundle generation failed", e);
    return null;
  }
};
