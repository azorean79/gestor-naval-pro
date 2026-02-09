-- LIMPEZA COMPLETA DA BASE DE DADOS
DELETE FROM notificacoes;
DELETE FROM envio_itens;
DELETE FROM envios;
DELETE FROM tarefas;
DELETE FROM obras;
DELETE FROM inspecao_componentes;
DELETE FROM substituicao_componentes;
DELETE FROM historico_inspecao;
DELETE FROM custos_inspecao;
DELETE FROM inspecoes;
DELETE FROM faturas;
DELETE FROM certificados;
DELETE FROM agendamentos;
DELETE FROM jangadas;
DELETE FROM navios;
DELETE FROM clientes;
DELETE FROM stock;
DELETE FROM tipos_pack;
DELETE FROM lotacoes_jangada;
DELETE FROM modelos_jangada;
DELETE FROM marcas_jangada;
DELETE FROM tipos_valvula;
DELETE FROM tipos_cilindro;
DELETE FROM sistemas_cilindro;
DELETE FROM cilindros;
DELETE FROM correspondencias;
DELETE FROM relatorios;
DELETE FROM predictive_maintenance;
DELETE FROM partners;
DELETE FROM pessoas;
DELETE FROM proprietarios;
DELETE FROM especificacoes_tecnicas;
DELETE FROM conteudo_packs;
DELETE FROM movimentacoes_stock;


-- SET session_replication_role = 'origin'; -- Comando PostgreSQL, não suportado em SQL Server

-- Verificar se está limpo
SELECT 'Clientes:' as tabela, COUNT(*) as quantidade FROM clientes
UNION ALL
SELECT 'Navios:', COUNT(*) FROM navios
UNION ALL
SELECT 'Jangadas:', COUNT(*) FROM jangadas
UNION ALL
SELECT 'Stock:', COUNT(*) FROM stock;