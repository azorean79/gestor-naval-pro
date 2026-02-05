import { Certificate, CertificateUpload, CertificateStatus, CertificateType, CertificateFilter } from './certificate-types';

/**
 * Serviço de Certificados
 * Gerencia upload, validação, armazenamento e consulta de certificados
 */

const CERTIFICATES_FOLDER = 'certificates';
const EXPIRING_SOON_DAYS = 90; // Certificados expirando em 90 dias ou menos

export class CertificatesService {
  /**
   * Calcula o status do certificado baseado na data de expiração
   */
  static calculateStatus(expiryDate: Date): CertificateStatus {
    const today = new Date();
    const expiryTime = new Date(expiryDate).getTime();
    const todayTime = today.getTime();

    if (expiryTime < todayTime) {
      return CertificateStatus.EXPIRED;
    }

    const daysUntilExpiry = Math.ceil((expiryTime - todayTime) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
      return CertificateStatus.EXPIRING_SOON;
    }

    return CertificateStatus.ACTIVE;
  }

  /**
   * Valida as datas do certificado
   */
  static validateDates(issuedDate: Date, expiryDate: Date): { valid: boolean; error?: string } {
    const issued = new Date(issuedDate);
    const expiry = new Date(expiryDate);

    if (issued >= expiry) {
      return {
        valid: false,
        error: 'Data de expiração deve ser posterior à data de emissão',
      };
    }

    const today = new Date();
    if (issued > today) {
      return {
        valid: false,
        error: 'Data de emissão não pode ser no futuro',
      };
    }

    return { valid: true };
  }

  /**
   * Valida o arquivo do certificado
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Máximo 10 MB.',
      };
    }

    return { valid: true };
  }

  /**
   * Gera um ID único para o certificado
   */
  static generateCertificateId(): string {
    return `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera o caminho do arquivo do certificado
   */
  static generateFilePath(certificateId: string, originalFileName: string): string {
    const timestamp = Date.now();
    const ext = originalFileName.split('.').pop();
    return `${CERTIFICATES_FOLDER}/${certificateId}_${timestamp}.${ext}`;
  }

  /**
   * Formata dados do certificado para exibição
   */
  static formatCertificateForDisplay(cert: Certificate) {
    return {
      ...cert,
      issuedDate: new Date(cert.issuedDate).toLocaleDateString('pt-BR'),
      expiryDate: new Date(cert.expiryDate).toLocaleDateString('pt-BR'),
      statusLabel: this.getStatusLabel(cert.status),
      typeLabel: this.getTypeLabel(cert.type),
    };
  }

  /**
   * Retorna o rótulo legível do status
   */
  static getStatusLabel(status: CertificateStatus): string {
    const labels: Record<CertificateStatus, string> = {
      [CertificateStatus.ACTIVE]: 'Ativo',
      [CertificateStatus.EXPIRED]: 'Expirado',
      [CertificateStatus.EXPIRING_SOON]: 'Vencendo em breve',
      [CertificateStatus.REVOKED]: 'Revogado',
      [CertificateStatus.PENDING]: 'Pendente',
    };
    return labels[status] || status;
  }

  /**
   * Retorna o rótulo legível do tipo
   */
  static getTypeLabel(type: CertificateType): string {
    const labels: Record<CertificateType, string> = {
      [CertificateType.CLASSIFICATION]: 'Classificação',
      [CertificateType.INSPECTION]: 'Inspeção',
      [CertificateType.MAINTENANCE]: 'Manutenção',
      [CertificateType.SAFETY]: 'Segurança',
      [CertificateType.ENVIRONMENTAL]: 'Ambiental',
      [CertificateType.OTHER]: 'Outro',
    };
    return labels[type] || type;
  }

  /**
   * Filtra certificados baseado nos critérios fornecidos
   */
  static filterCertificates(certificates: Certificate[], filter: CertificateFilter): Certificate[] {
    return certificates.filter((cert) => {
      if (filter.jangadaId && cert.jangadaId !== filter.jangadaId) {
        return false;
      }

      if (filter.type && cert.type !== filter.type) {
        return false;
      }

      if (filter.status && cert.status !== filter.status) {
        return false;
      }

      if (filter.searchTerm) {
        const search = filter.searchTerm.toLowerCase();
        return (
          cert.name.toLowerCase().includes(search) ||
          cert.issuer.toLowerCase().includes(search) ||
          cert.notes?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }

  /**
   * Agrupa certificados por tipo
   */
  static groupByType(certificates: Certificate[]): Record<CertificateType, Certificate[]> {
    return certificates.reduce((acc, cert) => {
      if (!acc[cert.type]) {
        acc[cert.type] = [];
      }
      acc[cert.type].push(cert);
      return acc;
    }, {} as Record<CertificateType, Certificate[]>);
  }

  /**
   * Agrupa certificados por status
   */
  static groupByStatus(certificates: Certificate[]): Record<CertificateStatus, Certificate[]> {
    return certificates.reduce((acc, cert) => {
      if (!acc[cert.status]) {
        acc[cert.status] = [];
      }
      acc[cert.status].push(cert);
      return acc;
    }, {} as Record<CertificateStatus, Certificate[]>);
  }

  /**
   * Retorna certificados que expiram em breve
   */
  static getExpiringCertificates(certificates: Certificate[]): Certificate[] {
    return certificates.filter((cert) => cert.status === CertificateStatus.EXPIRING_SOON);
  }

  /**
   * Retorna certificados expirados
   */
  static getExpiredCertificates(certificates: Certificate[]): Certificate[] {
    return certificates.filter((cert) => cert.status === CertificateStatus.EXPIRED);
  }
}

export default CertificatesService;
