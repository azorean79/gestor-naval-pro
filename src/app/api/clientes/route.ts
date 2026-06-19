import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAuditoria } from "@/lib/auditoria";
import { isValidNif, normalizePhone } from "@/lib/validators";
import { deriveClienteAddressFields } from "@/lib/client-address";
import { getAccessContext } from "@/lib/access-control";
import { normalizeClienteIslandValue } from "@/lib/azores-islands";

async function syncClienteIslandToNavios(clienteId: number, ilha: string | null) {
  if (!ilha) return;
  await prisma.navio.updateMany({
    where: { clienteId },
    data: { ilha },
  });
}

function sanitizeClientePayload(data: any) {
  const address = deriveClienteAddressFields({
    morada: data?.morada,
    moradaNumero: data?.moradaNumero,
    codigoPostal: data?.codigoPostal,
    localidade: data?.localidade,
  });

  return {
    nome: data?.nome?.trim(),
    numeroCliente: data?.numeroCliente?.trim() || null,
    modoPagamento: data?.modoPagamento?.trim() || null,
    ilha: normalizeClienteIslandValue({
      ilha: data?.ilha,
      morada: address.morada,
      localidade: address.localidade,
      codigoPostal: address.codigoPostal,
    }),
    morada: address.morada,
    moradaNumero: address.moradaNumero,
    codigoPostal: address.codigoPostal,
    localidade: address.localidade,
    nif: data?.nif?.trim() || null,
    email: data?.email?.trim() || null,
    telefone: normalizePhone(data?.telefone),
    telmovel: normalizePhone(data?.telmovel),
  };
}

// DELETE em lote: recebe { ids: number[] }
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    // Exclusão individual via querystring: /api/clientes?id=123
    if (idParam) {
      const id = Number(idParam);
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: "ID inválido." }, { status: 400 });
      }

      await prisma.cliente.delete({ where: { id } });
      await logAuditoria({
        tabela: "Cliente",
        tipoOperacao: "DELETE",
        idRegisto: id,
        descricao: `Exclusão do cliente ID ${id}`,
      });
      return NextResponse.json({ success: true });
    }

    // Exclusão em lote via body: { ids: number[] }
    const rawBody = await req.text();
    const parsedBody = rawBody ? JSON.parse(rawBody) : {};
    const ids = Array.isArray(parsedBody?.ids) ? parsedBody.ids : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Envie um ID (?id=) ou um array de IDs para exclusão em lote." }, { status: 400 });
    }

    const existentes = await prisma.cliente.findMany({ where: { id: { in: ids } } });
    await prisma.cliente.deleteMany({ where: { id: { in: ids } } });
    await Promise.all(
      existentes.map((item) =>
        logAuditoria({
          tabela: "Cliente",
          tipoOperacao: "DELETE",
          idRegisto: item.id,
          descricao: `Exclusão em lote do cliente ${item.nome}`,
          dadosAntes: item,
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao excluir clientes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const body = await req.json();
    const data = sanitizeClientePayload(body);
      if (data.nome) {
        const existingCliente = await prisma.cliente.findFirst({ where: { nome: data.nome } });
        if (existingCliente) return NextResponse.json({ error: "J� existe um cliente com esse nome registado." }, { status: 400 });
      }
      if (data.nome) {
        const existingCliente = await prisma.cliente.findFirst({ where: { nome: data.nome } });
        if (existingCliente) return NextResponse.json({ error: "J� existe um cliente com esse nome registado." }, { status: 400 });
      }

    if (!data.nome || !data.nome.trim()) {
      return NextResponse.json({ error: "Nome do cliente é obrigatório." }, { status: 400 });
    }

    if (data.nif && !isValidNif(data.nif)) {
      return NextResponse.json({ error: "NIF inválido. Deve ter 9 dígitos." }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        numeroCliente: data.numeroCliente,
        modoPagamento: data.modoPagamento,
        ilha: data.ilha,
        morada: data.morada,
        moradaNumero: data.moradaNumero,
        codigoPostal: data.codigoPostal,
        localidade: data.localidade,
        nif: data.nif,
        email: data.email,
        telefone: data.telefone,
        telmovel: data.telmovel,
      },
    });

    await logAuditoria({
      tabela: "Cliente",
      tipoOperacao: "CREATE",
      idRegisto: cliente.id,
      descricao: `Criação do cliente ${cliente.nome}`,
      dadosDepois: cliente,
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao criar cliente." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "JSON inválido no corpo da requisição." }, { status: 400 });
    }

    const data = sanitizeClientePayload(body);
    if (data.nif && !isValidNif(data.nif)) {
      return NextResponse.json({ error: "NIF inválido. Deve ter 9 dígitos." }, { status: 400 });
    }

    Object.keys(data).forEach((key) => {
      if ((data as Record<string, unknown>)[key] === undefined) {
        delete (data as Record<string, unknown>)[key];
      }
    });

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sem dados para atualizar." }, { status: 400 });
    }

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

export async function GET(req: NextRequest) {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const where: any = {};

  if (searchParams.get("nome")) where.nome = { contains: searchParams.get("nome"), mode: "insensitive" };
  if (searchParams.get("numeroCliente")) where.numeroCliente = { contains: searchParams.get("numeroCliente"), mode: "insensitive" };
  if (searchParams.get("nif")) where.nif = { contains: searchParams.get("nif"), mode: "insensitive" };
  if (searchParams.get("ilha")) where.ilha = { contains: searchParams.get("ilha"), mode: "insensitive" };
  if (searchParams.get("email")) where.email = { contains: searchParams.get("email"), mode: "insensitive" };
  if (searchParams.get("telefone")) where.telefone = { contains: searchParams.get("telefone"), mode: "insensitive" };
  if (searchParams.get("telmovel")) where.telmovel = { contains: searchParams.get("telmovel"), mode: "insensitive" };
  if (searchParams.get("missingContacts") === "true") {
    where.OR = [
      { email: null },
      { telefone: null },
      { telmovel: null },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    include: {
      navios: {
        select: {
          id: true,
          nome: true,
          matricula: true,
          ilha: true,
          tipoPesca: true,
        },
      },
    },
  });

  return NextResponse.json(clientes);
}
