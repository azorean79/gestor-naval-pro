-- Insere a marca RFD
INSERT INTO "MarcaJangada" (nome, ativo)
VALUES ('RFD', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Recupera o id da marca RFD
-- Substitua <RFD_ID> pelo valor correto do id da marca RFD

-- Insere os modelos MKIV, MKIV Plus e MKIV Compact
INSERT INTO "ModeloJangada" (
  nome, marcaId, sistemaInsuflacao, valvulasPadrao, capacidade, peso, dimensoes,
  acessorios, variantes, certificacoes, instrucoesInspecao, ativo
) VALUES
  ('MKIV', <RFD_ID>, 'LEAFIELD', 'OTS65', 6, 45, '110x60x40cm', 'HRU, kit reparo, luz de emergência', 'SOLAS, COASTAL', 'SOLAS, MED', 'Inspecionar HRU, válvulas, kit reparo, luz', TRUE),
  ('MKIV Plus', <RFD_ID>, 'LEAFIELD', 'OTS65', 8, 52, '120x65x45cm', 'HRU, kit reparo, luz de emergência, kit sobrevivência', 'SOLAS', 'SOLAS', 'Inspecionar HRU, válvulas, kit sobrevivência', TRUE),
  ('MKIV Compact', <RFD_ID>, 'LEAFIELD', 'OTS65', 4, 38, '90x50x35cm', 'HRU, kit reparo', 'COASTAL', 'MED', 'Inspecionar HRU, válvulas, kit reparo', TRUE)
ON CONFLICT (nome, marcaId) DO NOTHING;
