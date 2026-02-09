-- Consulta SQL para validar componentes de uma jangada específica
-- Substitua 'NUMERO_SERIE' pelo número desejado

SELECT j.numeroSerie, c.nome, c.quantidade, c.estado, c.validade, c.testeRealizado
FROM jangada j
JOIN inspecaoComponente c ON c.jangadaId = j.id
WHERE j.numeroSerie = 'NUMERO_SERIE';

-- Consulta para listar componentes expirados ou em alerta (< 12 meses)
SELECT j.numeroSerie, c.nome, c.validade, c.estado,
  CASE
    WHEN c.validade < GETDATE() THEN 'EXPIRADO'
    WHEN c.validade < DATEADD(month, 12, GETDATE()) THEN 'ALERTA'
    ELSE 'OK'
  END AS status
FROM jangada j
JOIN inspecaoComponente c ON c.jangadaId = j.id
WHERE j.numeroSerie = 'NUMERO_SERIE';

-- Consulta para validar se todos os componentes estão registrados
SELECT j.numeroSerie, COUNT(c.id) AS total_componentes
FROM jangada j
LEFT JOIN inspecaoComponente c ON c.jangadaId = j.id
GROUP BY j.numeroSerie;