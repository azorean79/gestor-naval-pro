import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAuditoria } from "@/lib/auditoria";
import { isValidNif, normalizePhone } from "@/lib/validators";
import { deriveClienteAddressFields } from "@/lib/client-address";
import { normalizeClienteIslandValue } from "@/lib/azores-islands";

async function syncClienteIslandToNavios(clienteId: number, ilha: string | null) {
  if (!ilha) return;
  await prisma.navio.updateMany({
    where: { clienteId },
    data: { ilha },
  });
}

function sanitizeClientePayload(data: any) {
  const hasMorada = Object.prototype.hasOwnProperty.call(data || {}, "morada");
  const hasMoradaNumero = Object.prototype.hasOwnProperty.call(data || {}, "moradaNumero");
  const hasCodigoPostal = Object.prototype.hasOwnProperty.call(data || {}, "codigoPostal");
  const hasLocalidade = Object.prototype.hasOwnProperty.call(data || {}, "localidade");
  const address = hasMorada || hasMoradaNumero || hasCodigoPostal || hasLocalidade
    ? deriveClienteAddressFields({
        morada: data?.morada,
        moradaNumero: data?.moradaNumero,
        codigoPostal: data?.codigoPostal,
        localidade: data?.localidade,
      })
    : null;

  return {
    nome: typeof data?.nome === "string" ? data.nome.trim() : undefined,
    numeroCliente: typeof data?.numeroCliente === "string" ? data.numeroCliente.trim() || null : undefined,
    modoPagamento: typeof data?.modoPagamento === "string" ? data.modoPagamento.trim() || null : undefined,
    ilha: (
      Object.prototype.hasOwnProperty.call(data || {}, "ilha")
      || address
    )
      ? normalizeClienteIslandValue({
          ilha: data?.ilha,
          morada: address ? address.morada : data?.morada,
          localidade: address ? address.localidade : data?.localidade,
          codigoPostal: address ? address.codigoPostal : data?.codigoPostal,
        })
      : undefined,
    morada: address ? address.morada : undefined,
    moradaNumero: address ? address.moradaNumero : undefined,
    codigoPostal: address ? address.codigoPostal : undefined,
    localidade: address ? address.localidade : undefined,
    nif: typeof data?.nif === "string" ? data.nif.trim() || null : undefined,
    email: typeof data?.email === "string" ? data.email.trim() || null : undefined,
    telefone: Object.prototype.hasOwnProperty.call(data || {}, "telefone") ? normalizePhone(data?.telefone) : undefined,
    telmovel: Object.prototype.hasOwnProperty.call(data || {}, "telmovel") ? normalizePhone(data?.telmovel) : undefined,
  };
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { navios: true },
  });

  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido no corpo da requisição." }, { status: 400 });
  }

  const data = sanitizeClientePayload(body);
  if (data.nif && !isValidNif(data.nif)) {
    return NextResponse.json({ error: "NIF inválido. Deve ter 9 dígitos." }, { status: 400 });
  }

  Object.keys(data).forEach((key) => {
    if ((data as any)[key] === undefined) {
      delete (data as any)[key];
    }
  });

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sem dados para atualizar." }, { status: 400 });
  }

  try {
    const antes = await prisma.cliente.findUnique({ where: { id } });

    const cliente = await prisma.cliente.update({
      where: { id },
      data,
    });

    await syncClienteIslandToNavios(cliente.id, cliente.ilha);

    await logAuditoria({
      tabela: "Cliente",
      tipoOperacao: "UPDATE",
      idRegisto: id,
      descricao: `Atualização do cliente ${cliente.nome}`,
      dadosAntes: antes,
      dadosDepois: cliente,
    });

    return NextResponse.json(cliente);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao atualizar cliente." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const antes = await prisma.cliente.findUnique({ where: { id } });
    await prisma.cliente.delete({ where: { id } });

    if (antes) {
      await logAuditoria({
        tabela: "Cliente",
        tipoOperacao: "DELETE",
        idRegisto: id,
        descricao: `Exclusão do cliente ${antes.nome}`,
        dadosAntes: antes,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao excluir cliente." }, { status: 500 });
  }
}
