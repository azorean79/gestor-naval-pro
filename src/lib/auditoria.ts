import prisma from "@/lib/prisma";

type LogAuditoriaInput = {
  tabela: string;
  tipoOperacao: "CREATE" | "UPDATE" | "DELETE";
  idRegisto: number;
  descricao?: string;
  usuario?: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
};

export async function logAuditoria(input: LogAuditoriaInput) {
  try {
    await prisma.auditoria.create({
      data: {
        tabela: input.tabela,
        tipoOperacao: input.tipoOperacao,
        idRegisto: input.idRegisto,
        descricao: input.descricao,
        usuario: input.usuario || "sistema",
        dadosAntes: input.dadosAntes ? JSON.stringify(input.dadosAntes) : null,
        dadosDepois: input.dadosDepois ? JSON.stringify(input.dadosDepois) : null,
      },
    });
  } catch (error) {
    console.warn("Falha ao registar auditoria:", error);
  }
}
