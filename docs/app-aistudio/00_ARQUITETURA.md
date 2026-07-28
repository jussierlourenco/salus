# Salus App — Arquitetura & Plano de Construção no Google AI Studio

> Documento-índice. Leia este primeiro, depois use:
> - `01_SYSTEM_INSTRUCTIONS.md` → colar em **Settings → System Instructions** do app no AI Studio
> - `02_PROMPTS.md` → sequência de prompts (P0…P18) para colar no chat do Build, um por vez

**Versão do plano:** 1.0 · **Data:** 2026-07-24 · **Base:** Salus v0.3.0

---

## 1. O que estamos construindo

O Salus hoje é um **framework de arquivos** (`.md` + `_index.yaml` + skills) que só funciona se a pessoa souber usar uma IA com acesso ao disco. Isso trava a adoção em ~1% do público que o Salus serviria bem.

O **Salus App** é a mesma mecânica, com três diferenças:

| | Salus (framework) | Salus App |
|---|---|---|
| Onde vivem os dados | pasta local `.md` | dado clínico estruturado no Firestore (isolado por conta); **arquivos originais (PDF/foto/áudio) no Google Drive do próprio usuário** — você nunca guarda o arquivo em si |
| Quem executa as skills | a IA do usuário (Claude/Gemini/Cursor) | o próprio app, chamando o provedor de IA que o usuário escolher, com a **chave dele** — inclusive **sem nenhuma IA**, se ele preferir cadastrar tudo à mão |
| Quem paga o uso de IA | quem já paga a assinatura do Claude/Gemini/Cursor | **cada usuário**, com a própria chave e cota — nunca você; e é opcional |
| Interface | chat livre no editor/IDE | telas + chat |
| Instalação | Node.js + `npx salus-ai init` | abrir uma URL, entrar com Google |

**Por que essa mudança em relação à v1 deste plano:** a primeira versão deste documento propunha tudo local no navegador (IndexedDB), sem login, o que resolvia privacidade mas tinha duas consequências que você não quer: (1) sem conta, não dá para o mesmo usuário acessar seus dados de dois aparelhos; e principalmente (2) ao compartilhar o app, **toda chamada de IA sairia da sua cota**, porque a chave ficava no servidor como secret do seu projeto. A versão atual resolve os dois com **Firebase Authentication** (login) + **Firestore isolado por usuário** (cada um só enxerga o próprio banco) + **BYOK — Bring Your Own Key** (cada usuário cola a própria chave nos Ajustes; é ela que é usada, nunca a sua).

**Por que os arquivos foram para o Google Drive do usuário (v3 deste plano):** guardar PDFs, fotos e áudios de exame é o item de custo e de responsabilidade mais pesado do projeto — e você deixou claro que não quer ser o guardião desses arquivos, mesmo o app sendo gratuito. A solução é usar a API do Google Drive com o escopo mais restrito que existe (`drive.file`: o app só enxerga os arquivos que ele mesmo criou, nunca o Drive inteiro da pessoa) e um **consentimento único** — não a cada processamento. Tecnicamente isso usa o modo de acesso "offline" do Google: no primeiro uso, o usuário autoriza uma vez, e o Google devolve um crachá renovável (`refresh_token`) que o servidor guarda com a mesma proteção que já dá à chave de IA (documento privado da conta, só ela lê). Esse crachá é usado, de forma silenciosa, sempre que o app precisa ler ou gravar um arquivo — sem pedir de novo. O que muda de responsabilidade: você deixa de guardar o **conteúdo** (o exame, a foto, o áudio) e passa a guardar só uma **credencial de acesso** pequena — categoria de risco bem menor, do mesmo tamanho da chave de API que você já ia guardar.

**Por que a IA virou opcional e plugável (v4 deste plano):** você quer que o app seja útil de verdade para quem nunca cadastra chave nenhuma — a IA precisa ser um facilitador que o usuário *escolhe* adotar, não um requisito para o app funcionar. Duas decisões seguem disso: (1) **todo CRUD manual continua existindo e sendo o caminho principal** — Ficha, Medicamentos, Exames, Histórico e a Caixa de Entrada funcionam por preenchimento manual, com ou sem IA; só o Chat e a extração automática de documentos dependem de uma chave; (2) **BYOK deixa de ser só Gemini** — o usuário escolhe entre alguns provedores com opções gratuitas (Google Gemini, Groq, OpenRouter, Mistral) ou cola a chave de qualquer serviço compatível com a API de Chat Completions da OpenAI. Isso é tecnicamente viável porque a maioria dos provedores de IA hoje fala esse mesmo "dialeto" de API — um único adaptador genérico no servidor cobre todos eles, sem precisar codar um conector por provedor. Ver §3.1.

**O que NÃO muda (e é inegociável):** o núcleo clínico, o consentimento antes de gravar, o índice como fonte de verdade, o vínculo biológico governando cruzamento genético, e a não-mistura de espécies.

**Compatibilidade bidirecional:** o app exporta um `.zip` com exatamente a árvore de pastas do repositório Salus (`Perfis/`, `Familia/_index.yaml`, etc.) e importa esse mesmo `.zip`. Quem já usa o framework migra para o app e vice-versa. Isso não é um extra — é o que impede o app de virar um produto paralelo e fragmentar o projeto.

---

## 2. Restrições reais da plataforma (verificadas em jul/2026)

Estas restrições moldaram todas as decisões abaixo. Fonte: documentação oficial do Build mode.

1. **O app gerado é full-stack:** frontend React (padrão) + runtime Node.js server-side. Não é só client-side.
2. **O AI Studio provisiona Firebase automaticamente** quando você pede: Firestore (banco de dados), Firebase Authentication (login, incluindo "Entrar com Google") e o agente já escreve o código de integração. Isso é o que torna o modelo multi-tenant viável sem sair da plataforma.
3. **Google Workspace/Drive é uma integração suportada:** a documentação do Build mode lista explicitamente "conectar seu app a APIs do Google Workspace como Gmail, Sheets, Docs, **Drive**, Calendar" com o AI Studio cuidando da configuração de OAuth. É o que viabiliza guardar os arquivos no Drive do usuário sem sair da plataforma. **Não usamos Firebase Storage neste plano** — os arquivos originais vivem no Drive, não no seu projeto Firebase.
4. **A chave de IA deixa de ser um secret fixo do projeto — e deixa de ser só do Gemini.** Em vez de vir de uma variável de ambiente sua, cada usuário escolhe um provedor (Gemini, Groq, OpenRouter, Mistral ou outro compatível com OpenAI) e fornece a própria chave, guardada isolada no documento dele no Firestore. O servidor continua sendo o único lugar que fala com qualquer provedor de IA (nenhum SDK no cliente), mas usa a chave e o provedor que vieram daquela requisição, nunca um seu. Ver §3.1.
5. **Ao compartilhar o app, o custo de IA passa a ser do usuário**, não seu — desde que o BYOK esteja implementado corretamente (é o que os prompts de auditoria em P12 verificam). O que continua sob sua conta é o uso de Firestore/Auth do seu projeto Firebase (dado leve, textual) — sem Storage, a fatia mais cara já não existe (ver §7).
6. **GitHub:** dá para criar repo e commitar; **não dá para puxar mudanças remotas**. O fluxo é AI Studio → GitHub, nunca o inverso (exceto o import inicial).
7. **Microfone/câmera exigem declaração em `metadata.json`** (`requestFramePermissions`). Necessário para gravar áudio de orientação médica.
8. **O agente tende a jogar tudo em um `App.tsx` gigante.** Isso é uma limitação conhecida e é a razão principal do documento de System Instructions existir.
9. **O preview atualiza só ao fim de cada turno do agente** — por isso os prompts são fatiados por entregável verificável, não por arquivo.

---

## 3. Decisão central: cada usuário, sua conta, seus dados, seus arquivos, sua cota

**Regra tripla:**
1. **Isolamento de dado estruturado por usuário:** Firebase Authentication (login com Google) identifica cada usuário; o Firestore guarda os dados clínicos estruturados (exames, medicamentos, eventos — tudo textual/numérico, leve) sob o próprio `uid`, e **regras de segurança no banco** (não só código do app) impedem qualquer usuário de ler ou escrever dado de outro.
2. **Arquivos originais no Google Drive do próprio usuário, não no seu projeto:** PDFs, fotos e áudios nunca ficam no Firebase. Vivem numa pasta "Salus App" dentro do Drive de cada pessoa, com consentimento único (OAuth com escopo `drive.file`, o mais restrito que existe) concedido durante o onboarding. O Firestore guarda só o metadado (nome, tipo, membro, id do arquivo no Drive) — nunca o conteúdo.
3. **BYOK, com provedor à escolha (opcional):** cada usuário pode cadastrar a própria chave de um provedor de IA (Gemini, Groq, OpenRouter, Mistral ou outro) na tela de Ajustes. O servidor continua sendo o único lugar que fala com qualquer provedor — usa a chave e o provedor que vieram na requisição daquele usuário. **Sem chave cadastrada, o app funciona normalmente pelo caminho manual** (§3.2); só o Chat e a extração automática ficam indisponíveis, com uma explicação clara.

```
[Navegador do usuário]                   [Servidor Node do AI Studio]         [API do provedor de IA / Drive API]
Login (Firebase Auth) ─────► uid
Consentimento único de Drive
  (drive.file, acesso offline) ──────────► troca o código por um
                                              refresh_token e guarda em
                                              /usuarios/{uid}/perfil,
                                              protegido igual à chave de IA
Firestore: dado clínico estruturado,
  isolado por regra: só o dono do uid
  lê/escreve
   │
   ├─ envia arquivo (upload) ──────────────► usa o refresh_token (silencioso,      grava no Drive
   │                                            sem novo consentimento) para          DO USUÁRIO,
   │                                            obter um token de acesso curto        não no seu
   │                                                                                    projeto
   ├─ (opcional) token de login + provedor ►  verifica o token (uid) ───────────► chamada usa a
   │   e chave de IA do PRÓPRIO usuário +      monta o prompt + Núcleo Clínico    CHAVE E PROVEDOR
   │   snapshot do índice (dele, só dele)      usa a chave/provedor recebidos,    DO USUÁRIO
   │                                            descarta tudo ao responder
   ◄──── proposta em JSON estruturado ─────────────────────────────────────────────┘
   │      (ou preenchida manualmente, sem IA nenhuma)
   └─ usuário CONFIRMA → grava metadado no Firestore (dele, isolado); arquivo já está no Drive dele
```

> **Sobre acesso compartilhado (ex: cônjuge vendo a mesma família):** avaliamos um modelo de "família com múltiplos acessos" (login separado por pessoa, mesmos dados) e decidimos **não** incluir isso no MVP — aumentava a superfície de regras de segurança e de fluxos de convite antes de o essencial estar validado. Por enquanto, uma conta = uma central de saúde completa. Fica registrado como item de v2 no backlog de `02_PROMPTS.md`, para revisitar com calma quando o resto estiver estável.

**O que muda de responsabilidade em relação ao modelo anterior deste plano:** os dados clínicos estruturados (não os arquivos) continuam residindo no seu projeto Firebase. Isso tem uma implicação honesta que vale registrar: **você, como dono do projeto Firebase, tem acesso técnico de administrador ao Firestore** (via console do Firebase/Google Cloud), independentemente das regras de segurança — elas bloqueiam o *aplicativo*, não um administrador do projeto. Os arquivos em si, por estarem no Drive do próprio usuário, **não são acessíveis a você em nenhuma hipótese** — nem tecnicamente, já que você nunca tem a chave privada da conta Google dela. Isso reduz a superfície de exposição de forma real, não só documental.

Três consequências práticas dessa honestidade:

- **Perante a LGPD, você continua sendo operador da infraestrutura** que guarda o dado estruturado (não os arquivos) de saúde de terceiros (art. 5º, II), mesmo não sendo mais quem paga o processamento de IA nem quem guarda os documentos. Isso pede política de privacidade clara (P13), regras de segurança testadas (P0/P12) e, idealmente, nunca abrir o console do Firebase para navegar em dados de usuários reais por curiosidade.
- **Isso é registrado explicitamente na tela de privacidade do app** (P13): "os dados estruturados da sua central de saúde ficam no banco do Salus App, protegidos por login; seus documentos originais (PDFs, fotos, áudios) ficam no seu próprio Google Drive, numa pasta que só o Salus App acessa; o mantenedor do app não vê nem armazena esses arquivos em nenhum momento."
- **Criptografia ponta-a-ponta client-side** para o dado estruturado que resta no Firestore resolveria a parte que ainda sobra por completo, mas é complexidade real — fica marcada como item de v2 em §9, não bloqueia o MVP.

**O que inevitavelmente transita para fora do Drive do usuário:** quando ele pede para a IA processar um documento, o arquivo é buscado no Drive dele e enviado ao servidor do AI Studio, que repassa para a API do provedor de IA escolhido **usando a chave daquele usuário**, e descarta tudo ao responder (nunca fica em repouso em nenhum lugar seu). Isso também precisa estar escrito com clareza na tela de privacidade.

### 3.1 Provedor de IA plugável — não só Gemini

O servidor nunca fala com "o Gemini". Ele fala com "a interface de IA", e por trás dela existem dois adaptadores:

1. **Adaptador nativo Gemini** (`@google/genai`) — melhor qualidade multimodal (imagem, PDF, áudio num único modelo) e o free tier mais generoso hoje para esse combo. Continua sendo o padrão sugerido no onboarding.
2. **Adaptador genérico "compatível com OpenAI"** — um único cliente HTTP que fala o formato de Chat Completions da OpenAI (`POST {url_base}/chat/completions`, corpo com `messages`, chave no header `Authorization: Bearer`). Esse formato virou um padrão de fato: **Groq, OpenRouter, Mistral e o próprio OpenAI** o implementam, então um adaptador serve para todos — o usuário só troca a URL base, o nome do modelo e a chave.

Isso significa que adicionar um novo provedor no futuro é, na prática, adicionar uma linha numa lista de presets — não escrever código novo.

**Presets sugeridos na tela de Ajustes** (checados em jul/2026, sujeitos a mudança — o app deve exibir "confira o valor atual no site do provedor"):

| Preset | Grátis? | Multimodal | Observação |
|---|---|---|---|
| **Google Gemini** (recomendado) | Sim, free tier generoso | Imagem, PDF, áudio, vídeo | Melhor opção para quem quer usar a Caixa de Entrada (extração de exames/receitas) sem gastar nada |
| **OpenRouter** | Sim, ~200 requisições/dia, sem cartão | Vários modelos `:free` com imagem (alguns com áudio/vídeo) | Bom segundo caminho gratuito; o modelo específico da lista gratuita muda com frequência |
| **Groq** | Sim, free tier | Principalmente texto; alguns modelos com visão | Muito rápido; útil sobretudo para o Chat, com ou sem visão dependendo do modelo escolhido |
| **Mistral (La Plateforme)** | Camada "Experiment" gratuita, limitada | Principalmente texto | Boa opção adicional; menos indicada se o uso principal for extrair dados de imagem/PDF |
| **Personalizado (compatível com OpenAI)** | Depende do provedor | Depende do provedor | Campo livre de URL base + modelo + chave, para qualquer serviço não listado, incluindo o próprio OpenAI (pago) |

Cada preset carrega metadados de capacidade (`suporta_imagem`, `suporta_audio`, `suporta_pdf`). Se o usuário escolher um provedor sem suporte a imagem/PDF, a Caixa de Entrada avisa e sugere o caminho manual em vez de tentar uma extração que vai falhar — nunca falha silenciosamente.

### 3.2 App útil sem nenhuma IA

Este é um princípio de produto (regra 9 do Núcleo, em `01_SYSTEM_INSTRUCTIONS.md`), não só uma opção de configuração: **o Salus App precisa valer a pena mesmo para quem nunca cadastra chave nenhuma.**

- Onboarding nunca pede chave de IA para concluir (só pede, opcionalmente, para conectar o Drive — e isso também pode ser pulado).
- Ficha, Medicamentos, Exames e Histórico (P6) sempre foram formulários de edição direta — isso não muda.
- Caixa de Entrada sem IA: o usuário sobe o arquivo (se tiver conectado o Drive) e, em vez de "Organizar documentos" (que exige IA), usa "Preencher manualmente" — o mesmo `PainelDeProposta` se abre vazio, pronto para digitação, e ao confirmar passa pelo mesmíssimo `aplicarProposta()` das extrações por IA. Um usuário sem IA nenhuma tem, na prática, o mesmo poder de registro que um com IA — só sem o atalho de não digitar.
- O Painel, a Agenda, o cálculo de vencidos/vencendo — tudo 100% local, nunca dependeu de IA.
- Só duas coisas exigem chave: o **Chat** em linguagem natural e a **extração automática** de documentos. Ambas mostram, de forma calma (nunca como erro), o caminho para cadastrar uma chave em vez de simplesmente sumir ou travar.
- **Convite, não pressão:** em vez de bloquear ou insistir, o app aponta o benefício no momento certo — por exemplo, depois de a pessoa preencher manualmente um exame pela terceira vez, um cartão discreto no Painel: "Cadastrar uma chave de IA deixa isso mais rápido: você tira uma foto e o app preenche os campos pra você conferir. Tem opções gratuitas." Isso é descoberta orgânica, não um paywall disfarçado.

---

## 4. Modelo de dados (o `_index.yaml` virando schema multi-tenant)

O `Familia/_index.yaml` já era um schema disfarçado de YAML. No app ele vira TypeScript + coleções do Firestore, **aninhadas sob `/familias/{familiaId}`** com suporte a compartilhamento entre usuários via `membros_uids` e `compartilhado_com_uids`. Nomes de campo **preservados em português**, iguais ao framework, para o export/import ser trivial.

**Schema atual (implementado em app/src):**
```
/familias/{familiaId}/config               ← doc singleton: onboarding_concluido, consentimentos, etc
/familias/{familiaId}/membros/{membroId}   ← inclui campo compartilhado_com_uids para acesso compartilhado
/familias/{familiaId}/medicamentos/{id}
/familias/{familiaId}/precos_medicamentos/{id} ← observações financeiras append-only extraídas de notas
/familias/{familiaId}/vacinas/{id}
/familias/{familiaId}/eventos/{id}
/familias/{familiaId}/exames/{id}
/familias/{familiaId}/caixa_entrada/{id}   ← metadados; o arquivo em si vive no Google Drive do usuário
```

**Migração legada**: usuários com dados antigos em `/usuarios/{uid}/...` são automaticamente migrados para `/familias/{familiaId}` via `migrarDadosLegados()` em `repositorioFamilias.ts`. O acesso é centralizado: `garantirFamiliaDoUsuario(uid)` cria ou recupera a família daquele usuário. Collection-group queries permitem descoberta de membros compartilhados entre famílias.

**Onde ficam os arquivos:** o runtime atual guarda o binário no IndexedDB do navegador de quem enviou; o Firestore recebe apenas metadados, `storage_owner_uid` e os dados extraídos. Em documentos de membros compartilhados, todos os autorizados veem o registro estruturado, mas o original permanece disponível somente ao remetente até a integração de armazenamento remoto compartilhável.

**Regra de segurança do Firestore:** membros da família têm acesso às subcoleções. Um convidado listado em `compartilhado_com_uids` acessa somente registros cujo `membro_id` aponte para aquele membro. Em `caixa_entrada`, o convidado só cria documentos com seu próprio `criado_por_uid` e só atualiza documentos que ele criou. O histórico de preços é append-only: clientes podem criar observações válidas, mas não atualizar nem excluir registros.

| Coleção | Campos principais |
|---|---|
| `membros` | `nome`, `tipo` (`pessoa`\|`cao`\|`gato`\|`outro`), `nascimento`, `vinculo` (`biologico`\|`adotivo`\|`enteado`), `condicoes_ativas[]`, `alergias[]`, `tipo_sanguineo`, `relacoes[]` |
| `medicamentos` | `membro_id`, `nome`, `dose`, `frequencia`, `status` (`em_uso`\|`prescrito`\|`descontinuado`), `desde`, `renova_em`, `prescrito_por` |
| `precos_medicamentos` | `membro_id`, `medicamento_id?`, `nome_medicamento`, `apresentacao`, `quantidade`, `valor_unitario`, `valor_total`, `moeda`, `comprado_em`, `estabelecimento`, `documento_id`, `criado_por_uid` |
| `vacinas` | `membro_id`, `nome`, `aplicada_em`, `proxima_em` |
| `checkups` | `membro_id`, `tipo`, `data` |
| `exames` | `membro_id`, `data`, `painel`, `marcador`, `valor`, `unidade`, `faixa_referencia_laudo`, `flag` (`normal`\|`alto`\|`baixo`\|`nao_informado`), `documento_id` |
| `eventos` | `membro_id`, `data`, `tipo`, `descricao` |
| `caixa_entrada` | `nome_arquivo`, `mime_type`, `status`, `membro_id`, `criado_por_uid`, `storage_owner_uid`, `storage_id`, `storage_tipo`, `proposta` |
| `analises` | `membro_id`, `titulo`, `criado_em`, `tipo`, `fontes[]`, `dados[]`, `conclusao` |
| `perfil/config` | `onboarding_concluido`, `consentimentos`, `provedor_ia` (objeto, só o dono lê — ver abaixo), `drive_refresh_token` (string, só o dono lê), `drive_pasta_raiz_id`, `ultima_revisao`, `proxima_revisao`, `ultimo_export` |

**Sobre `drive_refresh_token`:** é uma credencial, não um dado de saúde — mas ainda assim sensível (dá acesso à pasta do Drive do usuário). Protegida pela mesma regra de segurança do Firestore acima, nunca enviada ao cliente depois de criada (o cliente só dispara o fluxo de consentimento inicial; a troca do código pelo `refresh_token` acontece só no servidor). Se o usuário revogar o acesso pelas configurações da própria conta Google, o app detecta a falha na próxima chamada e pede para reconectar — sem perder nenhum dado, já que os arquivos continuam no Drive dela.

**Três campos merecem atenção especial:**

- **`vinculo`** — nunca é exibido na Ficha do membro (privacidade), só governa o cruzamento genético. Vive no índice e numa tela de configuração discreta.
- **`faixa_referencia_laudo`** — string livre copiada do laudo, **nunca** um valor calculado ou memorizado. O app não tem tabela de "valores normais". Se o laudo não trouxe a faixa, o campo fica vazio e a UI mostra "faixa não informada no laudo" — não inventa.
- **`provedor_ia`** — `{ tipo: 'gemini'|'openai_compat', url_base?, modelo, chave }`. A chave de API pessoal do usuário, de qualquer provedor escolhido. Protegida pela mesma regra de segurança (só o dono do `uid` lê o próprio documento), mas fica em texto simples no Firestore, não cifrada — isso é aceitável para o MVP porque a proteção é a regra de acesso, e é o mesmo padrão que a maioria dos apps BYOK usa; ainda assim, deixe isso explícito na tela de Ajustes ("sua chave fica guardada na sua conta, protegida por login") em vez de dar a entender que é criptografada. Se `provedor_ia` não existir, todos os recursos de IA ficam desligados e o app funciona normalmente pelo caminho manual (§3.2).

---

## 5. Telas do MVP

| # | Tela | O que resolve | Skill Salus equivalente |
|---|---|---|---|
| 0 | **Login** | entrar com Google (Firebase Auth); porta de entrada obrigatória | — (novo, exigido pelo isolamento por usuário) |
| 1 | **Onboarding** (wizard 5 passos) | consentimento → **conectar Google Drive (uma vez)** → membros → relações → primeiros documentos | `salus-onboarding` |
| 2 | **Painel** (home) | o raio-x visual: vencidos, vencendo em 30d, medicamentos ativos, condições | `raio-x` + `Agenda.md` |
| 3 | **Caixa de Entrada** | arrastar PDF/foto/áudio → extração → proposta → confirmar | `salus-organiza` |
| 4 | **Perfil do membro** | abas Ficha · Medicamentos · Exames · Histórico · Documentos | os arquivos de `Perfis/[Nome]/` |
| 5 | **Chat** | perguntar em linguagem natural, com propostas de registro inline | `registrar` + consulta geral |
| 6 | **Ajustes** | **escolher provedor de IA e cadastrar a própria chave** (opcional), exportar/importar `.zip`, privacidade, apagar conta | — |
| 7 | **Tutorial** | explicar visualmente o funcionamento do app em uma rota HTML interna (`/tutorial`); páginas otimizadas e pré-armazenadas pelo PWA | — |

**Fora do MVP (v2):** `cruzar` com gráficos de evolução, `preparar-consulta` com PDF imprimível, `salus-revisao` periódica, árvore genealógica visual, PWA offline, acesso compartilhado por família (mais de uma conta vendo os mesmos dados).

### Componente que define o produto: `<PainelDeProposta>` — **v2 Backlog**

⚠️ **STATUS**: Componente criado em `core/ui/PainelDeProposta.tsx` mas **não integrado em nenhuma tela** (auditoria 2026-07-26). A Caixa de Entrada ainda não dispara o fluxo upload→extração→proposta→aplicação.

**Premissa original**: Toda saída da IA que toca em dados vira um objeto `Proposta` — nunca uma gravação direta. O painel mostra, por campo: **valor atual → valor novo**, com botões `Confirmar` · `Editar` · `Descartar`. Só `Confirmar` chama o repositório.

Isso não é detalhe de UI: é a tradução literal de "o Salus nunca grava sem perguntar". Quando implementado, será crítico para confiabilidade. Deixado para v2 para priorizar BYOK + schema-migration en esta rodada.

**Para implementar (v2)**: conectar `CaixaDeEntrada` → `PainelDeProposta` → `aplicarProposta()`.

### Linguagem visual

- Paleta calma: base slate/neutra, acento **teal**, alertas em **âmbar**. Vermelho apenas para "vencido", em tom sóbrio — coerente com a regra "nunca amplifica alarme". Nada de badges vermelhos piscando em exame alterado.
- Tipografia grande, alvos de toque ≥44px: o usuário-alvo inclui gente cuidando de pai/mãe idosos.
- Português do Brasil, sem jargão. "Exame alterado segundo o laboratório", não "biomarcador fora do range".

---

## 6. Administração: separar o seu uso de desenvolvedor do uso dos usuários finais

Duas coisas diferentes acontecem quando você trabalha no AI Studio, e vale distingui-las com clareza:

1. **Construir/alterar o app** acontece no chat do **Build mode**, conversando com o Gemini sobre código — é o que os prompts em `02_PROMPTS.md` fazem. Isso não tem relação nenhuma com estar logado dentro do app; é uma conversa sobre o código-fonte, fora do runtime que os usuários finais usam. Você já pode pedir correções e ajustes assim, sem nada adicional.
2. **Usar o app já rodando** (o preview à direita, ou a URL publicada) exige login como qualquer usuário. Quando você entra ali com sua conta Google pessoal, o app, por padrão, **não sabe que é você o dono do projeto** — ele te trata como mais um usuário comum, com dados isolados em `/usuarios/{seu-uid}/`, do mesmo jeito que qualquer pessoa teria. Isso é correto e não deve mudar: sua conta de teste continua sendo uma conta comum, sujeita às mesmas regras de isolamento.

O que faltava — e que o **P16** dos prompts implementa — é uma terceira coisa: uma **tela de administração dentro do app**, visível só para você, para acompanhar a saúde do produto (quantas contas existem, quantas conectaram o Drive) sem precisar abrir o console do Firebase. O desenho:

- **Lista de e-mails administradores guardada como secret do servidor** (nas Settings do AI Studio), nunca em coleção do Firestore editável pelo cliente e nunca no código versionado. O servidor confere o e-mail do seu login a cada chamada à rota de administração.
- **Rota `/admin`** só aparece na barra lateral, e só responde, para quem está nessa lista — verificado no servidor, não por uma flag guardada no navegador (que qualquer um poderia forjar).
- **O que o painel mostra:** número total de contas, quantas foram criadas nos últimos 30 dias, quantas têm o Drive conectado, e a versão do app. **O que ele nunca mostra:** nome, e-mail, ou qualquer dado clínico de qualquer conta que não seja a sua — e, claro, nenhum arquivo, já que eles nem estão no seu projeto. O painel é sobre a saúde do *produto*, não sobre a saúde das famílias que o usam — misturar os dois quebraria a própria promessa de isolamento construída em P0.

Esse desenho é deliberadamente mais restrito do que "ver a lista de quem usa o app": mesmo e-mail de usuário é dado pessoal, e o objetivo aqui é te dar visão operacional mínima, não uma porta de acesso a mais sobre os dados das pessoas.

---

## 7. Roteiro de construção (resumo de `02_PROMPTS.md`)

| Fase | Prompts | Entregável verificável |
|---|---|---|
| **0. Login e isolamento** | P0 | Firebase Auth funcionando, regras de segurança testadas, ninguém lê dado de outro `uid` |
| **1. Fundação** | P1–P3 | esqueleto navegável, tipos + repositórios Firestore, rota `/api/chat` usando a chave do usuário logado |
| **2. Entrada de dados** | P4, P4.5, P5–P6 | onboarding funcional (com Drive conectável), painel com alertas reais, perfil do membro |
| **3. O motor** | P7–P9 | upload (Google Drive do usuário) → extração com IA (BYOK) → proposta → confirmação grava no banco |
| **4. Provedor plugável e modo manual** | P17–P18 | app funciona sem IA nenhuma; quando há chave, funciona com Gemini ou qualquer provedor compatível com OpenAI — ver §3.1/§3.2 |
| **5. Conversa** | P10 | chat com contexto do índice e ações propostas |
| **6. Ponte com o framework** | P11 | export/import `.zip` compatível com o repositório Salus |
| **7. Acabamento** | P12–P14 | auditoria de isolamento/BYOK/Drive/provedores, estados vazios, erros, privacidade, QA |
| **8. Publicação** | P15 | share + Cloud Run + commit no GitHub |
| **9. Administração** | P16 | painel `/admin` restrito, só métricas agregadas — ver §6 |

Regra de ouro do processo: **um prompt = um entregável testável**. Depois de cada prompt, abra o preview e cheque o critério de aceite antes de seguir. Se você emendar três prompts sem verificar, vai gastar mais tempo desfazendo do que ganhou.

---

## 7.1 Status de implementação — auditoria de 2026-07-25 (atualizado)

Uma auditoria arquitetural do código em `app/src` contra este documento encontrou o app **100% client-side** (Vite + React + Firebase JS SDK direto no navegador, sem servidor/API própria) — o que diverge da premissa de §2.1 e §3.1 ("o servidor é o único lugar que fala com qualquer provedor de IA"). Isso não foi resolvido nesta rodada (exigiria criar um backend do zero); as correções abaixo foram feitas trabalhando dentro dessa realidade client-side, não contra ela.

| Regra do documento | Status real | Observação |
|---|---|---|
| Isolamento por `uid` no modelo de dados | OK | Todos os repositórios em `app/src/modulos/*/casos-de-uso` e `app/src/core/database/repositorio.ts` escrevem só sob `usuarios/{uid}/...` |
| Regras de segurança do Firestore (§4) | **Corrigido** | `app/firestore.rules` criado, espelhando a regra do §4. Falta associar o projeto (`firebase use <project-id>`) e rodar `firebase deploy --only firestore:rules` — não há acesso ao console/CLI do Firebase a partir daqui |
| IA chamada só pelo servidor (§3.1) | **Violação conhecida, mantida** | `core/ia/gemini.ts` e `core/ia/openaiCompat.ts` chamam a API do provedor direto do navegador; a chave do usuário roda no cliente. Corrigir exige um backend real (ex.: rotas serverless na Vercel) — fora do escopo das rodadas até aqui |
| Credencial do Drive nunca em repouso no cliente (§4) | **Corrigido, com desenho revisado** | Não existe mais `drive_refresh_token` armazenado (nem em Firestore, nem em `localStorage`). A conexão usa Google Identity Services direto no navegador (`core/storage/googleAuth.ts`): cada sessão obtém um access token de curta duração (~1h) via pop-up de consentimento real, mantido só em memória, com tentativa de renovação silenciosa a cada carregamento. Não há mais campo de "colar token" em Ajustes. Isso é uma adaptação honesta ao fato de o app não ter backend — não implementa o fluxo original de `refresh_token` trocado no servidor, mas elimina a exposição de credencial de longa duração |
| `<PainelDeProposta>` / `aplicarProposta()` (§5) | Não implementado | Componente existe (`core/ui/PainelDeProposta.tsx`) mas não é usado por nenhuma tela; a Caixa de Entrada ainda não tem os handlers de upload/extração ligados |
| Painel `/admin` (§6) | Não implementado | Nenhuma rota `/admin` no app ainda |
| Duplicação `core/` vs `servicos/`/`componentes/`/`data/`/`auth/` | **Corrigido** | Quatro árvores paralelas foram encontradas e removidas: `servicos/`, `contextos/`, `componentes/{AppShell,ui}` e `data/firebase.ts` + `auth/AuthProvider.tsx` eram cópias mortas ou concorrentes do que hoje vive só em `core/`. Os poucos arquivos vivos dessas árvores (`servicos/firestore/repositorio.ts`, `componentes/PainelDeProposta.tsx`) foram movidos para dentro de `core/` |
| Chave de IA / Client ID do Drive documentados | **Adicionado** | `app/CONFIGURACAO.md` explica como cada usuário obtém sua própria chave de IA (Gemini, Groq, OpenRouter, Mistral) e como quem hospeda o app cria o Client ID OAuth do Drive no Google Cloud Console — distinção importante, já que são credenciais de donos diferentes |
| Modo claro | **Adicionado** | O app era dark-only; agora há alternância de tema (`core/ui/useTema.ts`), persistida por usuário, com toggle na barra lateral e em Ajustes |

**Pendências que seguem abertas:** mover chamadas de IA e a autorização do Drive para um backend server-side (item mais estrutural, muda o modelo de deploy do zero); deployar `firestore.rules` no projeto real; ligar a Caixa de Entrada ao `<PainelDeProposta>`; publicar a tela de consentimento OAuth do Drive além do modo de teste do Google Cloud (ver `app/CONFIGURACAO.md` §2).

---

## 8. Publicação, agora sem o problema do custo de IA

Com BYOK e Drive implementados (e auditados em P12), compartilhar o app deixa de custar IA e de custar armazenamento para você — cada chamada ao Gemini sai da cota do usuário, e cada arquivo vive no Drive dele. O que continua sob sua conta, e precisa ser monitorado, é só o **uso de Firestore/Authentication** do seu projeto Firebase (dado estruturado, leve):

| Recurso | Camada gratuita típica | Risco prático para o Salus App |
|---|---|---|
| Firebase Authentication | 50 mil MAUs (usuários ativos/mês) na maioria dos provedores | baixíssimo para um app de nicho |
| Firestore | ~1 GiB armazenado + 50 mil leituras/20 mil escritas por dia | leituras/escritas de texto são baratas; sem arquivo nenhum passando por aqui, é difícil chegar perto do limite |
| Google Drive API | cota de chamadas por usuário/projeto, bem generosa; o **espaço em disco** usado é do Drive de cada usuário, não seu | risco baixíssimo — se alguém encher o próprio Drive, o problema é dela, não seu |

Verifique os limites atuais no [console de preços do Firebase](https://firebase.google.com/pricing) e nas [cotas da Google Drive API](https://developers.google.com/drive/api/guides/limits) antes de divulgar amplamente — eles mudam.

### Checklist antes de tornar público

- [x] Regras de segurança do Firestore escritas (`app/firestore.rules`, ver §7.1) — [ ] falta deployar no projeto Firebase real e testar que um usuário autenticado **não consegue** ler/escrever dado de outro `uid` (P0 e P12)
- [ ] App testado **sem nenhuma chave de IA cadastrada**: onboarding, cadastro de membros, edição de Ficha/Medicamentos/Exames/Histórico, upload manual de documento e Painel funcionam de ponta a ponta (P18)
- [ ] Fluxo de BYOK completo e multi-provedor: sem chave própria cadastrada, só Chat e extração automática ficam bloqueados, com instrução clara de como obter uma chave gratuita (Gemini, Groq, OpenRouter ou Mistral) — ver §3.1 e P17
- [ ] Fluxo de Drive completo: sem conectar o Drive, o upload de documentos fica bloqueado com instrução clara; o `refresh_token` nunca é exposto ao cliente
- [ ] Disclaimer clínico visível na primeira tela **e** no rodapé de toda análise gerada
- [ ] Tela de privacidade explicando: dado estruturado no Firestore do Salus App protegido por login, arquivos originais no Drive do próprio usuário (o mantenedor nunca os vê), o acesso técnico de administrador do mantenedor ao Firestore, o que transita para a API do Google (com a chave do próprio usuário), e como apagar a conta e todos os dados
- [ ] Aviso de consentimento no onboarding: "você está registrando dados de saúde de outras pessoas — tenha o consentimento delas"
- [ ] Backup sugerido periodicamente: exportar `.zip` (P11) — a conta pode ser apagada pelo próprio usuário a qualquer momento
- [ ] `metadata.json` com `requestFramePermissions: ["microphone"]` se gravação de áudio estiver ativa
- [ ] Testar a URL compartilhada em janela anônima, com uma conta Google diferente da sua (o erro 403 de share é comum — o remédio é pedir ao agente "fix any build issues" e recompartilhar)
- [ ] Commit no GitHub a partir do AI Studio, em branch separada do framework (ex: `app/`), para não colidir com o pacote npm
- [ ] Monitorar o uso do Firestore no console do Firebase nas primeiras semanas após divulgar

---

## 9. Portabilidade de dados — não é opcional

Você levantou o ponto certo: você não controla se o AI Studio, o Firebase (nível gratuito) ou o próprio projeto vão continuar existindo daqui a um ano. Um app de saúde não pode prender o histórico de ninguém a essa incerteza. Por isso a exportação deixa de ser "uma tela em Ajustes" e vira um **princípio de produto**, com três reforços que os prompts já implementam (P11 e P13):

1. **Exportação completa e legível por humano, sem o app.** O `.zip` gerado (§ próxima seção) não é um dump técnico — é a mesma árvore `.md`/`_index.yaml` do framework Salus original. Qualquer pessoa, mesmo sem o app, abre os arquivos num editor de texto e entende o histórico. Isso é o que impede um "vendor lock-in" de fato: mesmo que o Salus App suma, os dados continuam úteis e legíveis.
2. **Lembrete ativo, não passivo.** O Painel mostra um aviso quando o último export passou de 30 dias (já previsto), e o fluxo de exclusão de conta (P11/P13) **força a oferta de exportar antes de apagar** — o botão "Apagar conta e todos os dados" só fica disponível depois que o usuário exporta ou confirma explicitamente que não quer.
3. **Sem retenção escondida.** Ao apagar a conta, todos os documentos do Firestore daquele `uid` são removidos de fato — não ficam em "soft delete" por padrão. Os arquivos, por já estarem no Drive do próprio usuário, nem precisam ser apagados por você: continuam com ela, é o que se espera. Isso também está no P11.

Esse princípio também é a razão de ser do P11 (compatibilidade com o framework): mesmo no cenário em que o app for descontinuado, o formato de dados sobrevive porque é o mesmo formato do repositório público no GitHub.

---

## 10. Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Agente escreve tudo em `App.tsx` | System Instructions com estrutura de pastas obrigatória + P12 de refatoração |
| IA inventa faixa de referência | Núcleo Inviolável no prompt do servidor + campo só aceita string do laudo + testes do P14 |
| Gravação sem confirmação | Repositórios só expõem `aplicarProposta()`; nenhum componente de chat/extração escreve direto |
| Um usuário lê/escreve dado de outro `uid` | Regras de segurança do Firestore escritas e testadas em P0, reauditadas em P12 |
| Chamada de IA sai da cota do dono do app, não do usuário | BYOK obrigatório antes de liberar qualquer recurso de IA; auditoria dedicada em P12 |
| Arquivo de usuário acaba armazenado no seu projeto (Storage) em vez do Drive dele | Nenhum SDK/uso de Firebase Storage no código; upload sempre via Drive API com o `refresh_token` da própria conta; auditado em P12 |
| `refresh_token` do Drive vaza ou é mal protegido | Mesma regra de segurança do Firestore da chave de IA; nunca enviado ao cliente após a criação; escopo `drive.file` limita o dano mesmo em caso de vazamento (só alcança a pasta do Salus App, não o Drive inteiro) |
| App fica inútil ou trava para quem não cadastra IA | Regra 9 do Núcleo: CRUD manual sempre disponível; Caixa de Entrada tem caminho "preencher manualmente"; testado ponta a ponta no P18 |
| Usuário escolhe um provedor sem suporte a imagem/PDF e a extração falha sem explicação | Presets carregam metadados de capacidade; UI avisa antes de tentar e oferece o caminho manual em vez de falhar silenciosamente — P17 |
| Adaptador genérico (compatível com OpenAI) quebra com um provedor que diverge do padrão | Validação com zod na resposta de qualquer provedor antes de virar Proposta; erro tratado como falha de extração normal, nunca propagado cru à tela — P17 |
| Usuário revoga o acesso ao Drive sem perceber e documentos somem do app | App detecta erro de autorização na chamada e pede para reconectar, sem perder dado (os arquivos continuam no Drive dela) — comportamento coberto em P13 |
| Usuário perde acesso porque esqueceu a própria chave/senha | Chave e dados vivem na conta Google do usuário, recuperável via fluxo padrão do Firebase Auth |
| Projeto ou app for descontinuado no futuro | Exportação completa e legível (`.zip` no formato do framework) tratada como princípio, não feature opcional — ver §9 |
| Deriva entre app e framework | Export/import `.zip` fiel ao schema, testado no P11 |
| Painel de administração vira porta de acesso a dado clínico de terceiros | Painel restrito a métricas agregadas via allowlist server-side; nunca lê coleção clínica de outro `uid` — ver §6 e P16 |

---

## 11. Como usar os outros dois documentos

1. Crie o app no AI Studio (Build mode). Se for partir do repositório: **+ → Import from GitHub**.
2. Abra **Settings → System Instructions** e cole o conteúdo inteiro de `01_SYSTEM_INSTRUCTIONS.md`.
3. Volte ao chat e cole **P0** de `02_PROMPTS.md` (login + isolamento por usuário). Espere terminar. Verifique o aceite — este é o prompt mais importante do plano; não avance sem confirmar que as regras de segurança realmente bloqueiam acesso cruzado entre usuários.
4. Continue com **P1, P2, P3…** Não pule etapas e não junte prompts.
5. Depois de publicar (P15), rode **P16** para ter sua tela de administração (métricas agregadas, sem dado clínico de terceiros) — ver §6.
6. Quando algo quebrar, use os **Prompts de Resgate** no fim de `02_PROMPTS.md` antes de tentar reescrever a feature.
