// Interface para artigos dos quadros das jangadas (usado no frontend e backend)
export interface ArtigoJangada {
  name: string;              // Nome do artigo
  quantidade: number | string; // Quantidade (pode ser string se vier de input)
  validade?: string;         // Data de validade (opcional)
  referencia?: string;       // Referência interna ou do fornecedor
  codigoFabricante?: string; // Código do fabricante (opcional)
  sourceItemCertificado?: string; // Nome original no certificado/quadro
  sourceCertificadoNumero?: string; // Certificado de origem
}
