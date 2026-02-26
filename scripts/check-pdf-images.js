const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-parse');
const PDFParse = pdfLib.PDFParse || (pdfLib.default && pdfLib.default.PDFParse);
(async()=>{
  const pdfPath = path.join(process.cwd(), 'manuais', 'Service Manual for Marine MK IV.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const textRes = await parser.getText();
  console.log('pages text count', (textRes.pages||[]).length);
  try{
    const imgRes = await parser.getImage({ imageBuffer: true, imageDataUrl: false });
    console.log('img pages', (imgRes.pages||[]).length);
    if ((imgRes.pages||[]).length>0) console.log('sample page images', imgRes.pages[0].images.length);
  }catch(e){
    console.error('getImage error', e);
  }
})();