# Pasta de Certificados

Esta pasta armazena todos os certificados digitais do sistema de gestão naval.

## Estrutura

Os certificados são organizados na seguinte estrutura:
- `certificateId_timestamp.extensão`

## Tipos de Certificados Suportados

- **CLASSIFICATION**: Certificados de classificação de embarcações
- **INSPECTION**: Certificados de inspeção
- **MAINTENANCE**: Certificados de manutenção
- **SAFETY**: Certificados de segurança
- **ENVIRONMENTAL**: Certificados ambientais
- **OTHER**: Outros tipos de certificados

## Formatos de Arquivo Aceitos

- PDF (.pdf)
- Imagens (JPG, PNG)
- Documentos Word (.doc, .docx)

## Limite de Tamanho

Máximo de 10 MB por arquivo

## Status dos Certificados

Os certificados podem ter os seguintes status:
- **ACTIVE**: Certificado ativo e válido
- **EXPIRED**: Certificado expirado
- **EXPIRING_SOON**: Certificado vencendo em 90 dias ou menos
- **REVOKED**: Certificado revogado
- **PENDING**: Certificado aguardando aprovação

## Segurança

- Todos os certificados devem ser salvos com permissões adequadas
- Backups regulares são recomendados
- Acesso restrito a usuários autorizados
