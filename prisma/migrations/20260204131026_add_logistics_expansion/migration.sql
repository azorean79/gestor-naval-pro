/*
  Warnings:

  - You are about to drop the column `dataValidade` on the `stock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "envio_itens" ADD COLUMN     "certificadoId" TEXT,
ADD COLUMN     "correspondenciaId" TEXT;

-- AlterTable
ALTER TABLE "envios" ALTER COLUMN "enderecoEntrega" DROP NOT NULL;

-- AlterTable
ALTER TABLE "stock" DROP COLUMN "dataValidade";

-- CreateTable
CREATE TABLE "correspondencias" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "remetenteNome" TEXT,
    "remetenteEmail" TEXT,
    "remetenteTelefone" TEXT,
    "destinatarioNome" TEXT NOT NULL,
    "destinatarioEmail" TEXT,
    "destinatarioTelefone" TEXT,
    "enderecoEntrega" TEXT,
    "conteudo" TEXT,
    "anexos" TEXT,
    "dataEnvio" TIMESTAMP(3),
    "dataRecebimento" TIMESTAMP(3),
    "metodoEnvio" TEXT,
    "responsavel" TEXT NOT NULL DEFAULT 'Julio Correia',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "prioridade" TEXT NOT NULL DEFAULT 'media',
    "dataVencimento" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "contatoNome" TEXT,
    "contatoEmail" TEXT,
    "contatoTelefone" TEXT,
    "stockId" TEXT,
    "clienteId" TEXT,
    "quantidade" INTEGER,
    "criadoPor" TEXT NOT NULL DEFAULT 'Sistema',
    "responsavel" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "envio_itens" ADD CONSTRAINT "envio_itens_certificadoId_fkey" FOREIGN KEY ("certificadoId") REFERENCES "certificados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envio_itens" ADD CONSTRAINT "envio_itens_correspondenciaId_fkey" FOREIGN KEY ("correspondenciaId") REFERENCES "correspondencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
