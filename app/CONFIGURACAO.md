# Configuração — chaves e credenciais

O Salus App precisa de duas categorias de credencial, com donos diferentes:

- **Firebase** (`.env.example`): configurado uma vez por quem hospeda o app. Veja o Console do Firebase.
- **Google Drive Client ID** (`VITE_GOOGLE_CLIENT_ID`, abaixo): também configurado uma vez por quem hospeda o app — é o "crachá" que identifica o app perante o Google, não uma chave pessoal de cada usuário.
- **Chave de IA (Gemini, Groq, OpenRouter, Mistral...)**: cadastrada por **cada usuário**, na tela **Ajustes** do próprio app (BYOK — Bring Your Own Key). Não é uma variável de ambiente.

---

## 1. Chave de IA (cada usuário cadastra a própria, em Ajustes)

Não existe uma chave "do app" para IA — cada pessoa que usa o Salus cola a própria chave em **Ajustes → Provedor de IA**, e só ela é usada nas respostas daquela conta. O app funciona normalmente sem nenhuma chave (só o Chat e a extração automática de documentos ficam indisponíveis).

Opções gratuitas, com o link direto que também aparece dentro do app (Ajustes → "Como conseguir uma chave grátis"):

| Provedor | Onde obter | Observação |
|---|---|---|
| **Google Gemini** (recomendado) | https://aistudio.google.com/apikey | Faça login com uma conta Google, clique em "Create API key". Free tier generoso, com suporte a imagem/PDF — ideal para a Caixa de Entrada. |
| **Groq** | https://console.groq.com/keys | Crie uma conta, "Create API Key". Muito rápido, bom para o Chat. |
| **OpenRouter** | https://openrouter.ai/settings/keys | Crie uma conta, "Create Key". Vários modelos gratuitos (sufixo `:free`). |
| **Mistral** | https://console.mistral.ai/api-keys | Crie uma conta, camada gratuita "Experiment" limitada. |

Depois de gerar a chave, cole em **Ajustes → Provedor de IA → Chave da API** e clique em "Testar Conexão" antes de salvar.

---

## 2. Google Drive — Client ID OAuth (configurado uma vez, por quem hospeda o app)

O Salus guarda os documentos originais (PDFs, fotos, áudios) na pasta "Salus App" dentro do **Google Drive de cada usuário**, nunca em um servidor do mantenedor. Para isso funcionar, o app precisa de um **Client ID OAuth 2.0** — um identificador público do próprio app perante o Google (não é segredo, mas também não é uma chave de API comum: não dá para simplesmente copiar de algum outro lugar, precisa ser criado para este app).

Isso é diferente da chave de IA: você configura isso **uma vez**, como variável de ambiente do build (`VITE_GOOGLE_CLIENT_ID`), e vale para todos os usuários — cada um autoriza individualmente através do próprio pop-up de consentimento do Google quando clica em "Conectar Google Drive" em Ajustes.

### Passo a passo no Google Cloud Console

1. Acesse https://console.cloud.google.com/ e crie um projeto (ou reutilize o mesmo projeto do Firebase, se preferir — `.env.example` já usa um projeto Firebase).
2. **Ative a API do Google Drive**: menu "APIs e serviços" → "Biblioteca" → busque "Google Drive API" → **Ativar**.
3. **Configure a tela de consentimento OAuth**: "APIs e serviços" → "Tela de consentimento OAuth".
   - Tipo de usuário: **Externo** (a menos que você use Google Workspace só internamente).
   - Preencha nome do app, e-mail de suporte, logo (opcional).
   - Em "Escopos", adicione `https://www.googleapis.com/auth/drive.file` (o mais restrito — o app só acessa arquivos que ele mesmo cria).
   - Enquanto o app estiver em modo "Teste", só as contas Google que você adicionar em "Usuários de teste" conseguem autorizar (até 100). Para compartilhar com qualquer pessoa, veja "Publicar para o público" logo abaixo.
4. **Crie a credencial**: "APIs e serviços" → "Credenciais" → "+ Criar credenciais" → "ID do cliente OAuth".
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Em "Origens JavaScript autorizadas", adicione as URLs de onde o app roda:
     - `http://localhost:5173` (dev local do Vite)
     - a URL de produção (ex: `https://seu-app.vercel.app`)
   - Não é preciso preencher "URIs de redirecionamento" — o fluxo usado (Google Identity Services / token client) não redireciona, abre um pop-up.
5. Copie o **Client ID** gerado (termina em `.apps.googleusercontent.com`) — **não é o "Client Secret"**, esse não é usado pelo app, já que a autorização acontece inteiramente no navegador.

### Publicar para o público (quando quiser compartilhar além dos usuários de teste)

Enquanto o app está em modo "Teste" no Google Cloud, só quem você adicionar manualmente como "usuário de teste" (até 100 e-mails) consegue conectar o Drive — ideal pra validar com a família antes de divulgar. Quando quiser abrir para qualquer pessoa:

1. Na tela de consentimento OAuth, clique em **"Publicar app"**. Isso tira o app do modo Teste.
2. Como o escopo usado é só `drive.file` (o mais restrito que existe — o app nunca vê o resto do Drive da pessoa, só os arquivos que ele mesmo cria), o Google classifica isso como **escopo não-sensível**. Na prática isso significa: você **não precisa passar pelo processo pesado de verificação de segurança** (o que exige vídeo demonstrativo, revisão manual, e é reservado para escopos sensíveis/restritos como acesso total ao Drive, Gmail, etc.).
3. Ainda assim, o Google pode pedir uma verificação básica de identidade do desenvolvedor (confirmar domínio, e-mail de contato) — mais rápido que a revisão completa, mas conte alguns dias de antecedência antes de divulgar amplamente.
4. Até a publicação ser aprovada, usuários fora da lista de teste veem uma tela de aviso do Google ("app não verificado") com um link para prosseguir mesmo assim — funciona, mas assusta quem não te conhece. Vale planejar esse prazo antes do lançamento público.

Enquanto isso não acontece, você pode ir liberando por e-mail (adicionando cada novo usuário como "usuário de teste") sem custo nenhum e sem esperar aprovação nenhuma — é a forma mais rápida de validar o produto antes de investir tempo na publicação.

### Onde colocar

Em `app/.env.local` (copie de `.env.example`):

```
VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID_AQUI.apps.googleusercontent.com
```

Sem essa variável, a seção "Google Drive" em Ajustes mostra um aviso explicando que a integração não está configurada, e o botão "Conectar Google Drive" fica desabilitado — o resto do app continua funcionando normalmente pelo caminho manual.

### Por que não existe um campo para colar um "token" manualmente

Uma versão anterior desta tela tinha um campo de texto para colar um "Token OAuth / Refresh Token" à mão — isso nunca funcionou de verdade: um Client ID não é um token de acesso, e não havia nenhum fluxo de autorização implementado por trás do campo. A versão atual substitui isso por um botão que abre o pop-up de consentimento real do Google (via Google Identity Services), obtém um token de acesso de curta duração (~1h) e o mantém só em memória durante a sessão — nunca gravado em `localStorage` ou no Firestore. Como o app não tem um servidor próprio (é 100% client-side), não há troca de código por um `refresh_token` de longa duração; ao recarregar a página, o app tenta renovar o acesso silenciosamente e, se não conseguir, pede para reconectar.
