import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Root directory for backups (same as used in the page component)
const BACKUP_ROOT = path.resolve(process.cwd(), 'backups');

export async function POST(request: Request) {
  try {
    // Expect multipart/form-data with fields: 'folder' and 'file'
    const form = await request.formData();
    const folder = form.get('folder') as string | null;
    const file = form.get('file') as File | null;

    if (!folder || !file) {
      return NextResponse.json({ error: 'Missing folder or file' }, { status: 400 });
    }

    // Ensure the target folder exists (create if missing)
    const targetDir = path.join(BACKUP_ROOT, folder);
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Write the uploaded file to the target directory
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(targetDir, file.name);
    await fs.promises.writeFile(filePath, buffer);

    // If the uploaded file is a ZIP archive, extract its contents
    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const unzipStream = fs.createReadStream(filePath).pipe(require('unzipper').Extract({ path: targetDir }));
        await new Promise((resolve, reject) => {
          unzipStream.on('close', resolve);
          unzipStream.on('error', reject);
        });
        // Optionally delete the zip file after extraction
        await fs.promises.unlink(filePath);
        return NextResponse.json({ message: `ZIP extracted to ${folder}` }, { status: 200 });
      } catch (unzipErr) {
        console.error('Unzip error:', unzipErr);
        return NextResponse.json({ error: 'Failed to extract ZIP file' }, { status: 500 });
      }
    }

    // Non‑ZIP file uploaded
    return NextResponse.json({ message: `File uploaded to ${folder}` }, { status: 200 });
  } catch (error) {
    console.error('Backup import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
