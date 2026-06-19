import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import bwipjs from 'bwip-js';

type LabelRequest = {
  code: string;
  widthMm?: number; // optional width in mm for each label
  heightMm?: number; // optional height in mm
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LabelRequest[];
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'Array of label data required' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    let x = 20; // start margin
    let y = height - 20; // top margin
    const margin = 10;

    for (const label of body) {
      // generate barcode PNG buffer
      const pngBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: label.code,
        scale: 3,
        includetext: true,
        textxalign: 'center',
      });

      const pngImage = await pdfDoc.embedPng(pngBuffer);
      const imgWidth = label.widthMm ? (label.widthMm / 25.4) * 72 : pngImage.width;
      const imgHeight = label.heightMm ? (label.heightMm / 25.4) * 72 : pngImage.height;

      // move to next line if not enough space horizontally
      if (x + imgWidth > width - 20) {
        x = 20;
        y -= imgHeight + margin;
      }
      // move to next page if vertical overflow
      if (y - imgHeight < 20) {
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - 20;
        page = newPage; // eslint-disable-line no-param-reassign
      }

      page.drawImage(pngImage, {
        x,
        y: y - imgHeight,
        width: imgWidth,
        height: imgHeight,
      });

      x += imgWidth + margin;
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="etiquetas.pdf"',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to generate batch PDF' }, { status: 500 });
  }
}
