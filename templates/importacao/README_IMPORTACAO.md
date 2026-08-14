# Templates de Importação

Estes ficheiros CSV servem como base para importação manual de dados.

- `clientes_template.csv`
- `navios_template.csv`
- `jangadas_template.csv`
- `stock_template.csv`
- `inspecoes_template.csv`

## Regras rápidas

- Manter o cabeçalho exatamente igual.
- Datas no formato `YYYY-MM-DD`.
- Separador: `;`.
- Codificação: `UTF-8`.

## Campos mínimos recomendados

- Clientes: `nome`
- Navios: `nome;matricula;ilha;tipoPesca`
- Jangadas: `brand;model;serial;dataFabrico;packType;capacity;owner`
- Stock: `nome;descricao;quantidade;precoVenda`
- Inspeções: `date` + (`shipId` ou `navioNome`) + (`raftId` ou `jangadaSerial`)
