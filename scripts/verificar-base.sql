SELECT 'Clientes' as tabela, COUNT(*) as quantidade FROM clientes
UNION ALL
SELECT 'Navios', COUNT(*) FROM navios
UNION ALL
SELECT 'Jangadas', COUNT(*) FROM jangadas
UNION ALL
SELECT 'Stock', COUNT(*) FROM stock;