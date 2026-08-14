# Usar um Client ID próprio no rclone (Google Drive)

O rclone usa por omissão um `client_id` partilhado. Em 2026 o Google passou a
limitar fortemente esse client_id partilhado, o que torna os uploads muito
lentos (em alguns casos ~8 minutos para poucos MB). A solução é criar um
`client_id`/`client_secret` próprios e usá-los no rclone.

## 1. Criar o projeto e o Client ID (Google Cloud)

1. Aceda a <https://console.cloud.google.com/apis/credentials> com a conta
   `juliocrc@gmail.com`.
2. Crie um projeto (ou use um existente), ex: `OreyDriveRclone`.
3. No projeto, abra **APIs e serviços → Ecrã de consentimento**:
   - Tipo: **Externo**.
   - Preencha o nome da aplicação (ex: `Orey rclone backup`).
   - No passo "Público-alvo", adicione o seu e-mail como **utilizador de teste**.
   - Não é preciso criar Publicação.
4. Volte a **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicação para computador**.
   - Nome: `rclone-drive`.
   - Copie o **Client ID** e o **Client Secret** gerados.

## 2. Ativar a API do Drive (só se necessário)

Se algo falhar com "access not configured", abra **Biblioteca**, procure
**Google Drive API** e clique em **Ativar**.

## 3. Configurar o rclone com o Client ID próprio

Execute no PowerShell (na pasta da aplicação):

```powershell
# 1. Fechar o token atual e reconfigurar o remote com o client_id próprio
.\bin\rclone.exe config reconnect gdrive: --client-id "<SEU_CLIENT_ID>" --client-secret "<SEU_CLIENT_SECRET>"
```

Ou, se preferir editar diretamente o `%APPDATA%\rclone\rclone.conf`, adicione
duas linhas à secção `[gdrive]`:

```ini
[gdrive]
type = drive
client_id = <SEU_CLIENT_ID>.apps.googleusercontent.com
client_secret = <SEU_CLIENT_SECRET>
scope = drive.file
token = {...}
```

Depois volte a autorizar:

```powershell
.\bin\rclone.exe config reconnect gdrive:
```

## 4. Verificar a velocidade

```powershell
node scripts\sync_gdrive.cjs --push
```

Com um client ID próprio o upload volta a demorar segundos em vez de minutos.
Se usar também a cifragem (item 9), confirme que os remotes `orye_crypt`
continuam a funcionar após a alteração do remote `gdrive`.

## Notas de segurança

- Nunca partilhe o Client Secret nem o token.
- O `client_id` próprio é gratuito; os limites de pedidos por hora são muito
  mais altos do que os do client_id partilhado.
- Para mais detalhes: https://rclone.org/drive/#making-your-own-client-id
