// Seed data para logística dos Açores
const seedLogisticaData = {
  portos: [
    {
      nome: "Porto de Ponta Delgada",
      ilha: "São Miguel",
      tipo: "comercial",
      coordenadas: "37.7394,-25.6687",
      capacidade: 50,
      servicos: {
        reboque: true,
        reparacao: true,
        abastecimento: true,
        limpeza: true,
        armazenagem: true,
        transporteTerrestre: true
      },
      contacto: "+351 296 284 000",
      status: "ativo"
    },
    {
      nome: "Marina de Ponta Delgada",
      ilha: "São Miguel",
      tipo: "recreativo",
      coordenadas: "37.7389,-25.6667",
      capacidade: 30,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: true,
        armazenagem: false,
        transporteTerrestre: true
      },
      contacto: "+351 296 284 100",
      status: "ativo"
    },
    {
      nome: "Porto de Angra do Heroísmo",
      ilha: "Terceira",
      tipo: "comercial",
      coordenadas: "38.6546,-27.2206",
      capacidade: 35,
      servicos: {
        reboque: true,
        reparacao: true,
        abastecimento: true,
        limpeza: true,
        armazenagem: true,
        transporteTerrestre: true
      },
      contacto: "+351 295 512 000",
      status: "ativo"
    },
    {
      nome: "Porto de Praia da Vitória",
      ilha: "Terceira",
      tipo: "pesca",
      coordenadas: "38.7333,-27.0667",
      capacidade: 25,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: true,
        armazenagem: false,
        transporteTerrestre: false
      },
      contacto: "+351 295 545 000",
      status: "ativo"
    },
    {
      nome: "Porto de Horta",
      ilha: "Faial",
      tipo: "comercial",
      coordenadas: "38.5333,-28.6333",
      capacidade: 20,
      servicos: {
        reboque: true,
        reparacao: true,
        abastecimento: true,
        limpeza: true,
        armazenagem: true,
        transporteTerrestre: true
      },
      contacto: "+351 292 292 000",
      status: "ativo"
    },
    {
      nome: "Porto de Madalena",
      ilha: "Pico",
      tipo: "pesca",
      coordenadas: "38.5167,-28.5333",
      capacidade: 15,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: true,
        armazenagem: false,
        transporteTerrestre: false
      },
      contacto: "+351 292 622 000",
      status: "ativo"
    },
    {
      nome: "Porto de Velas",
      ilha: "São Jorge",
      tipo: "pesca",
      coordenadas: "38.6833,-28.2167",
      capacidade: 12,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: true,
        armazenagem: false,
        transporteTerrestre: false
      },
      contacto: "+351 295 432 000",
      status: "ativo"
    },
    {
      nome: "Porto de Vila do Porto",
      ilha: "Santa Maria",
      tipo: "comercial",
      coordenadas: "36.9667,-25.1333",
      capacidade: 18,
      servicos: {
        reboque: true,
        reparacao: true,
        abastecimento: true,
        limpeza: true,
        armazenagem: true,
        transporteTerrestre: true
      },
      contacto: "+351 296 884 000",
      status: "ativo"
    },
    {
      nome: "Porto de Lajes das Flores",
      ilha: "Flores",
      tipo: "pesca",
      coordenadas: "39.3833,-31.1667",
      capacidade: 10,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: true,
        armazenagem: false,
        transporteTerrestre: false
      },
      contacto: "+351 292 592 000",
      status: "ativo"
    },
    {
      nome: "Porto de Vila do Corvo",
      ilha: "Corvo",
      tipo: "pesca",
      coordenadas: "39.6667,-31.1167",
      capacidade: 8,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: true,
        armazenagem: false,
        transporteTerrestre: false
      },
      contacto: "+351 292 596 000",
      status: "ativo"
    },
    {
      nome: "Porto de Calheta",
      ilha: "São Jorge",
      tipo: "transporte",
      coordenadas: "38.6,-28.0333",
      capacidade: 40,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: false,
        armazenagem: true,
        transporteTerrestre: true
      },
      contacto: "+351 295 416 000",
      status: "ativo"
    },
    {
      nome: "Porto de Graciosa",
      ilha: "Graciosa",
      tipo: "pesca",
      coordenadas: "39.0167,-28.0167",
      capacidade: 14,
      servicos: {
        reboque: true,
        reparacao: false,
        abastecimento: true,
        limpeza: true,
        armazenagem: false,
        transporteTerrestre: false
      },
      contacto: "+351 295 730 000",
      status: "ativo"
    }
  ],

  rotas: [
    // Rotas principais entre ilhas centrais
    {
      origemIlha: "São Miguel",
      destinoIlha: "Terceira",
      distanciaKm: 95,
      tempoEstimadoHoras: 2.5,
      custoBase: 450.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries", "Transmaçor"],
      observacoes: "Rota principal entre as duas maiores ilhas. Serviço diário.",
      status: "ativo"
    },
    {
      origemIlha: "Terceira",
      destinoIlha: "São Miguel",
      distanciaKm: 95,
      tempoEstimadoHoras: 2.5,
      custoBase: 450.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries", "Transmaçor"],
      observacoes: "Rota principal entre as duas maiores ilhas. Serviço diário.",
      status: "ativo"
    },
    {
      origemIlha: "São Miguel",
      destinoIlha: "Santa Maria",
      distanciaKm: 85,
      tempoEstimadoHoras: 2.0,
      custoBase: 280.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota curta entre São Miguel e Santa Maria.",
      status: "ativo"
    },
    {
      origemIlha: "Terceira",
      destinoIlha: "Graciosa",
      distanciaKm: 45,
      tempoEstimadoHoras: 1.5,
      custoBase: 180.00,
      frequencia: "semanal",
      transportadoras: ["Transmaçor"],
      observacoes: "Rota semanal para Graciosa.",
      status: "ativo"
    },
    {
      origemIlha: "São Miguel",
      destinoIlha: "Faial",
      distanciaKm: 220,
      tempoEstimadoHoras: 5.0,
      custoBase: 650.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota para o Triângulo (São Miguel, Terceira, Faial).",
      status: "ativo"
    },
    {
      origemIlha: "Faial",
      destinoIlha: "Pico",
      distanciaKm: 15,
      tempoEstimadoHoras: 0.5,
      custoBase: 85.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota muito curta entre ilhas vizinhas.",
      status: "ativo"
    },
    {
      origemIlha: "Pico",
      destinoIlha: "São Jorge",
      distanciaKm: 35,
      tempoEstimadoHoras: 1.0,
      custoBase: 120.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota entre Pico e São Jorge.",
      status: "ativo"
    },
    {
      origemIlha: "São Miguel",
      destinoIlha: "Flores",
      distanciaKm: 320,
      tempoEstimadoHoras: 8.0,
      custoBase: 950.00,
      frequencia: "semanal",
      transportadoras: ["Flores Express"],
      observacoes: "Rota longa para as Flores. Serviço semanal.",
      status: "ativo"
    },
    {
      origemIlha: "Flores",
      destinoIlha: "Corvo",
      distanciaKm: 25,
      tempoEstimadoHoras: 1.0,
      custoBase: 95.00,
      frequencia: "diaria",
      transportadoras: ["Corvo Ferry"],
      observacoes: "Rota entre Flores e Corvo.",
      status: "ativo"
    },
    // Rotas de retorno
    {
      origemIlha: "Santa Maria",
      destinoIlha: "São Miguel",
      distanciaKm: 85,
      tempoEstimadoHoras: 2.0,
      custoBase: 280.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota de retorno de Santa Maria.",
      status: "ativo"
    },
    {
      origemIlha: "Graciosa",
      destinoIlha: "Terceira",
      distanciaKm: 45,
      tempoEstimadoHoras: 1.5,
      custoBase: 180.00,
      frequencia: "semanal",
      transportadoras: ["Transmaçor"],
      observacoes: "Rota de retorno de Graciosa.",
      status: "ativo"
    },
    {
      origemIlha: "Faial",
      destinoIlha: "São Miguel",
      distanciaKm: 220,
      tempoEstimadoHoras: 5.0,
      custoBase: 650.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota de retorno do Triângulo.",
      status: "ativo"
    },
    {
      origemIlha: "Pico",
      destinoIlha: "Faial",
      distanciaKm: 15,
      tempoEstimadoHoras: 0.5,
      custoBase: 85.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota de retorno entre ilhas vizinhas.",
      status: "ativo"
    },
    {
      origemIlha: "São Jorge",
      destinoIlha: "Pico",
      distanciaKm: 35,
      tempoEstimadoHoras: 1.0,
      custoBase: 120.00,
      frequencia: "diaria",
      transportadoras: ["Atlantic Ferries"],
      observacoes: "Rota de retorno entre Pico e São Jorge.",
      status: "ativo"
    },
    {
      origemIlha: "Flores",
      destinoIlha: "São Miguel",
      distanciaKm: 320,
      tempoEstimadoHoras: 8.0,
      custoBase: 950.00,
      frequencia: "semanal",
      transportadoras: ["Flores Express"],
      observacoes: "Rota de retorno das Flores.",
      status: "ativo"
    },
    {
      origemIlha: "Corvo",
      destinoIlha: "Flores",
      distanciaKm: 25,
      tempoEstimadoHoras: 1.0,
      custoBase: 95.00,
      frequencia: "diaria",
      transportadoras: ["Corvo Ferry"],
      observacoes: "Rota de retorno de Corvo.",
      status: "ativo"
    }
  ]
};

module.exports = { seedLogisticaData };