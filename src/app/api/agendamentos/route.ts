import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Substituir por consulta real ao banco de dados
  const { searchParams } = new URL(req.url);
  const delegacao = searchParams.get('delegacao');
  // Exemplo de resposta filtrada
  return NextResponse.json({ data: [], delegacao });
}
