import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

// API: /api/export/pdf
export async function GET() {
  return new Promise<Response>((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts/exportar_jangadas_certificados_pdf.ts');
    exec(`npx ts-node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ error: stderr || error.message }, { status: 500 }));
      } else {
        // O script deve gerar o ficheiro na raiz/output
        resolve(NextResponse.json({ success: true, message: stdout }));
      }
    });
  });
}
