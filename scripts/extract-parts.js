const fs = require('fs');
const path = require('path');
const util = require('util');

(async function extract() {
  let pdfModule = null;
  try {
    pdfModule = require('pdf-parse');
  } catch (err) {
    // ignore, will try dynamic import
  }

  if (!pdfModule) {
    try {
      pdfModule = await import('pdf-parse');
    } catch (err) {
      // ignore, will try direct paths below
    }
  }

  // Try direct CJS entry if module still unresolved
  if (!pdfModule) {
    try {
      pdfModule = require('pdf-parse/dist/pdf-parse/cjs/index.cjs');
    } catch (err) {
      try {
        pdfModule = require('pdf-parse/dist/node/cjs/index.cjs');
      } catch (err2) {
        // last resort: dynamic import of ESM build
        try {
          pdfModule = await import('pdf-parse/dist/pdf-parse/esm/index.js');
        } catch (err3) {
          console.error('Unable to load pdf-parse via require or dynamic import.', err3);
          process.exit(1);
        }
      }
    }
  }

  const pdfPath = path.join(process.cwd(), 'manuais', 'Service Manual for Marine MK IV.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found at', pdfPath);
    process.exit(1);
  }

  const dataBuffer = fs.readFileSync(pdfPath);

  async function parseBuffer(buffer) {
    const mod = pdfModule;
    if (typeof mod === 'function') {
      return await mod(buffer);
    }

    if (mod && typeof mod.default === 'function') {
      return await mod.default(buffer);
    }

    const PDFParseClass = (mod && mod.PDFParse) || (mod && mod.default && mod.default.PDFParse) || null;
    if (PDFParseClass) {
      const parser = new PDFParseClass({ data: buffer });
      const txtRes = await parser.getText();
      return { text: txtRes.text || '', pages: txtRes.pages || [] };
    }

    console.error('Unsupported pdf-parse module shape; cannot parse buffer.');
    try { console.error('pdfModule inspect:', util.inspect(mod, { showHidden: true, depth: 2 })); } catch (e) { /* ignore */ }
    process.exit(1);
  }

  const data = await parseBuffer(dataBuffer);
  const text = data.text || '';

  console.log('Extracted text length:', text.length);

  const parts = {};

  const partRegexes = [
    /Part\s*No\.?\s*[:\-\s]*([A-Z0-9\-\/\._]+)/gi,
    /P\/?N\.?\s*[:\-\s]*([A-Z0-9\-\/\._]+)/gi,
    /PN\s*[:\-\s]*([A-Z0-9\-\/\._]+)/gi,
    /Part\s*Number\s*[:\-\s]*([A-Z0-9\-\/\._]+)/gi,
    /Ref\.?\s*[:\-\s]*([A-Z0-9\-\/\._]+)/gi,
    /Item\s*No\.?\s*[:\-\s]*([A-Z0-9\-\/\._]+)/gi
  ];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rx of partRegexes) {
      let m;
      while ((m = rx.exec(line)) !== null) {
        const pn = m[1].trim();
        const context = lines.slice(Math.max(0, i-2), Math.min(lines.length, i+3)).join(' | ');
        if (!parts[pn]) parts[pn] = { partNumber: pn, occurrences: [] };
        parts[pn].occurrences.push({ line: line, context });
      }
      rx.lastIndex = 0;
    }

    if (/\b(part|spare|ref|item)\b/i.test(line)) {
      const pnMatches = line.match(/([A-Z]{1,4}[-\/]?\d{2,6}[A-Z0-9\-\/]*)/g);
      if (pnMatches) {
        for (const pn of pnMatches) {
          const clean = pn.trim();
          if (!parts[clean]) parts[clean] = { partNumber: clean, occurrences: [] };
          parts[clean].occurrences.push({ line: line, context: lines.slice(Math.max(0, i-2), Math.min(lines.length, i+3)).join(' | ') });
        }
      }
    }
  }

  const outPath = path.join(process.cwd(), 'manuais', 'parts-extracted.json');
  fs.writeFileSync(outPath, JSON.stringify({ extractedAt: new Date().toISOString(), parts }, null, 2), 'utf8');
  console.log('Wrote', outPath, 'with', Object.keys(parts).length, 'unique part candidates');

})().catch(err => {
  console.error('Extraction error:', err);
  process.exit(2);
});
