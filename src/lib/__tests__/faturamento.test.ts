import { calcularTotaisOrdem, resumoFatura, FaturamentoError } from "@/lib/faturamento";
import { getIvaRate } from "@/lib/iva";

jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("@/lib/ordens-servico", () => ({
  appendOrdemServicoLog: jest.fn(),
  appendWorkflowTransition: jest.fn(),
  ensureClienteNumero: jest.fn(),
  generateNumeroFatura: jest.fn(),
  generateNumeroNotaCredito: jest.fn(),
  generateNumeroRecibo: jest.fn(),
  parseOrdemServicoMeta: jest.fn(),
  toOrdemServicoMetaJson: jest.fn(),
}));
jest.mock("@/lib/auditoria", () => ({ logAuditoria: jest.fn() }));

type ResumoFaturaInput = Parameters<typeof resumoFatura>[0];

describe("calcularTotaisOrdem", () => {
  const rate = getIvaRate();
  const base = { valorPecas: 0, valorMaoObra: 0, valorDesconto: 0, isIsentoIva: false };

  test("soma peças e mão de obra e aplica IVA", () => {
    const r = calcularTotaisOrdem({ ...base, valorPecas: 100, valorMaoObra: 50 });
    expect(r.subtotal).toBe(150);
    expect(r.iva).toBeCloseTo(150 * rate, 10);
    expect(r.total).toBeCloseTo(Math.round((150 + 150 * rate) * 100) / 100, 10);
  });

  test("desconto é deduzido ao subtotal", () => {
    const r = calcularTotaisOrdem({ ...base, valorPecas: 100, valorMaoObra: 50, valorDesconto: 30 });
    expect(r.subtotal).toBe(120);
    expect(r.iva).toBeCloseTo(120 * rate, 10);
    expect(r.total).toBeCloseTo(Math.round((120 + 120 * rate) * 100) / 100, 10);
  });

  test("ordem isenta de IVA tem iva zero", () => {
    const r = calcularTotaisOrdem({ ...base, valorPecas: 100, valorMaoObra: 50, isIsentoIva: true });
    expect(r.iva).toBe(0);
    expect(r.total).toBe(150);
  });

  test("desconto superior ao valor não gera subtotal negativo", () => {
    const r = calcularTotaisOrdem({ ...base, valorPecas: 100, valorDesconto: 200 });
    expect(r.subtotal).toBe(0);
    expect(r.iva).toBe(0);
    expect(r.total).toBe(0);
  });

  test("a soma é limitada a zero quando é negativa", () => {
    const r = calcularTotaisOrdem({ ...base, valorPecas: -5, valorMaoObra: 10 });
    expect(r.subtotal).toBe(5);
    expect(calcularTotaisOrdem({ ...base, valorPecas: -20, valorMaoObra: 10 }).subtotal).toBe(0);
  });

  test("arredonda total a 2 casas decimais", () => {
    const r = calcularTotaisOrdem({ ...base, valorPecas: 10.333, valorMaoObra: 20.667 });
    expect(r.subtotal).toBeCloseTo(31, 10);
    expect(r.total).toBeCloseTo(Math.round((31 + 31 * rate) * 100) / 100, 10);
  });
});

function makeOrdem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    numeroOrdem: "OT-2026-0001",
    numeroCliente: "C-0001",
    status: "concluida",
    clienteId: 1,
    shipId: 2,
    isIsentoIva: false,
    valorPecas: 100,
    valorMaoObra: 50,
    valorDesconto: 0,
    metadados: null,
    dataAbertura: new Date("2026-07-01T09:00:00.000Z"),
    dataConclusao: new Date("2026-07-15T17:00:00.000Z"),
    createdAt: new Date("2026-07-01T08:00:00.000Z"),
    cliente: { nome: "Cliente A", numeroCliente: "C-0001", nif: "999999990", morada: "Rua X", localidade: "Ponta Delgada", ilha: "São Miguel" },
    jangada: { serial: "SER-1", brand: "Zodiac", model: "MK3", owner: "Dono A", shipNameManual: "Navio Atlântico" },
    serviceStation: { codigo: "SMI", nome: "Estação São Miguel" },
    tecnico: { nome: "Técnico Silva" },
    ...overrides,
  };
}

function makeFatura(faturaOverrides: Record<string, unknown> = {}, order = makeOrdem()): ResumoFaturaInput {
  return {
    fatura: {
      id: 10,
      numeroFatura: "FAT-2026-0001",
      valorSubtotal: 150,
      valorIva: 24,
      valorTotal: 174,
      isIsentoIva: false,
      pagamentoStatus: "Pendente",
      dataEmissao: new Date("2026-07-15T18:00:00.000Z"),
      cancelada: false,
      emitidaPor: "user@test",
      metadados: null,
      notaCredito: null,
      recibos: [],
      cliente: order.cliente,
      ordemServicos: [{ ordemServico: order }],
      ...faturaOverrides,
    },
  } as unknown as ResumoFaturaInput;
}

describe("resumoFatura", () => {
  test("resume os dados principais da fatura e da ordem", () => {
    const r = resumoFatura(makeFatura());
    expect(r.numeroFatura).toBe("FAT-2026-0001");
    expect(r.clienteNome).toBe("Cliente A");
    expect(r.navio).toBe("Navio Atlântico");
    expect(r.jangadaLabel).toBe("Zodiac MK3");
    expect(r.issuer).toBe("Estação São Miguel");
    expect(r.tecnico).toBe("Técnico Silva");
    expect(r.subtotal).toBe(150);
    expect(r.iva).toBe(24);
    expect(r.total).toBe(174);
    expect(r.isentoIva).toBe(false);
    expect(r.pagamentoStatus).toBe("Pendente");
    expect(r.numeroNotaCredito).toBeNull();
    expect(r.numeroRecibo).toBeNull();
    expect(r.dataTrabalho).toEqual(new Date("2026-07-15T17:00:00.000Z"));
  });

  test("sem fatura devolve valores por omissão", () => {
    const r = resumoFatura(null as unknown as ResumoFaturaInput);
    expect(r.clienteNome).toBe("Cliente particular");
    expect(r.numeroFatura).toBe("FAT-S/N");
    expect(r.navio).toBe("—");
    expect(r.jangadaLabel).toBe("—");
    expect(r.issuer).toBe("Orey Técnica - Serviços Navais");
    expect(r.subtotal).toBe(0);
    expect(r.iva).toBe(0);
    expect(r.total).toBe(0);
    expect(r.pagamentoStatus).toBe("Pendente");
    expect(r.dataTrabalho).toBeNull();
    expect(r.tecnico).toBeNull();
    expect(r.emissao).toBeInstanceOf(Date);
  });

  test("usa o dono da jangada como nome do cliente quando não há cliente", () => {
    const r = resumoFatura(makeFatura({ cliente: null }, makeOrdem({ cliente: null })));
    expect(r.clienteNome).toBe("Dono A");
  });

  test("dá fallback para 'Cliente particular' sem cliente nem dono", () => {
    const r = resumoFatura(makeFatura({ cliente: null }, makeOrdem({ cliente: null, jangada: { ...makeOrdem().jangada, owner: "" } })));
    expect(r.clienteNome).toBe("Cliente particular");
  });

  test("usa o número da ordem quando não há número de fatura", () => {
    const r = resumoFatura(makeFatura({ numeroFatura: null }));
    expect(r.numeroFatura).toBe("OT-2026-0001");
  });

  test("expõe nota de crédito e recibo quando existem", () => {
    const r = resumoFatura(
      makeFatura({
        notaCredito: { numeroNotaCredito: "NC-2026-0001", valorTotal: 174, dataEmissao: new Date("2026-07-20T10:00:00.000Z") },
        recibos: [{ numeroRecibo: "REC-2026-0001", valorPago: 174, pagamentoStatus: "Pago", dataEmissao: new Date("2026-07-18T10:00:00.000Z") }],
      }),
    );
    expect(r.numeroNotaCredito).toBe("NC-2026-0001");
    expect(r.numeroRecibo).toBe("REC-2026-0001");
  });

  test("reflete fatura isenta de IVA e sem marca/modelo", () => {
    const r = resumoFatura(
      makeFatura({ isIsentoIva: true }, makeOrdem({ isIsentoIva: true, jangada: { ...makeOrdem().jangada, brand: "", model: "" } })),
    );
    expect(r.isentoIva).toBe(true);
    expect(r.jangadaLabel).toBe("—");
  });

  test("expõe codigoIsencaoIva da fatura quando disponível", () => {
    const r = resumoFatura(
      makeFatura({ isIsentoIva: true, codigoIsencaoIva: "M02" }, makeOrdem({ isIsentoIva: true })),
    );
    expect(r.codigoIsencaoIva).toBe("M02");
  });

  test("fallback para codigoIsencaoIva da ordem quando fatura não tem", () => {
    const r = resumoFatura(
      makeFatura({ isIsentoIva: true, codigoIsencaoIva: null }, makeOrdem({ isIsentoIva: true, codigoIsencaoIva: "M07" })),
    );
    expect(r.codigoIsencaoIva).toBe("M07");
  });

  test("codigoIsencaoIva é null quando não isento", () => {
    const r = resumoFatura(makeFatura());
    expect(r.codigoIsencaoIva).toBeNull();
  });

  test("usa a primeira ordem como primária em faturas agrupadas", () => {
    const first = makeOrdem();
    const second = makeOrdem({ id: 2, numeroOrdem: "OT-2026-0002" });
    const r = resumoFatura(makeFatura({ ordemServicos: [{ ordemServico: first }, { ordemServico: second }] }));
    expect(r.ordens).toHaveLength(2);
    expect(r.primary?.id).toBe(1);
    expect(r.numeroFatura).toBe("FAT-2026-0001");
  });
});

describe("FaturamentoError", () => {
  test("usa status 400 por omissão", () => {
    const err = new FaturamentoError("Erro de teste");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("FaturamentoError");
    expect(err.status).toBe(400);
    expect(err.message).toBe("Erro de teste");
  });

  test("aceita status personalizado", () => {
    const err = new FaturamentoError("Não encontrado", 404);
    expect(err.status).toBe(404);
  });
});
