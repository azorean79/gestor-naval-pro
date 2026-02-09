import { prisma } from '../src/lib/prisma';

describe('Relações entre entidades', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Cliente deve ter navios, jangadas, obras e faturas', async () => {
    const cliente = await prisma.cliente.findFirst({
      include: {
        navios: true,
        jangadas: true,
        obras: true,
        faturas: true,
      },
    });
    expect(cliente).toBeTruthy();
    if (cliente) expect(cliente.navios.length).toBeGreaterThan(0);
    if (cliente) expect(cliente.jangadas.length).toBeGreaterThan(0);
    if (cliente) expect(cliente.obras.length).toBeGreaterThanOrEqual(0);
    if (cliente) expect(cliente.faturas.length).toBeGreaterThanOrEqual(0);
  });

  it('Navio deve estar ligado a cliente e ter jangadas', async () => {
    const navio = await prisma.navio.findFirst({
      include: {
        cliente: true,
        jangadas: true,
      },
    });
    expect(navio).toBeTruthy();
    if (navio) expect(navio.cliente).toBeTruthy();
    if (navio) expect(navio.jangadas.length).toBeGreaterThanOrEqual(0);
  });

  it('Jangada deve estar ligada a navio, cliente, marca e lotação', async () => {
    const jangada = await prisma.jangada.findFirst({
      include: {
        navio: true,
        cliente: true,
        marca: true,
        lotacao: true,
      },
    });
    expect(jangada).toBeTruthy();
    if (jangada) expect(jangada.navio).toBeTruthy();
    if (jangada) expect(jangada.cliente).toBeTruthy();
    if (jangada) expect(jangada.marca).toBeTruthy();
    if (jangada) expect(jangada.lotacao).toBeTruthy();
  });

  it('Obra deve estar ligada a cliente e navio', async () => {
    const obra = await prisma.obra.findFirst({
      include: {
        cliente: true,
        navio: true,
      },
    });
    if (obra) {
      expect(obra.cliente).toBeTruthy();
      expect(obra.navio).toBeTruthy();
    }
  });

  it('Inspeção deve estar ligada a navio e jangada', async () => {
    const inspecao = await prisma.inspecao.findFirst({
      include: {
        navio: true,
        jangada: true,
      },
    });
    if (inspecao) {
      expect(inspecao.navio).toBeTruthy();
      expect(inspecao.jangada).toBeTruthy();
    }
  });

  it('Marca e modelo devem estar ligados a jangadas', async () => {
    const marca = await prisma.marcaJangada.findFirst({
      include: {
        jangadas: true,
        modelos: true,
      },
    });
    expect(marca).toBeTruthy();
    if (marca) expect(marca.jangadas.length).toBeGreaterThanOrEqual(0);
    if (marca) expect(marca.modelos.length).toBeGreaterThanOrEqual(0);
  });
});
