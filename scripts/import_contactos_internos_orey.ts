import "dotenv/config";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  CONTACTOS_INTERNOS_PDF_SOURCE,
  DEFAULT_CONTACTOS_INTERNOS_PDF_PATH,
  loadContactosInternosFromPdf,
} from "../src/lib/contactos-internos-import";

const prisma = new PrismaClient();

async function main() {
  const pdfPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DEFAULT_CONTACTOS_INTERNOS_PDF_PATH;

  const contactos = await loadContactosInternosFromPdf(pdfPath);
  if (!contactos.length) {
    throw new Error(`Nenhum contacto encontrado no PDF: ${pdfPath}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.contactoInterno.deleteMany({ where: { fonte: CONTACTOS_INTERNOS_PDF_SOURCE } });
    await tx.contactoInterno.createMany({ data: contactos });
  });

  console.log(`Importados ${contactos.length} contactos a partir de ${pdfPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
