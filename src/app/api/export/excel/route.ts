import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { getAccessContext } from '@/lib/access-control';

// API: /api/export/excel
export async function GET() {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!access.isAdmin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    return new Promise<Response>((resolve) => {
      const scriptPath = path.resolve(process.cwd(), 'scripts/exportar_jangadas_certificados_excel.ts');
      exec(`npx ts-node ${scriptPath}`, (error, stdout) => {
        if (error) {
          resolve(NextResponse.json({ error: "Erro ao exportar dados." }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ success: true, message: stdout }));
        }
      });
    });
  } catch {
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
