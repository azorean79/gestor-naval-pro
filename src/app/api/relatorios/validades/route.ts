import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getAccessContext } from "@/lib/access-control";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const daysParam = searchParams.get("periodo") || "90"; // periodo em dias
    
    let dateLimit: Date | null = null;
    if (daysParam !== "all") {
      const days = parseInt(daysParam, 10);
      if (!isNaN(days)) {
        dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() + days);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar artigos da base de dados
    const queryWhere: Prisma.ArtigoJangadaWhereInput = {
      validade: {
        not: null,
      },
    };

    if (dateLimit) {
      queryWhere.validade = {
        gte: today,
        lte: dateLimit,
      };
    } else {
      // Se for "all", buscar todos os que expiram a partir de hoje
      queryWhere.validade = {
        gte: today,
      };
    }

    const artigos = await prisma.artigoJangada.findMany({
      where: queryWhere,
      include: {
        Jangada: {
          select: {
            serial: true,
            brand: true,
            model: true,
            capacity: true,
            shipNameManual: true,
            owner: true,
          },
        },
        inspecao: {
          select: {
            certificadoNumero: true,
            dataInspecao: true,
          },
        },
      },
      orderBy: {
        validade: "asc",
      },
    });

    const nowIso = today.toISOString().slice(0, 10);
    const limitIso = dateLimit ? dateLimit.toISOString().slice(0, 10) : null;
    const inWindow = { gte: nowIso, ...(limitIso ? { lte: limitIso } : {}) };

    const extintoresExpiring = await prisma.extintor.findMany({
      where: { OR: [{ dataProxRecarga: inWindow }, { dataProxTesteHidraulico: inWindow }] },
      select: { id: true, serial: true, marca: true, modelo: true, tipoAgente: true, dataProxRecarga: true, dataProxTesteHidraulico: true, shipId: true },
      orderBy: [{ dataProxRecarga: "asc" }, { dataProxTesteHidraulico: "asc" }],
    });

    const epirbsExpiring = await prisma.epirb.findMany({
      where: { estado: "Ativo", OR: [{ dataProxInspecao: inWindow }, { dataValidadeBateria: inWindow }] },
      select: { id: true, serial: true, marca: true, modelo: true, dataProxInspecao: true, dataValidadeBateria: true, shipId: true },
      orderBy: [{ dataProxInspecao: "asc" }, { dataValidadeBateria: "asc" }],
    });

    const fatosExpiring = await prisma.fatoImersao.findMany({
      where: { dataProxInspecao: inWindow },
      select: { id: true, serial: true, marca: true, modelo: true, dataProxInspecao: true, shipId: true },
      orderBy: { dataProxInspecao: "asc" },
    });

    const extraShipIds = Array.from(new Set([...extintoresExpiring, ...epirbsExpiring, ...fatosExpiring].map((r) => r.shipId).filter((id): id is number => id !== null && id !== undefined)));
    const extraNavios = extraShipIds.length ? await prisma.navio.findMany({ where: { id: { in: extraShipIds } }, select: { id: true, nome: true } }) : [];
    const navioNome = new Map(extraNavios.map((n) => [n.id, n.nome]));

    // Se o formato pedido for JSON, retornar os dados diretamente
    const formatParam = searchParams.get("format");
    if (formatParam === "json") {
      const data = artigos.map((art) => {
        const validadeDate = new Date(art.validade!);
        const diffTime = validadeDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: art.id,
          nome: art.name,
          serial: art.Jangada.serial,
          marca: art.Jangada.brand || "—",
          modelo: art.Jangada.model || "—",
          capacidade: art.Jangada.capacity ? `${art.Jangada.capacity}P` : "—",
          navio: art.Jangada.shipNameManual || "—",
          armador: art.Jangada.owner || "—",
          certificado: art.inspecao?.certificadoNumero || "—",
          validade: art.validade,
          quantidade: art.quantidade,
          dias: diffDays >= 0 ? diffDays : -1, // -1 para expirados
        };
      });
      return NextResponse.json(data);
    }

    // Criar workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Validades");

    // Cabeçalho da tabela
    worksheet.columns = [
      { header: "Nome do Artigo", key: "nome", width: 30 },
      { header: "Nº Série Jangada", key: "serial", width: 20 },
      { header: "Marca", key: "marca", width: 15 },
      { header: "Modelo", key: "modelo", width: 15 },
      { header: "Lotação (P)", key: "capacidade", width: 12 },
      { header: "Embarcação", key: "navio", width: 25 },
      { header: "Armador / Cliente", key: "armador", width: 25 },
      { header: "Nº Certificado", key: "certificado", width: 15 },
      { header: "Validade", key: "validade", width: 15 },
      { header: "Quantidade", key: "quantidade", width: 12 },
      { header: "Dias Restantes", key: "dias", width: 15 },
    ];

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F46E5" }, // Indigo primary color
    };

    // Preencher dados
    artigos.forEach((art) => {
      const validadeDate = new Date(art.validade!);
      const diffTime = validadeDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedValidade = `${String(validadeDate.getDate()).padStart(2, '0')}/${String(validadeDate.getMonth() + 1).padStart(2, '0')}/${validadeDate.getFullYear()}`;

      worksheet.addRow({
        nome: art.name,
        serial: art.Jangada.serial,
        marca: art.Jangada.brand || "—",
        modelo: art.Jangada.model || "—",
        capacidade: art.Jangada.capacity ? `${art.Jangada.capacity}P` : "—",
        navio: art.Jangada.shipNameManual || "—",
        armador: art.Jangada.owner || "—",
        certificado: art.inspecao?.certificadoNumero || "—",
        validade: formattedValidade,
        quantidade: art.quantidade,
        dias: diffDays >= 0 ? diffDays : "Expirado",
      });
    });

    // Alinhamentos e bordas simples
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Alternar cor de fundo nas linhas
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F9FAFB" },
          };
        }
      }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E5E7EB" } },
          left: { style: "thin", color: { argb: "E5E7EB" } },
          bottom: { style: "thin", color: { argb: "E5E7EB" } },
          right: { style: "thin", color: { argb: "E5E7EB" } },
        };
      });
    });

    const writeSimpleSheet = (name: string, columns: Array<{ header: string; key: string; width: number }>, rows: Array<Record<string, unknown>>) => {
      const ws = workbook.addWorksheet(name);
      ws.columns = columns;
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F46E5" } };
      rows.forEach((r) => ws.addRow(r));
      ws.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && rowNumber % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F9FAFB" } };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "E5E7EB" } },
            left: { style: "thin", color: { argb: "E5E7EB" } },
            bottom: { style: "thin", color: { argb: "E5E7EB" } },
            right: { style: "thin", color: { argb: "E5E7EB" } },
          };
        });
      });
    };

    const fmt = (d: string | null | undefined) =>
      d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "—";
    const diasRestantes = (d: string) => {
      const diff = Math.ceil((new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 ? diff : "Expirado";
    };

    const extintorRows = extintoresExpiring.flatMap((e) => {
      const rows: Array<Record<string, unknown>> = [];
      const navio = e.shipId && navioNome.has(e.shipId) ? navioNome.get(e.shipId) : "—";
      if (e.dataProxRecarga && e.dataProxRecarga >= nowIso && (!limitIso || e.dataProxRecarga <= limitIso)) {
        rows.push({ nome: `${e.marca || "Extintor"} ${e.modelo || ""}`.trim(), serie: e.serial || `#${e.id}`, agente: e.tipoAgente || "—", navio, tipo: "Recarga", validade: fmt(e.dataProxRecarga), dias: diasRestantes(e.dataProxRecarga) });
      }
      if (e.dataProxTesteHidraulico && e.dataProxTesteHidraulico >= nowIso && (!limitIso || e.dataProxTesteHidraulico <= limitIso)) {
        rows.push({ nome: `${e.marca || "Extintor"} ${e.modelo || ""}`.trim(), serie: e.serial || `#${e.id}`, agente: e.tipoAgente || "—", navio, tipo: "Teste hidráulico", validade: fmt(e.dataProxTesteHidraulico), dias: diasRestantes(e.dataProxTesteHidraulico) });
      }
      return rows;
    });

    const epirbRows = epirbsExpiring.flatMap((e) => {
      const rows: Array<Record<string, unknown>> = [];
      const navio = e.shipId && navioNome.has(e.shipId) ? navioNome.get(e.shipId) : "—";
      if (e.dataProxInspecao && e.dataProxInspecao >= nowIso && (!limitIso || e.dataProxInspecao <= limitIso)) {
        rows.push({ nome: `${e.marca || "EPIRB"} ${e.modelo || ""}`.trim(), serie: e.serial || `#${e.id}`, navio, tipo: "Inspeção", validade: fmt(e.dataProxInspecao), dias: diasRestantes(e.dataProxInspecao) });
      }
      if (e.dataValidadeBateria && e.dataValidadeBateria >= nowIso && (!limitIso || e.dataValidadeBateria <= limitIso)) {
        rows.push({ nome: `${e.marca || "EPIRB"} ${e.modelo || ""}`.trim(), serie: e.serial || `#${e.id}`, navio, tipo: "Bateria", validade: fmt(e.dataValidadeBateria), dias: diasRestantes(e.dataValidadeBateria) });
      }
      return rows;
    });

    const fatoRows = fatosExpiring.flatMap((f) => {
      const navio = f.shipId && navioNome.has(f.shipId) ? navioNome.get(f.shipId) : "—";
      if (!(f.dataProxInspecao && f.dataProxInspecao >= nowIso && (!limitIso || f.dataProxInspecao <= limitIso))) return [];
      return [{ nome: `${f.marca || "Fato de imersão"} ${f.modelo || ""}`.trim(), serie: f.serial || `#${f.id}`, navio, tipo: "Inspeção", validade: fmt(f.dataProxInspecao), dias: diasRestantes(f.dataProxInspecao) }];
    });

    const simpleColumns = [
      { header: "Equipamento", key: "nome", width: 30 },
      { header: "Nº Série", key: "serie", width: 20 },
      { header: "Agente", key: "agente", width: 12 },
      { header: "Embarcação", key: "navio", width: 25 },
      { header: "Tipo", key: "tipo", width: 16 },
      { header: "Validade", key: "validade", width: 15 },
      { header: "Dias Restantes", key: "dias", width: 15 },
    ];

    if (extintorRows.length) writeSimpleSheet("Extintores", simpleColumns, extintorRows);
    if (epirbRows.length) writeSimpleSheet("EPIRBs", simpleColumns, epirbRows);
    if (fatoRows.length) writeSimpleSheet("Fatos de Imersão", simpleColumns, fatoRows);

    // Gerar buffer e retornar
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=relatorio-validades-${daysParam}d.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Erro ao gerar relatório de validades:", error);
    return NextResponse.json(
      { error: "Erro ao gerar o relatório Excel." },
      { status: 500 }
    );
  }
}
