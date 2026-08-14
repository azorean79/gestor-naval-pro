CREATE TABLE "ContactoInterno" (
    "id" SERIAL NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Colaborador',
    "empresa" TEXT,
    "localizacao" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telemovel" TEXT,
    "telefoneFixo" TEXT,
    "extensaoNos" TEXT,
    "extensaoVodafone" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "fonte" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactoInterno_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactoInterno_categoria_idx" ON "ContactoInterno"("categoria");
CREATE INDEX "ContactoInterno_empresa_idx" ON "ContactoInterno"("empresa");
CREATE INDEX "ContactoInterno_localizacao_idx" ON "ContactoInterno"("localizacao");
CREATE INDEX "ContactoInterno_nome_idx" ON "ContactoInterno"("nome");
CREATE INDEX "ContactoInterno_ativo_idx" ON "ContactoInterno"("ativo");
CREATE INDEX "ContactoInterno_fonte_idx" ON "ContactoInterno"("fonte");
