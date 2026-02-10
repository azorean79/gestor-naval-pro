# API Pública - Documentação

Esta API permite integração externa com o sistema Gestor Naval Pro.

## Endpoints principais

### GET /api/navios
Retorna lista de navios.

### GET /api/jangadas
Retorna lista de jangadas.

### GET /api/inspecoes
Retorna lista de inspeções.

### POST /api/navios
Cria novo navio (requer autenticação).

### POST /api/jangadas
Cria nova jangada (requer autenticação).

### POST /api/inspecoes
Cria nova inspeção (requer autenticação).

### PUT /api/navios/:id
Atualiza navio.

### PUT /api/jangadas/:id
Atualiza jangada.

### PUT /api/inspecoes/:id
Atualiza inspeção.

### DELETE /api/navios/:id
Remove navio.

### DELETE /api/jangadas/:id
Remove jangada.

### DELETE /api/inspecoes/:id
Remove inspeção.

## Autenticação
- JWT Bearer Token (Authorization: Bearer <token>)

## Respostas
- JSON padronizado

## Exemplos de uso
```bash
curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/navios
```

## Observações
- Consulte a documentação OpenAPI/Swagger para detalhes de cada campo.
- Permissões de usuário aplicadas conforme perfil.

---

Para dúvidas ou integração avançada, consulte o suporte técnico.
