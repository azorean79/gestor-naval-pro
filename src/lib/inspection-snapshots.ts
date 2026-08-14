import prisma from "@/lib/prisma";
import { readAuditoriaJson, writeAuditoriaJson } from "./auditorias-storage";

export async function saveInspectionSnapshot(certificadoNumero: string, jangadaId: number) {
  try {
    if (!certificadoNumero) return;
    const cleanCertNo = certificadoNumero.replace(/[^a-zA-Z0-9_-]/g, "_");
    
    // Fetch the full liferaft state along with its registered articles
    const jangada = await prisma.jangada.findUnique({
      where: { id: jangadaId },
      include: { 
        artigos: true 
      }
    });

    if (!jangada) return;

    const filepath = `_meta/inspecoes-snapshots/${cleanCertNo}.json`;
    await writeAuditoriaJson(filepath, jangada);
    console.log(`Snapshot saved for inspection certificate ${certificadoNumero}`);
  } catch (error) {
    console.error(`Error saving snapshot for certificate ${certificadoNumero}:`, error);
  }
}

export async function getInspectionSnapshot(certificadoNumero: string) {
  try {
    if (!certificadoNumero) return null;
    const cleanCertNo = certificadoNumero.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filepath = `_meta/inspecoes-snapshots/${cleanCertNo}.json`;
    
    // Read the snapshot, returning null if it doesn't exist yet
    const snapshot = await readAuditoriaJson<any>(filepath, null);
    return snapshot;
  } catch (error) {
    console.error(`Error reading snapshot for certificate ${certificadoNumero}:`, error);
    return null;
  }
}

export async function writeInspectionSnapshot(certificadoNumero: string, data: any) {
  try {
    if (!certificadoNumero) return;
    const cleanCertNo = certificadoNumero.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filepath = `_meta/inspecoes-snapshots/${cleanCertNo}.json`;
    await writeAuditoriaJson(filepath, data);
    console.log(`Snapshot archived directly for certificate ${certificadoNumero}`);
  } catch (error) {
    console.error(`Error archiving snapshot for certificate ${certificadoNumero}:`, error);
  }
}
