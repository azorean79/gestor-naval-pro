import { prisma } from '../src/lib/prisma';

async function filtrarRelacionarComponentes() {
  // Buscar componentes do estoque
  const componentes = await prisma.componenteStock.findMany();

  // Buscar certificados e inspeções
  const certificados = await prisma.certificado.findMany({ include: { componentes: true } });
  const inspecoes = await prisma.inspecao.findMany({ include: { componentes: true } });

  const relacoes: any[] = [];

  for (const componente of componentes) {
    // Filtrar por part number, nome ou referência
    const matchesCertificados = certificados.filter(cert =>
      cert.componentes.some(c =>
        c.partNumber && componente.descricao.includes(c.partNumber)
      )
    );
    const matchesInspecoes = inspecoes.filter(inspec =>
      inspec.componentes.some(c =>
        c.partNumber && componente.descricao.includes(c.partNumber)
      )
    );
    relacoes.push({
      componente: componente.descricao,
      arquivo: componente.arquivo,
      certificados: matchesCertificados.map(c => c.id),
      inspecoes: matchesInspecoes.map(i => i.id)
    });
  }

  require('fs').writeFileSync('relacoes-componentes-certificados-inspecoes.json', JSON.stringify(relacoes, null, 2), 'utf-8');
  console.log('Relações filtradas e salvas em relacoes-componentes-certificados-inspecoes.json');
}

filtrarRelacionarComponentes().catch(console.error);
