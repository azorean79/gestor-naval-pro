# 📋 Como Importar Spares do MK IV para o Banco de Dados

## Status: ✅ Arquivo SQL Gerado

O arquivo `import-mk4-spares.sql` foi criado automaticamente com 51 inserções de spare parts do MK IV.

### 📊 Dados Extraídos:

- **50 Referências de Fabricante** (Part Numbers): 00220020, 00903111, 00904710, etc.
- **56 Páginas com Imagens** disponíveis do manual PDF
- **Categoria**: SPARE_PARTS_MK_IV
- **Informações por Item**:
  - Referência do fabricante
  - Nome descritivo
  - Página/imagem associada
  - Lote: MK_IV_SPARES
  - Status: ativo

## 🔧 Opções de Importação:

### Opção 1: Via pgAdmin (Recomendado)

1. Acesse seu pgAdmin em [https://pgadmin.prisma-data.net](https://pgadmin.prisma-data.net)
2. Conecte ao seu banco de dados Prisma
3. Abra o **Query Tool**
4. Copie o conteúdo de `import-mk4-spares.sql` e execute
5. Clique em **Execute** ou pressione **F5**

### Opção 2: Via DBeaver ou Outro Cliente SQL

1. Conecte ao banco com suas credenciais PostgreSQL
2. Crie uma nova query
3. Cole o conteúdo do arquivo `import-mk4-spares.sql`
4. Execute (Ctrl+Enter)

### Opção 3: Via CLI (Se psql estiver instalado)

```bash
psql "postgres://seu_usuario:sua_senha@db.prisma.io:5432/seu_banco" -f import-mk4-spares.sql
```

### Opção 4: Via API Endpoint (No servidor)

Se o Back-end estiver rodando, use:

```bash
curl -X POST \
  -H "x-admin-token: seu_token_adminne" \
  http://seu-dominio.com/api/admin/import-mk4-spares
```

## 📁 Arquivos Relacionados:

- **`MK_IV_spares_detailed.json`** - Dados estruturados (50 referências + 56 imagens)
- **`import-mk4-spares.sql`** - Script SQL pronto para executar
- **`scripts/generate-mk4-import-sql.ts`** - Script que gera o SQL
- **`scripts/import-mk4-spares.py`** - Python script para importação direta

## 🐛 Se Houver Erros:

### Erro: "Column not found" ou "Table not found"

- Verifique se a tabela `stock` existe no seu banco
- Verifique a estrutura da tabela com:
  ```sql
  \d stock
  ```

### Erro: "Permission denied"

- Verifique as permissões do seu usuário PostgreSQL
- Pode precisar de permissão para INSERT/UPDATE

### Erro: "Foreign key violation"

- Remova a constraint de chave estrangeira temporariamente
- Execute o import
- Reative a constraint

## ✅ Verificação Após Import

Execute a query para verificar quantos items foram adicionados:

```sql
SELECT COUNT(*) as total, categoria 
FROM stock 
WHERE categoria = 'SPARE_PARTS_MK_IV' 
GROUP BY categoria;
```

Esperamos **50-52 linhas** (dependendo de duplicatas).

## 📝 Notas Importantes:

1. **Imagens**: Os caminhos das imagens apontam para `/api/spares/mk4/page_XXX.png`
   - Você precisa garantir que as páginas do PDF estejam disponíveis nesse endpoint
   - ou modificar o path conforme necessário

2. **Referências Duplicadas**: O SQL usa `ON CONFLICT DO NOTHING`, então se rodar múltiplas vezes não duplicará

3. **Dados Estruturados**: Cada spare tem:
   - refFabricante: Código original do fabricante
   - imagem: URL ou caminho local
   - descricao: Texto descritivo completo

## 🚀 Próximos Passos:

1. ✅ Importar os dados (escolha uma das opções acima)
2. Verificar os dados foram importados corretamente
3. Criar um endpoint `/api/spares/mk4/:page` se as imagens não estiverem disponíveis
4. Atualizar a lista de componentes na UI para incluir esses spares
5. Testar links para as imagens

---

**Criado em**: February 7, 2026
**Última atualização**: Script Python + SQL gerado
