import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { ordemId } = await request.json();

    if (!ordemId) {
      return NextResponse.json({ error: 'ID da ordem é obrigatório' }, { status: 400 });
    }

    const ordem = await prisma.ordemServico.findUnique({
      where: { id: ordemId },
      include: {
        navio: true,
        cliente: true,
      },
    });

    if (!ordem) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 });
    }

    // Gerar HTML do certificado
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Certificado de Inspeção - ${ordem.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #003366; }
            .title { font-size: 18px; margin: 10px 0; }
            .content { margin: 20px 0; }
            .info { margin: 10px 0; }
            .signature { margin-top: 50px; text-align: center; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">MARINE SAFE</div>
            <div class="title">CERTIFICADO DE INSPEÇÃO E MANUTENÇÃO</div>
          </div>

          <div class="content">
            <div class="info"><strong>Número da Ordem:</strong> ${ordem.numero}</div>
            <div class="info"><strong>Cliente:</strong> ${ordem.clienteNome}</div>
            <div class="info"><strong>Embarcação:</strong> ${ordem.navioNome}</div>
            <div class="info"><strong>Tipo de Serviço:</strong> ${ordem.tipoServico}</div>
            <div class="info"><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-PT')}</div>
            <div class="info"><strong>Data de Validade:</strong> ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT')}</div>
          </div>

          <div class="content">
            <h3>Resultado da Inspeção</h3>
            <p>A embarcação acima mencionada foi submetida a inspeção completa conforme as normas vigentes e encontra-se em condições de navegação.</p>

            <h4>Trabalhos Realizados:</h4>
            <ul>
              ${ordem.etapas && Array.isArray(ordem.etapas) ? (ordem.etapas as Array<{nome: string; status: string}>).map((etapa) => `<li>${etapa.nome} - ${etapa.status === 'concluida' ? 'Concluído' : 'Em andamento'}</li>`).join('') : ''}
            </ul>
          </div>

          <div class="signature">
            <p>_______________________________</p>
            <p>Técnico Responsável</p>
            <p>${ordem.tecnicoResponsavel || 'Técnico Marine Safe'}</p>
          </div>

          <div class="footer">
            <p>Este certificado é válido por 1 ano a partir da data de emissão.</p>
            <p>Marine Safe - Gestão Naval e Segurança Marítima</p>
          </div>
        </body>
      </html>
    `;

    // Gerar PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    await browser.close();

    // Retornar PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-${ordem.numero}.pdf"`
      }
    });

  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}