import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
const archiver = require('archiver');

// Root directory for backups (same as used in the page component)
const BACKUP_ROOT = path.resolve(process.cwd(), 'backups');

export async function GET(request: Request, { params }: { params: { folder: string } }) {
  const { folder } = params;
  const folderPath = path.join(BACKUP_ROOT, folder);

  // Validate folder existence
  if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
    return NextResponse.json({ error: 'Backup folder not found' }, { status: 404 });
  }

  // Create a zip archive in memory
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = archive;

  // Catch archiver errors
  archive.on('error', (err) => {
    console.error('Archive error:', err);
  });

  // Append all files in the backup folder
  archive.directory(folderPath, false);
  await archive.finalize();

  // Return a streamed response
  const response = new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${folder}.zip"`,
    },
  });
  return response;
}
