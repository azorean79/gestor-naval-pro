import { z } from 'zod';
import { CertificateType } from './certificate-types';

/**
 * Schemas de validação para certificados
 */

export const CertificateTypeSchema = z.enum([
  CertificateType.CLASSIFICATION,
  CertificateType.INSPECTION,
  CertificateType.MAINTENANCE,
  CertificateType.SAFETY,
  CertificateType.ENVIRONMENTAL,
  CertificateType.OTHER,
]);

export const CreateCertificateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  type: CertificateTypeSchema,
  issuedDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  issuer: z.string().min(2, 'Emissor deve ter pelo menos 2 caracteres').max(255),
  jangadaId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateCertificateSchema = CreateCertificateSchema.partial().extend({
  id: z.string(),
});

export const CertificateFilterSchema = z.object({
  jangadaId: z.string().optional(),
  type: CertificateTypeSchema.optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'EXPIRING_SOON', 'REVOKED', 'PENDING']).optional(),
  searchTerm: z.string().optional(),
}).strict();

export type CreateCertificateInput = z.infer<typeof CreateCertificateSchema>;
export type UpdateCertificateInput = z.infer<typeof UpdateCertificateSchema>;
export type CertificateFilterInput = z.infer<typeof CertificateFilterSchema>;
