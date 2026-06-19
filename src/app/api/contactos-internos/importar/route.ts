import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAuditoria } from "@/lib/auditoria";
import {
  CONTACTOS_INTERNOS_PDF_SOURCE,
  DEFAULT_CONTACTOS_INTERNOS_PDF_PATH,
  type ImportedContactoInterno,
  loadContactosInternosFromPdf,
} from "@/lib/contactos-internos-import";

type ContactoInternoCreateResult = { id: number };

type ContactoInternoTransactionalDelegate = {
  deleteMany(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<ContactoInternoCreateResult>;
};

type ImportRequestBody = {
  replaceExisting?: boolean;
  pdfPath?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ImportRequestBody;
    const replaceExisting = body?.replaceExisting !== false;
    const pdfPath = typeof body?.pdfPath === "string" && body.pdfPath.trim()
      ? body.pdfPath.trim()
      : DEFAULT_CONTACTOS_INTERNOS_PDF_PATH;

    const contactos = await loadContactosInternosFromPdf(pdfPath);
    if (!contactos.length) {
      return NextResponse.json(
        { error: "Não foi possível extrair contactos do PDF indicado." },
        { status: 400 }
      );
    }

    const importedIds = await prisma.$transaction(async (tx) => {
      const contactoInternoModel = (tx as unknown as { contactoInterno: ContactoInternoTransactionalDelegate }).contactoInterno;

      if (replaceExisting) {
        await contactoInternoModel.deleteMany({ where: { fonte: CONTACTOS_INTERNOS_PDF_SOURCE } });
      }

      const created = await Promise.all(
        contactos.map((contacto: ImportedContactoInterno) =>
          contactoInternoModel.create({
            data: contacto,
            select: { id: true },
          })
        )
      );

      return created.map((item: { id: number }) => item.id);
    });

    await Promise.all(
      importedIds.map((id: number) =>
        logAuditoria({
          tabela: "ContactoInterno",
          tipoOperacao: "CREATE",
          idRegisto: id,
          descricao: `Importação do PDF de contactos internos (${CONTACTOS_INTERNOS_PDF_SOURCE})`,
        })
      )
    );

    return NextResponse.json({
      success: true,
      imported: contactos.length,
      replaceExisting,
      pdfPath,
      source: CONTACTOS_INTERNOS_PDF_SOURCE,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao importar contactos internos a partir do PDF.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
