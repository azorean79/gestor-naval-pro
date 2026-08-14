import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Seed sample recalls if the table is empty
async function seedRecallsIfEmpty() {
  try {
    const count = await prisma.recall.count();
    if (count === 0) {
      await prisma.recall.createMany({
        data: [
          {
            fabricante: "LALIZAS",
            modeloPattern: "ISO-9650",
            serialPattern: "*",
            titulo: "Substituição Preventiva da Válvula de Enchimento rápido",
            descricao: "Foi identificada uma potencial perda de estanqueidade nas válvulas de enchimento da marca Lalizas instaladas em jangadas fabricadas entre 2021 e 2023.",
            acaoRequerida: "Verificar estanqueidade da válvula de enchimento com sabão líquido durante o teste WP e substituir a válvula se necessário.",
            gravidade: "ALTA",
            ativo: true,
          },
          {
            fabricante: "RFD",
            modeloPattern: "SURVIVOR",
            serialPattern: "RFD-2022-*",
            titulo: "Inspeção do Kit de Disparo de Garrafa de CO2",
            descricao: "O fabricante RFD emitiu um aviso de recall para o kit de disparo manual de cabo em jangadas do modelo Survivor fabricadas em 2022.",
            acaoRequerida: "Substituir o pino de disparo de latão pelo novo pino de aço inoxidável revestido fornecido no kit de recall.",
            gravidade: "ALTA",
            ativo: true,
          },
          {
            fabricante: "ZODIAC",
            modeloPattern: "COASTAL",
            serialPattern: "*",
            titulo: "Aviso de Validade das Bandas de Pressão do Casco",
            descricao: "Algumas colas utilizadas nas bandas de união vulcanizadas de jangadas Zodiac Coastal podem apresentar degradação precoce em climas húmidos.",
            acaoRequerida: "Realizar teste NAP (teste de costuras a pressão elevada) com atenção redobrada nas emendas laterais da câmara superior.",
            gravidade: "MEDIA",
            ativo: true,
          }
        ],
      });
    }
  } catch (err) {
    console.error("Error seeding sample recalls:", err);
  }
}

export async function GET() {
  try {
    await seedRecallsIfEmpty();
    const recalls = await prisma.recall.findMany({
      where: { ativo: true },
      orderBy: { dataPublicacao: "desc" },
    });
    return NextResponse.json(recalls);
  } catch (error) {
    console.error("Error fetching recalls:", error);
    return NextResponse.json({ error: "Erro ao obter alertas de segurança." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { fabricante, modeloPattern, serialPattern, titulo, descricao, acaoRequerida, gravidade } = payload;

    if (!fabricante || !titulo || !descricao || !acaoRequerida) {
      return NextResponse.json({ error: "Campos fabricante, título, descrição e ação requerida são obrigatórios." }, { status: 400 });
    }

    const recall = await prisma.recall.create({
      data: {
        fabricante: String(fabricante).trim().toUpperCase(),
        modeloPattern: modeloPattern ? String(modeloPattern).trim().toUpperCase() : null,
        serialPattern: serialPattern ? String(serialPattern).trim() : null,
        titulo: String(titulo),
        descricao: String(descricao),
        acaoRequerida: String(acaoRequerida),
        gravidade: gravidade || "ALTA",
      },
    });

    return NextResponse.json({ success: true, recall });
  } catch (error) {
    console.error("Error creating recall:", error);
    return NextResponse.json({ error: "Erro ao registar alerta de segurança." }, { status: 500 });
  }
}
