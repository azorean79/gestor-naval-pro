import {
  generateNavioColetesCertificateDocx,
  type ColeteCertificateRow,
  type NavioColetesCertificateInput,
} from "@/lib/colete-certificate-template";

/** Reutiliza o template DOCX de coletes (mesma grelha: marca/modelo/serial/fabrico/status). */
export type FatoImersaoCertificateRow = ColeteCertificateRow;
export type NavioFatosImersaoCertificateInput = NavioColetesCertificateInput;

export async function generateNavioFatosImersaoCertificateDocx(input: NavioFatosImersaoCertificateInput) {
  return generateNavioColetesCertificateDocx(input);
}
