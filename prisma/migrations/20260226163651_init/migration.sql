-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operador',
    "permissoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jangadas" (
    "id" TEXT NOT NULL,
    "numeroReferencia" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "proprietario" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "modeloId" TEXT,
    "lotacao" INTEGER,
    "dataFabricacao" TIMESTAMP(3),
    "cilindro" TEXT,
    "tipoPack" TEXT,
    "tipoPesca" TEXT,
    "zonaPesca" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "ilha" TEXT,
    "portoEscala" TEXT,
    "ultimaInspecao" TIMESTAMP(3),
    "proximaInspecao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jangadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navios" (
    "id" TEXT NOT NULL,
    "numeroReferencia" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "imo" TEXT NOT NULL,
    "mmsi" TEXT,
    "matricula" TEXT,
    "bandeira" TEXT,
    "ilha" TEXT,
    "portoEscala" TEXT,
    "tipoNavioId" TEXT,
    "comprimento" DOUBLE PRECISION,
    "largura" DOUBLE PRECISION,
    "calado" DOUBLE PRECISION,
    "capacidade" DOUBLE PRECISION,
    "proprietario" TEXT,
    "proprietarioId" TEXT,
    "armador" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "ultimaInspecao" TIMESTAMP(3),
    "proximaInspecao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_navio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_navio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "numeroReferencia" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "morada" TEXT,
    "contactosEmergencia" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "ilha" TEXT,
    "portoEscala" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "profissao" TEXT,
    "empresa" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_stock" (
    "precoCompra" DOUBLE PRECISION,
    "precoVenda" DOUBLE PRECISION,
    "codigoFabricante" TEXT,
    "codigo" TEXT,
    "imagem" TEXT,
    "lote" TEXT,
    "dataValidade" TIMESTAMP(3),
    "stockMinimo" DOUBLE PRECISION DEFAULT 0,
    "quantidade" DOUBLE PRECISION DEFAULT 0,
    "id" TEXT NOT NULL,
    "numeroReferencia" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "unidade" TEXT NOT NULL DEFAULT 'unidade',
    "quantidadeAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidadeMinima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidadeMaxima" DOUBLE PRECISION,
    "precoUnitario" DOUBLE PRECISION,
    "fornecedor" TEXT,
    "localizacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disponivel',
    "dataUltimaEntrada" TIMESTAMP(3),
    "dataUltimaSaida" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao_stock" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsavel" TEXT NOT NULL,
    "valorUnitario" DOUBLE PRECISION,
    "observacoes" TEXT,

    CONSTRAINT "movimentacao_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cilindros" (
    "id" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "pesoBruto" DOUBLE PRECISION,
    "tara" DOUBLE PRECISION,
    "quantidadeCO2" DOUBLE PRECISION,
    "quantidadeN2" DOUBLE PRECISION,
    "testeHidraulico" TIMESTAMP(3),
    "proximoTesteHidraulico" TIMESTAMP(3),
    "tipoSistemaInsuflacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'operacional',
    "localizacao" TEXT,
    "proprietario" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cilindros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecao_cilindro" (
    "id" TEXT NOT NULL,
    "cilindroId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL,
    "proximaInspecao" TIMESTAMP(3),

    CONSTRAINT "inspecao_cilindro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspecao" (
    "id" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "equipamentoNome" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "tipoInspecao" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "dataInspecao" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "checklist" TEXT NOT NULL,
    "observacoesGerais" TEXT,
    "dataConclusao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "responsavel" TEXT NOT NULL,
    "participantes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "prioridade" TEXT NOT NULL DEFAULT 'media',
    "entidadeRelacionada" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lembretes" (
    "id" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lembretes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" TEXT,
    "clienteNome" TEXT,
    "navioId" TEXT,
    "navioNome" TEXT,
    "tipoServico" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recebido',
    "prioridade" TEXT NOT NULL DEFAULT 'normal',
    "dataRececao" TIMESTAMP(3) NOT NULL,
    "dataPrevistaEntrega" TIMESTAMP(3),
    "delegacao" TEXT,
    "tecnicoResponsavel" TEXT,
    "observacoes" TEXT,
    "valorEstimado" DOUBLE PRECISION,
    "etapas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_ordem_servico" (
    "id" TEXT NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "itemStockId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" DOUBLE PRECISION,
    "observacoes" TEXT,

    CONSTRAINT "itens_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "dados" TEXT NOT NULL,
    "geradoPor" TEXT NOT NULL,
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formato" TEXT NOT NULL DEFAULT 'pdf',
    "arquivo" TEXT,
    "ordemServicoId" TEXT,

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'manual',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tamanho" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'concluido',
    "localizacao" TEXT NOT NULL,
    "criadoPor" TEXT NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "editavel" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "emissor" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "arquivo" TEXT,
    "jangadaId" TEXT,
    "clienteId" TEXT,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "emissor" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3),
    "dataValidade" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'valido',
    "navioId" TEXT,
    "cilindroId" TEXT,
    "arquivoUrl" TEXT,
    "tipoEquipamento" TEXT,
    "marca" TEXT,
    "modelos" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fabricante" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "dataInstalacao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'operacional',
    "ultimaManutencao" TIMESTAMP(3),
    "proximaManutencao" TIMESTAMP(3),
    "navioId" TEXT NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jangadas_numeroReferencia_key" ON "jangadas"("numeroReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "jangadas_numero_key" ON "jangadas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "navios_numeroReferencia_key" ON "navios"("numeroReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "navios_imo_key" ON "navios"("imo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_navio_nome_key" ON "tipos_navio"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_numeroReferencia_key" ON "clientes"("numeroReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nif_key" ON "clientes"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nome_key" ON "marcas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_nome_marcaId_key" ON "modelos"("nome", "marcaId");

-- CreateIndex
CREATE UNIQUE INDEX "item_stock_codigo_key" ON "item_stock"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "item_stock_numeroReferencia_key" ON "item_stock"("numeroReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "cilindros_numeroSerie_key" ON "cilindros"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numero_key" ON "ordens_servico"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navios" ADD CONSTRAINT "navios_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navios" ADD CONSTRAINT "navios_tipoNavioId_fkey" FOREIGN KEY ("tipoNavioId") REFERENCES "tipos_navio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos" ADD CONSTRAINT "modelos_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao_stock" ADD CONSTRAINT "movimentacao_stock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item_stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecao_cilindro" ADD CONSTRAINT "inspecao_cilindro_cilindroId_fkey" FOREIGN KEY ("cilindroId") REFERENCES "cilindros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembretes" ADD CONSTRAINT "lembretes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem_servico" ADD CONSTRAINT "itens_ordem_servico_itemStockId_fkey" FOREIGN KEY ("itemStockId") REFERENCES "item_stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ordem_servico" ADD CONSTRAINT "itens_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios" ADD CONSTRAINT "relatorios_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_cilindroId_fkey" FOREIGN KEY ("cilindroId") REFERENCES "cilindros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
