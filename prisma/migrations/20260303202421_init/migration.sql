-- CreateTable
CREATE TABLE "public"."Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "numeroCliente" TEXT,
    "nif" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "telmovel" TEXT,
    "morada" TEXT,
    "ilha" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Navio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "ilha" TEXT NOT NULL,
    "tipoPesca" TEXT NOT NULL,
    "clienteId" INTEGER,

    CONSTRAINT "Navio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agenda" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "embarcacoesDePesca" TEXT NOT NULL,
    "tipoPesca" TEXT NOT NULL,
    "lotacao" INTEGER NOT NULL,
    "bandeira" TEXT NOT NULL,
    "clienteId" INTEGER,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Jangada" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "dataFabrico" TEXT NOT NULL,
    "packType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "shipId" INTEGER,
    "shipNameManual" TEXT,
    "dataInspecao" TEXT,
    "dataProxInspecao" TEXT,
    "cylinderSerial" TEXT,
    "cylinderTara" TEXT,
    "cylinderPesoBruto" TEXT,
    "cylinderCo2" TEXT,
    "cylinderN2" TEXT,
    "cylinderDataTeste" TEXT,
    "cylinderDataProxTeste" TEXT,
    "cylinderSistema" TEXT,
    "hruReferencia" TEXT,
    "hruDataInstalacao" TEXT,
    "hruValidade" TEXT,
    "artigos" TEXT,
    "tuboIdentificacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "certificadoAtivoId" INTEGER,

    CONSTRAINT "Jangada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CertificadoExtraido" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "certificadoNumero" TEXT,
    "sourceYear" INTEGER NOT NULL DEFAULT 2025,
    "raftSerial" TEXT,
    "shipName" TEXT,
    "dataInspecao" TEXT,
    "dataProxInspecao" TEXT,
    "emergencyPackType" TEXT,
    "hasQuadro" BOOLEAN NOT NULL DEFAULT false,
    "validitiesCount" INTEGER NOT NULL DEFAULT 0,
    "isMaisRecente" BOOLEAN NOT NULL DEFAULT false,
    "aplicadoComoAtivo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificadoExtraido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CertificadoValidade" (
    "id" SERIAL NOT NULL,
    "certificadoId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "validade" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificadoValidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Stock" (
    "id" SERIAL NOT NULL,
    "referencia" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "associavelJangada" BOOLEAN NOT NULL DEFAULT false,
    "aplicavelMarcaJangada" TEXT,
    "aplicavelModeloJangada" TEXT,
    "precoCompra" DOUBLE PRECISION,
    "codigoFabricante" TEXT,
    "inventario" TEXT,
    "lote" TEXT,
    "validade" TEXT,
    "precoVenda" DOUBLE PRECISION NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inspecao" (
    "id" SERIAL NOT NULL,
    "certificadoNumero" TEXT NOT NULL,
    "navioNome" TEXT NOT NULL,
    "navioId" INTEGER,
    "jangadaId" INTEGER,
    "jangadaSerial" TEXT,
    "dataInspecao" TEXT NOT NULL,
    "dataProxInspecao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Concluída',
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InspecaoArtigo" (
    "id" SERIAL NOT NULL,
    "inspecaoId" INTEGER NOT NULL,
    "stockId" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidadePlaneada" INTEGER NOT NULL DEFAULT 1,
    "quantidadeUsada" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Pendente',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspecaoArtigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Equipamento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "serial" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Ativo',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_numeroCliente_key" ON "public"."Cliente"("numeroCliente");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nif_key" ON "public"."Cliente"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Jangada_serial_key" ON "public"."Jangada"("serial");

-- CreateIndex
CREATE INDEX "Jangada_certificadoAtivoId_idx" ON "public"."Jangada"("certificadoAtivoId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificadoExtraido_fileName_key" ON "public"."CertificadoExtraido"("fileName");

-- CreateIndex
CREATE INDEX "CertificadoExtraido_raftSerial_idx" ON "public"."CertificadoExtraido"("raftSerial");

-- CreateIndex
CREATE INDEX "CertificadoExtraido_shipName_idx" ON "public"."CertificadoExtraido"("shipName");

-- CreateIndex
CREATE INDEX "CertificadoExtraido_dataInspecao_idx" ON "public"."CertificadoExtraido"("dataInspecao");

-- CreateIndex
CREATE INDEX "CertificadoExtraido_isMaisRecente_idx" ON "public"."CertificadoExtraido"("isMaisRecente");

-- CreateIndex
CREATE INDEX "CertificadoValidade_certificadoId_idx" ON "public"."CertificadoValidade"("certificadoId");

-- CreateIndex
CREATE INDEX "CertificadoValidade_item_idx" ON "public"."CertificadoValidade"("item");

-- CreateIndex
CREATE INDEX "CertificadoValidade_validade_idx" ON "public"."CertificadoValidade"("validade");

-- CreateIndex
CREATE UNIQUE INDEX "CertificadoValidade_certificadoId_item_validade_rowNumber_key" ON "public"."CertificadoValidade"("certificadoId", "item", "validade", "rowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_referencia_key" ON "public"."Stock"("referencia");

-- CreateIndex
CREATE INDEX "Stock_categoria_idx" ON "public"."Stock"("categoria");

-- CreateIndex
CREATE INDEX "Stock_associavelJangada_idx" ON "public"."Stock"("associavelJangada");

-- CreateIndex
CREATE INDEX "Stock_aplicavelMarcaJangada_idx" ON "public"."Stock"("aplicavelMarcaJangada");

-- CreateIndex
CREATE INDEX "Stock_aplicavelModeloJangada_idx" ON "public"."Stock"("aplicavelModeloJangada");

-- CreateIndex
CREATE UNIQUE INDEX "Inspecao_certificadoNumero_key" ON "public"."Inspecao"("certificadoNumero");

-- CreateIndex
CREATE INDEX "Inspecao_navioNome_idx" ON "public"."Inspecao"("navioNome");

-- CreateIndex
CREATE INDEX "Inspecao_navioId_idx" ON "public"."Inspecao"("navioId");

-- CreateIndex
CREATE INDEX "Inspecao_jangadaId_idx" ON "public"."Inspecao"("jangadaId");

-- CreateIndex
CREATE INDEX "Inspecao_jangadaSerial_idx" ON "public"."Inspecao"("jangadaSerial");

-- CreateIndex
CREATE INDEX "Inspecao_dataInspecao_idx" ON "public"."Inspecao"("dataInspecao");

-- CreateIndex
CREATE INDEX "InspecaoArtigo_inspecaoId_idx" ON "public"."InspecaoArtigo"("inspecaoId");

-- CreateIndex
CREATE INDEX "InspecaoArtigo_stockId_idx" ON "public"."InspecaoArtigo"("stockId");

-- CreateIndex
CREATE INDEX "InspecaoArtigo_estado_idx" ON "public"."InspecaoArtigo"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "InspecaoArtigo_inspecaoId_stockId_key" ON "public"."InspecaoArtigo"("inspecaoId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipamento_serial_key" ON "public"."Equipamento"("serial");

-- CreateIndex
CREATE INDEX "Equipamento_nome_idx" ON "public"."Equipamento"("nome");

-- CreateIndex
CREATE INDEX "Equipamento_estado_idx" ON "public"."Equipamento"("estado");

-- AddForeignKey
ALTER TABLE "public"."Navio" ADD CONSTRAINT "Navio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agenda" ADD CONSTRAINT "Agenda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Jangada" ADD CONSTRAINT "Jangada_certificadoAtivoId_fkey" FOREIGN KEY ("certificadoAtivoId") REFERENCES "public"."CertificadoExtraido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificadoExtraido" ADD CONSTRAINT "CertificadoExtraido_raftSerial_fkey" FOREIGN KEY ("raftSerial") REFERENCES "public"."Jangada"("serial") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificadoValidade" ADD CONSTRAINT "CertificadoValidade_certificadoId_fkey" FOREIGN KEY ("certificadoId") REFERENCES "public"."CertificadoExtraido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InspecaoArtigo" ADD CONSTRAINT "InspecaoArtigo_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "public"."Inspecao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InspecaoArtigo" ADD CONSTRAINT "InspecaoArtigo_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "public"."Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
