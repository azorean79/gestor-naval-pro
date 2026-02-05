// Tipos para o módulo de certificados
export interface Certificate {
  id: string;
  name: string;
  type: CertificateType;
  issuedDate: Date;
  expiryDate: Date;
  issuer: string;
  filePath: string;
  jangadaId?: string;
  status: CertificateStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CertificateType {
  CLASSIFICATION = 'CLASSIFICATION',
  INSPECTION = 'INSPECTION',
  MAINTENANCE = 'MAINTENANCE',
  SAFETY = 'SAFETY',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  OTHER = 'OTHER',
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  EXPIRING_SOON = 'EXPIRING_SOON',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING',
}

export interface CertificateUpload {
  name: string;
  type: CertificateType;
  issuedDate: Date;
  expiryDate: Date;
  issuer: string;
  file: File;
  jangadaId?: string;
  notes?: string;
}

export interface CertificateFilter {
  jangadaId?: string;
  type?: CertificateType;
  status?: CertificateStatus;
  searchTerm?: string;
}
