-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "nif" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'cliente',
    "delegacao" TEXT NOT NULL DEFAULT 'Açores',
    "tecnico" TEXT NOT NULL DEFAULT 'Julio Correia',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "matricula" TEXT,
    "imo" TEXT,
    "mmsi" TEXT,
    "callSign" TEXT,
    "bandeira" TEXT NOT NULL DEFAULT 'Portugal',
    "comprimento" DOUBLE PRECISION,
    "largura" DOUBLE PRECISION,
    "calado" DOUBLE PRECISION,
    "capacidade" DOUBLE PRECISION,
    "anoConstrucao" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "dataInspecao" TIMESTAMP(3),
    "dataProximaInspecao" TIMESTAMP(3),
    "clienteId" TEXT,
    "proprietarioId" TEXT,
    "delegacao" TEXT NOT NULL DEFAULT 'Açores',
    "ilha" TEXT,
    "tecnico" TEXT NOT NULL DEFAULT 'Julio Correia',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jangadas" (
    "id" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "marcaId" TEXT,
    "modeloId" TEXT,
    "lotacaoId" TEXT,
    "tipoPackId" TEXT,
    "tipo" TEXT NOT NULL,
    "tipoPack" TEXT,
    "itensTipoPack" TEXT,
    "dataFabricacao" TIMESTAMP(3),
    "dataInspecao" TIMESTAMP(3),
    "dataProximaInspecao" TIMESTAMP(3),
    "capacidade" INTEGER,
    "peso" DOUBLE PRECISION,
    "dimensoes" TEXT,
    "numeroAprovacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "estado" TEXT NOT NULL DEFAULT 'instalada',
    "clienteId" TEXT,
    "proprietarioId" TEXT,
    "navioId" TEXT,
    "tecnico" TEXT NOT NULL DEFAULT 'Julio Correia',
    "hruAplicavel" BOOLEAN NOT NULL DEFAULT true,
    "hruNumeroSerie" TEXT,
    "hruModelo" TEXT DEFAULT 'HAMMAR H20',
    "hruDataInstalacao" TIMESTAMP(3),
    "hruDataValidade" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jangadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proprietarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "nif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proprietarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cargo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "entidadeEmissora" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "clienteId" TEXT,
    "navioId" TEXT,
    "jangadaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMinima" INTEGER NOT NULL DEFAULT 0,
    "precoUnitario" DOUBLE PRECISION,
    "fornecedor" TEXT,
    "localizacao" TEXT,
    "refOrey" TEXT,
    "refFabricante" TEXT,
    "lote" TEXT,
    "dataValidade" TIMESTAMP(3),
    "imagem" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_stock" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsavel" TEXT,

    CONSTRAINT "movimentacoes_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cilindros" (
    "id" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "sistemaId" TEXT,
    "tipoCilindroId" TEXT,
    "tipoValvulaId" TEXT,
    "capacidade" DOUBLE PRECISION,
    "capacidadeN2" DOUBLE PRECISION,
    "tara" DOUBLE PRECISION,
    "pesoBruto" DOUBLE PRECISION,
    "dataFabricacao" TIMESTAMP(3),
    "dataTeste" TIMESTAMP(3),
    "dataProximoTeste" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "pressaoTrabalho" DOUBLE PRECISION,
    "pressaoTeste" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cilindros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "prioridade" TEXT NOT NULL DEFAULT 'normal',
    "navioId" TEXT,
    "jangadaId" TEXT,
    "cilindroId" TEXT,
    "pessoaId" TEXT,
    "responsavel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "descricao" TEXT,
    "clienteId" TEXT,
    "navioId" TEXT,
    "jangadaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'info',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" TEXT,
    "navioId" TEXT,
    "jangadaId" TEXT,
    "cilindroId" TEXT,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "nif" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planeada',
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "orcamento" DOUBLE PRECISION,
    "clienteId" TEXT,
    "responsavel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictive_maintenance" (
    "id" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "tipoEquipamento" TEXT NOT NULL,
    "tipoManutencao" TEXT NOT NULL,
    "probabilidade" DOUBLE PRECISION NOT NULL,
    "severidade" TEXT NOT NULL,
    "dataPrevista" TIMESTAMP(3) NOT NULL,
    "recomendacao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictive_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "dados" TEXT NOT NULL,
    "criadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecoes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipoInspecao" TEXT NOT NULL,
    "dataInspecao" TIMESTAMP(3) NOT NULL,
    "dataProxima" TIMESTAMP(3),
    "resultado" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "tecnico" TEXT NOT NULL,
    "observacoes" TEXT,
    "navioId" TEXT,
    "jangadaId" TEXT,
    "cilindroId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspecoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custos_inspecao" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER DEFAULT 1,
    "responsavel" TEXT,
    "inspecaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custos_inspecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_inspecao" (
    "id" TEXT NOT NULL,
    "dataRealizada" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "resultado" TEXT NOT NULL,
    "tecnico" TEXT NOT NULL,
    "observacoes" TEXT,
    "custo" DOUBLE PRECISION,
    "dataPreviaProxima" TIMESTAMP(3),
    "inspecaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historico_inspecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecao_componentes" (
    "id" TEXT NOT NULL,
    "jangadaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT,
    "validade" TIMESTAMP(3),
    "tipo" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspecao_componentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "substituicao_componentes" (
    "id" TEXT NOT NULL,
    "componenteNome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "motivoSubstituicao" TEXT NOT NULL,
    "dataSubstituicao" TIMESTAMP(3) NOT NULL,
    "inspecaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "substituicao_componentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas_jangada" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_jangada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos_jangada" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "sistemaInsuflacao" TEXT,
    "valvulasPadrao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_jangada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotacoes_jangada" (
    "id" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotacoes_jangada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especificacoes_tecnicas" (
    "id" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "lotacaoId" TEXT NOT NULL,
    "quantidadeCilindros" INTEGER NOT NULL DEFAULT 1,
    "pesoCO2" DOUBLE PRECISION,
    "pesoN2" DOUBLE PRECISION,
    "volumeCilindro" DOUBLE PRECISION,
    "referenciaCilindro" TEXT,
    "sistemaInsuflacao" TEXT,
    "tiposValvulas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "especificacoes_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudo_packs" (
    "id" TEXT NOT NULL,
    "tipoPackId" TEXT NOT NULL,
    "racoesEmergencia" INTEGER,
    "aguaPotavel" DOUBLE PRECISION,
    "kitPrimeirosSocorros" BOOLEAN NOT NULL DEFAULT false,
    "comprimidosEnjooPorPessoa" INTEGER,
    "sacosEnjooPorPessoa" INTEGER,
    "foguetesParaquedas" INTEGER,
    "fachosMao" INTEGER,
    "sinaisFumo" INTEGER,
    "lanternaEstanque" BOOLEAN NOT NULL DEFAULT false,
    "heliógrafo" BOOLEAN NOT NULL DEFAULT false,
    "apito" BOOLEAN NOT NULL DEFAULT false,
    "faca" BOOLEAN NOT NULL DEFAULT false,
    "esponjas" INTEGER,
    "abreLatas" INTEGER,
    "coposGraduados" INTEGER,
    "mantasTermicas" INTEGER,
    "kitPesca" BOOLEAN NOT NULL DEFAULT false,
    "manualSobrevivencia" BOOLEAN NOT NULL DEFAULT false,
    "tabelaSinais" BOOLEAN NOT NULL DEFAULT false,
    "foleEnchimento" BOOLEAN NOT NULL DEFAULT false,
    "tampoesFuros" BOOLEAN NOT NULL DEFAULT false,
    "kitReparacao" BOOLEAN NOT NULL DEFAULT false,
    "ancorasQuantidade" INTEGER,
    "luzInterna" TEXT,
    "luzExterna" TEXT,
    "bateria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteudo_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sistemas_cilindro" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sistemas_cilindro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_cilindro" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_cilindro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_pack" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_valvula" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_valvula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envios" (
    "id" TEXT NOT NULL,
    "numeroRastreio" TEXT,
    "tipo" TEXT NOT NULL,
    "metodoEnvio" TEXT NOT NULL,
    "transportadora" TEXT,
    "status" TEXT NOT NULL DEFAULT 'preparando',
    "destinatarioNome" TEXT NOT NULL,
    "destinatarioEmail" TEXT,
    "destinatarioTelefone" TEXT,
    "enderecoEntrega" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3),
    "dataEntregaEstimada" TIMESTAMP(3),
    "dataEntregaReal" TIMESTAMP(3),
    "custoEnvio" DOUBLE PRECISION,
    "custoTotal" DOUBLE PRECISION,
    "observacoes" TEXT,
    "responsavel" TEXT NOT NULL DEFAULT 'Julio Correia',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "envios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envio_itens" (
    "id" TEXT NOT NULL,
    "envioId" TEXT NOT NULL,
    "tipoItem" TEXT NOT NULL,
    "stockId" TEXT,
    "jangadaId" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "envio_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nif_key" ON "clientes"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "jangadas_numeroSerie_key" ON "jangadas"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "proprietarios_email_key" ON "proprietarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "proprietarios_nif_key" ON "proprietarios"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_email_key" ON "pessoas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_numero_key" ON "certificados"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "stock_nome_categoria_key" ON "stock"("nome", "categoria");

-- CreateIndex
CREATE UNIQUE INDEX "cilindros_numeroSerie_key" ON "cilindros"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_numero_key" ON "faturas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "partners_email_key" ON "partners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "inspecoes_numero_key" ON "inspecoes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_jangada_nome_key" ON "marcas_jangada"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_jangada_nome_marcaId_key" ON "modelos_jangada"("nome", "marcaId");

-- CreateIndex
CREATE UNIQUE INDEX "lotacoes_jangada_capacidade_key" ON "lotacoes_jangada"("capacidade");

-- CreateIndex
CREATE UNIQUE INDEX "especificacoes_tecnicas_marcaId_modeloId_lotacaoId_key" ON "especificacoes_tecnicas"("marcaId", "modeloId", "lotacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "conteudo_packs_tipoPackId_key" ON "conteudo_packs"("tipoPackId");

-- CreateIndex
CREATE UNIQUE INDEX "sistemas_cilindro_nome_key" ON "sistemas_cilindro"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_cilindro_nome_key" ON "tipos_cilindro"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_pack_nome_key" ON "tipos_pack"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_valvula_nome_key" ON "tipos_valvula"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "envios_numeroRastreio_key" ON "envios"("numeroRastreio");

-- AddForeignKey
ALTER TABLE "navios" ADD CONSTRAINT "navios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navios" ADD CONSTRAINT "navios_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "proprietarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "proprietarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas_jangada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos_jangada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_lotacaoId_fkey" FOREIGN KEY ("lotacaoId") REFERENCES "lotacoes_jangada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jangadas" ADD CONSTRAINT "jangadas_tipoPackId_fkey" FOREIGN KEY ("tipoPackId") REFERENCES "tipos_pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_stock" ADD CONSTRAINT "movimentacoes_stock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilindros" ADD CONSTRAINT "cilindros_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "sistemas_cilindro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilindros" ADD CONSTRAINT "cilindros_tipoCilindroId_fkey" FOREIGN KEY ("tipoCilindroId") REFERENCES "tipos_cilindro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilindros" ADD CONSTRAINT "cilindros_tipoValvulaId_fkey" FOREIGN KEY ("tipoValvulaId") REFERENCES "tipos_valvula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_cilindroId_fkey" FOREIGN KEY ("cilindroId") REFERENCES "cilindros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_cilindroId_fkey" FOREIGN KEY ("cilindroId") REFERENCES "cilindros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_navioId_fkey" FOREIGN KEY ("navioId") REFERENCES "navios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_cilindroId_fkey" FOREIGN KEY ("cilindroId") REFERENCES "cilindros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos_inspecao" ADD CONSTRAINT "custos_inspecao_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_inspecao" ADD CONSTRAINT "historico_inspecao_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecao_componentes" ADD CONSTRAINT "inspecao_componentes_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substituicao_componentes" ADD CONSTRAINT "substituicao_componentes_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos_jangada" ADD CONSTRAINT "modelos_jangada_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas_jangada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especificacoes_tecnicas" ADD CONSTRAINT "especificacoes_tecnicas_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas_jangada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especificacoes_tecnicas" ADD CONSTRAINT "especificacoes_tecnicas_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos_jangada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especificacoes_tecnicas" ADD CONSTRAINT "especificacoes_tecnicas_lotacaoId_fkey" FOREIGN KEY ("lotacaoId") REFERENCES "lotacoes_jangada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudo_packs" ADD CONSTRAINT "conteudo_packs_tipoPackId_fkey" FOREIGN KEY ("tipoPackId") REFERENCES "tipos_pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envio_itens" ADD CONSTRAINT "envio_itens_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "envios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envio_itens" ADD CONSTRAINT "envio_itens_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envio_itens" ADD CONSTRAINT "envio_itens_jangadaId_fkey" FOREIGN KEY ("jangadaId") REFERENCES "jangadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
