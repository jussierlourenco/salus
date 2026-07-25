# Salus App — Sequência de Prompts para o Google AI Studio

> **Pré-requisito:** cole `01_SYSTEM_INSTRUCTIONS.md` em **Settings → System Instructions** antes do P1.
>
> **Como usar:** cole um prompt por vez no chat do Build. Espere o agente terminar. **Verifique o critério de aceite no preview.** Só então vá para o próximo. Não junte dois prompts.
>
> Cada prompt está no bloco de código — copie o bloco inteiro, sem o cabeçalho.

**Índice**

| Fase | Prompts |
|---|---|
| 0 · Login e isolamento | [P0](#p0) autenticação + regras de segurança |
| 1 · Fundação | [P1](#p1) esqueleto · [P2](#p2) dados (Firestore) · [P3](#p3) servidor (BYOK) |
| 2 · Entrada de dados | [P4](#p4) onboarding · [P4.5](#p4-5) conectar Drive (retrofit) · [P5](#p5) painel · [P6](#p6) perfil |
| 3 · Motor de IA | [P7](#p7) upload (Drive) · [P8](#p8) extração · [P9](#p9) confirmação |
| 4 · Provedor plugável e modo manual | [P17](#p17) multi-provedor (retrofit) · [P18](#p18) app útil sem IA |
| 5 · Conversa | [P10](#p10) chat |
| 6 · Ponte com o framework | [P11](#p11) export/import |
| 7 · Acabamento | [P12](#p12) auditoria (isolamento + BYOK + Drive + provedores) · [P13](#p13) privacidade · [P14](#p14) QA |
| 8 · Publicação | [P15](#p15) publicar |
| 9 · Administração | [P16](#p16) painel `/admin` restrito |
| Extra | [Prompts de resgate](#resgate) · [Prompts da v2](#v2) |

> **Por que o app agora exige login:** cada usuário precisa ter os próprios dados isolados (Firestore por conta) e guardar seus documentos no próprio Google Drive — nada fica vinculado à sua conta de desenvolvedor. Isso é implementado em **P0** (login/Firestore) e **P4.5** (Drive), os prompts mais importantes do plano: se as regras de segurança e o consentimento de Drive não estiverem corretos, tudo o que vier depois herda a falha.
>
> **A IA é outra história: ela é sempre opcional.** O app precisa funcionar por completo sem nenhuma chave cadastrada — isso é garantido pelo **P18**. Quando o usuário quiser IA, pode escolher entre Gemini ou qualquer provedor compatível com OpenAI (Groq, OpenRouter, Mistral...), com opções gratuitas — isso é o **P17**.
>
> **Se você já rodou P0 a P4:** vá direto para **P4.5** antes de continuar — ele acrescenta o Drive ao que você já construiu, sem refazer nada. Se você já rodou até o P9 (com a versão só-Gemini), rode o **P17** antes do P10 — ele generaliza o que P3 e P8 já construíram para múltiplos provedores, sem refazer nada.

---

<a id="p0"></a>
## P0 — Login e isolamento por usuário (Firebase)

**Objetivo:** ninguém acessa dado de ninguém. Este prompt define a fundação de tudo — verifique o aceite com calma antes de seguir.

```
Configure a autenticação e o isolamento de dados por usuário do Salus App. Este é o alicerce de todo o resto do app — não pule a verificação.

1. Ative o Firebase no projeto (Firestore + Authentication). Configure o provedor "Entrar com Google" no Firebase Authentication.

2. Em src/auth/AuthProvider.tsx e src/auth/useAuth.ts, crie o contexto de sessão: usuário atual, estado de carregando, funções entrar() e sair(). Em src/App.tsx, toda rota exceto /login exige sessão ativa — sem sessão, redirecione para /login.

3. Crie a tela /login: nome do app, uma frase explicando que os dados de cada pessoa ficam isolados e protegidos por login, e um botão "Entrar com Google".

4. Escreva firestore.rules na raiz do projeto:
   - Todo documento sob /usuarios/{uid}/** só pode ser lido ou escrito quando request.auth != null e request.auth.uid == uid.
   - Negue por padrão qualquer caminho fora desse padrão.
   Publique essas regras no projeto Firebase.

5. Não configure Firebase Storage. Este app não guarda arquivo nenhum na sua infraestrutura — documentos originais vão para o Google Drive de cada usuário, configurado depois no P4.5.

6. Crie um pequeno script ou tela de diagnóstico temporária (pode remover depois) que, uma vez logado, tenta escrever em /usuarios/{outroUid}/teste (um uid que não é o do usuário logado) e confirma que a operação é REJEITADA pela regra de segurança. Mostre o resultado desse teste no console do navegador.

7. No servidor, crie server/auth/verificarToken.ts usando firebase-admin: uma função que recebe o cabeçalho Authorization de uma requisição, verifica o Firebase ID Token e devolve o uid, ou lança erro 401 se inválido/ausente. Nenhuma rota de servidor que leia ou grave dado de usuário pode pular essa verificação.

Não implemente nenhuma tela de dados clínicos ainda. O objetivo deste turno é só login + regras + prova de que o isolamento funciona.
```

**Aceite — confirme os três pontos antes de avançar:**
1. Sem estar logado, qualquer rota me leva para `/login`.
2. Entro com uma conta Google, e no Firestore (console do Firebase) aparece um caminho sob `/usuarios/{meu-uid}/`.
3. O teste de escrita cruzada do passo 6 é **rejeitado** — se ele passar (conseguir escrever no uid de outra pessoa), pare tudo e corrija antes de continuar; nenhum prompt seguinte compensa uma regra de segurança furada.

---

<a id="p1"></a>
## P1 — Esqueleto navegável

**Objetivo:** ter a casca do app com navegação e identidade visual, sem nenhuma lógica.

```
Crie o esqueleto do Salus App, sem nenhuma lógica de negócio ainda. A autenticação do P0 já existe — mantenha-a intacta.

Escopo deste turno:
1. Estrutura de pastas conforme as System Instructions (src/telas, src/componentes/ui, src/dominio, src/data, src/servicos, src/types, src/lib, server/).
2. Roteamento client-side com react-router-dom entre as telas autenticadas, todas ainda vazias com um título e um texto "em construção" (login e a guarda de autenticação do P0 continuam funcionando):
   - / → Painel
   - /caixa-de-entrada → Caixa de Entrada
   - /membro/:id → Perfil do Membro
   - /chat → Chat
   - /ajustes → Ajustes
   - /onboarding → Onboarding
3. Um layout AppShell com:
   - Desktop: barra lateral esquerda fixa com o logo "Salus 🩺", os links, e o nome/foto do usuário logado com um botão de sair no rodapé da barra.
   - Mobile: barra de navegação inferior com ícones (lucide-react) e rótulos curtos.
   - Um rodapé permanente e discreto com o texto exato:
     "O Salus organiza informações de saúde. Ele não diagnostica, não prescreve e não substitui médico ou veterinário."
4. Tokens de design em Tailwind: base slate, acento teal, alerta âmbar, "vencido" em vermelho sóbrio. Tipografia grande, cantos arredondados, cards com respiro.
5. Componentes genéricos em src/componentes/ui: Botao, Card, Campo, Badge, EstadoVazio, Carregando.

Não crie coleções de dado clínico ainda, não crie rotas de servidor além do que já existe, não chame o Gemini. App.tsx deve ficar com menos de 100 linhas.
```

**Aceite:** logado, navego entre as 6 telas no preview, no desktop e reduzindo a janela para largura de celular; o rodapé com o disclaimer aparece em todas; vejo meu usuário e um botão de sair na barra lateral; `App.tsx` é curto.

---

<a id="p2"></a>
## P2 — Tipos de domínio e camada de dados (Firestore, isolada por usuário)

**Objetivo:** o banco existe, é isolado por conta, e é a única porta de escrita.

```
Implemente a camada de dados do Salus App sobre o Firestore criado no P0. Nada de UI neste turno.

1. Em src/types/dominio.ts, crie os tipos (campos em português):
   - Familia { nome, atualizado_em }
   - Membro { id, nome, tipo: 'pessoa'|'cao'|'gato'|'outro', nascimento, vinculo: 'biologico'|'adotivo'|'enteado', raca?, tipo_sanguineo?, plano_saude?, condicoes_ativas: string[], alergias: string[], relacoes: { membro_id, papel }[] }
   - Medicamento { id, membro_id, nome, dose, frequencia, status: 'em_uso'|'prescrito'|'descontinuado', desde?, renova_em?, prescrito_por?, motivo_descontinuacao? }
   - Vacina { id, membro_id, nome, aplicada_em, proxima_em? }
   - Checkup { id, membro_id, tipo, data }
   - Exame { id, membro_id, data, painel, marcador, valor, unidade, faixa_referencia_laudo: string, flag: 'normal'|'alto'|'baixo'|'nao_informado', documento_id? }
   - Evento { id, membro_id, data, tipo, descricao }
   - Analise { id, membro_id, titulo, criado_em, tipo, fontes: string[], dados: unknown[], conclusao }
   - ItemCaixaEntrada { id, nome_arquivo, mime, drive_file_id, status: 'pendente'|'processando'|'proposto'|'arquivado'|'erro', proposta?: unknown, adicionado_em }
   - PerfilConfig { onboarding_concluido, consentimentos, provedor_ia?: { tipo: 'gemini'|'openai_compat', url_base?: string, modelo: string, chave: string }, drive_refresh_token?, drive_pasta_raiz_id?, ultima_revisao?, proxima_revisao?, ultimo_export? }

   Todas as datas são strings no formato AAAA-MM-DD. faixa_referencia_laudo é sempre texto copiado do laudo, nunca calculado. provedor_ia e drive_refresh_token nunca têm valor padrão nem são gerados pelo app — só existem depois que o próprio usuário escolhe um provedor e conecta o Drive (isso vem no P4.5 e no P17). Sem provedor_ia cadastrado, o app funciona normalmente pelo caminho manual — só Chat e extração automática ficam indisponíveis. O arquivo em si nunca é armazenado no seu projeto — drive_file_id é só a referência ao arquivo que vive no Google Drive do usuário.

2. Em src/data/firebase.ts, inicialize o app Firebase no cliente (reaproveitando a configuração do P0) e exporte a instância do Firestore já pronta para uso. Não inicialize Firebase Storage — este app não usa.

3. Em src/data/repositorios/, um arquivo por entidade (membros, medicamentos, vacinas, checkups, exames, eventos, analises, caixaEntrada, perfilConfig), expondo funções async simples: listar(uid), obterPorId(uid, id), listarPorMembro(uid, membroId), salvar(uid, dado), remover(uid, id). Toda função monta o caminho sob /usuarios/{uid}/... — nunca acesse uma coleção fora desse padrão. Sem regra de negócio dentro dos repositórios, só leitura/escrita.

4. Em src/dominio/indice.ts, a função montarSnapshotDoIndice(): monta um objeto JSON compacto equivalente ao Familia/_index.yaml do framework Salus — por membro: id, nome, tipo, vinculo, condicoes_ativas, medicamentos_em_uso, medicamentos_prescritos, vacinas (com proxima_em), proximos_checkups, ultimo_exame_em, marcadores_chave (no máximo 8 marcadores mais recentes e relevantes). Esse objeto é o que será enviado à IA. Função pura: recebe os dados já carregados como argumento, não acessa o Firestore diretamente.

5. Em src/data/seed.ts, uma função semearDadosDeExemplo(uid) que grava, sob o /usuarios/{uid}/ do usuário logado, a "Família Exemplo": Ana Exemplo (pessoa, 42), Pedro Exemplo (pessoa, 9, filho) e Rex Exemplo (cão). Nomes obviamente fictícios, valores neutros e plausíveis, algumas vacinas e uma receita vencendo para dar o que mostrar. Não chame essa função automaticamente — só exponha.

Não altere nenhuma tela ainda.
```

**Aceite:** logado, no console do Firebase → Firestore, vejo as coleções sendo criadas sob `/usuarios/{meu-uid}/` conforme uso as funções via console do navegador. Nenhum dado aparece fora desse caminho. Nenhum erro no console.

---

<a id="p3"></a>
## P3 — Servidor: proxy do Gemini com BYOK e o Núcleo Clínico

**Objetivo:** existe um único caminho, seguro, do app até o Gemini — e ele sempre usa a chave do usuário que está pedindo, nunca uma sua.

> **Nota:** este prompt implementa a versão inicial, só com Gemini. O **P17** (mais adiante) generaliza essa mesma rota para múltiplos provedores de IA — não é preciso antecipar isso agora, só saiba que a estrutura vai ser reaproveitada, não descartada.

```
Implemente a camada de servidor do Salus App. É o único lugar que fala com o Gemini, e cada chamada usa a chave do usuário autenticado.

1. Em server/prompts/nucleo.ts, exporte a constante NUCLEO_CLINICO como string. Ela contém as 9 regras do Núcleo Clínico Inviolável (não diagnostica/não prescreve; nunca usar faixa de referência memorizada, só a impressa no laudo; nunca amplificar alarme, sem as palavras grave/preocupante/perigoso; nada gravado sem confirmação, toda saída que altera dados é uma proposta; medicamento de receita entra como "prescrito", nunca "em uso"; vínculo biológico governa cruzamento genético; nunca misturar espécies; índice primeiro; IA é opcional, nunca obrigatória para uso básico). Escreva em português, endereçada ao modelo. Essa string é concatenada em TODA system instruction enviada ao Gemini.

2. Toda rota abaixo usa server/auth/verificarToken.ts (do P0) para obter o uid a partir do cabeçalho Authorization. Sem token válido, responda 401 antes de qualquer outra coisa.

3. Em server/index.ts, crie a rota POST /api/chat:
   - recebe { mensagem, historico, snapshotIndice, chaveGemini }
   - se chaveGemini estiver vazia, responda 400 com { erro: 'chave_ausente' } — o cliente trata esse erro guiando o usuário a cadastrar a própria chave em Ajustes
   - monta a system instruction: NUCLEO_CLINICO + o papel de assistente de saúde da família + o snapshot do índice serializado
   - chama o Gemini (modelo rápido/econômico, streaming se possível) usando @google/genai, instanciado com a chaveGemini recebida NA REQUISIÇÃO — nunca com uma variável de ambiente do servidor
   - devolve a resposta em texto
   - trata erro devolvendo { erro: mensagem } com status apropriado (inclusive quando a própria chave do usuário for inválida ou sem cota — mensagem clara sobre isso)
   - NUNCA loga o conteúdo de snapshotIndice, mensagem, resposta ou chaveGemini

4. Em src/servicos/api.ts, o cliente tipado dessa rota: sempre anexa o Firebase ID Token do usuário logado no cabeçalho Authorization, e busca a chave salva em perfilConfig antes de enviar. Tratamento de erro e timeout.

5. Na tela de Chat, um formulário mínimo: caixa de texto, botão enviar, lista de mensagens. Se o usuário ainda não tiver cadastrado a própria chave, mostre um aviso com link direto para Ajustes em vez do formulário. Sem propostas ainda, sem persistência da conversa — só para provar que o caminho funciona.

Não importe @google/genai em nenhum arquivo dentro de src/. Não crie nenhuma GEMINI_API_KEY nos secrets do projeto para uso em produção — se o AI Studio configurar uma automaticamente para testes seus durante o desenvolvimento, ela nunca deve ser o caminho usado quando chaveGemini vier vazia da requisição de um usuário real.
```

**Aceite:** cadastro manualmente uma chave de teste (posso usar a minha própria) em algum lugar temporário só para validar, envio "olá, o que você faz?" no chat, e recebo resposta coerente em português. Removendo a chave, a rota responde 400 e o chat mostra o aviso, não um erro genérico. No código do cliente não existe nenhuma menção a uma chave fixa nem ao SDK do Gemini.

---

<a id="p4"></a>
## P4 — Onboarding

**Objetivo:** primeira execução leva à família montada, com consentimento explícito.

> **Se você já rodou este prompt na versão de 4 passos (sem conectar o Drive):** não reexecute este bloco — vá direto para **P4.5**, que acrescenta o passo de Drive ao onboarding que você já tem, sem refazer o resto.

```
Implemente a tela de Onboarding como um wizard de 5 passos, com barra de progresso e botões Voltar/Continuar.

Passo 1 — Privacidade e consentimento. Texto claro, em português simples, explicando:
   - Seus dados estruturados (perfis, exames, medicamentos) ficam guardados na sua conta (login com Google), isolados de qualquer outro usuário por regra de segurança do banco.
   - Seus documentos originais (PDF, foto, áudio) ficam no SEU PRÓPRIO Google Drive, numa pasta que só o Salus App acessa — o mantenedor do app nunca vê nem guarda esses arquivos.
   - A IA é opcional: o app funciona completamente por preenchimento manual, sem nenhuma chave. Se você quiser recursos de IA (organizar documentos automaticamente, conversar em linguagem natural), pode cadastrar depois, em Ajustes, a chave de um provedor à sua escolha (há opções gratuitas) — o processamento e a cota são seus, não do mantenedor do app.
   - O mantenedor do app não acessa seus dados no uso normal, mas, como dono da infraestrutura, tem acesso técnico de administrador ao banco de dados estruturado — igual em qualquer serviço na nuvem (os arquivos, por estarem no seu Drive, ele nunca alcança).
   - Você pode exportar todos os seus dados a qualquer momento, num formato aberto que continua útil mesmo sem o app. Recomendamos fazer isso periodicamente.
   - Você vai registrar dados de saúde de outras pessoas: tenha o consentimento delas.
   - O Salus não diagnostica nem substitui médico ou veterinário.
   Duas caixas de seleção obrigatórias: "Entendi como meus dados são tratados" e "Tenho consentimento das pessoas que vou cadastrar". Sem as duas marcadas, o botão Continuar fica desabilitado.

Passo 2 — Conectar Google Drive. Explique em 2-3 linhas que os documentos (exames, receitas, fotos, áudios) vão ficar guardados no Drive da própria pessoa, numa pasta chamada "Salus App", e que isso é pedido **uma única vez** — não a cada uso. Botão "Conectar Google Drive" que dispara o consentimento OAuth incremental (escopo drive.file + acesso offline). Ao concluir, crie a pasta raiz no Drive do usuário e grave o id dela. Não deixe passar para o próximo passo sem a conexão concluída, mas ofereça um link discreto "pular por enquanto" que permite continuar sem Drive (o app aí funciona, só bloqueia upload de documentos até conectar depois em Ajustes).

Passo 3 — Membros. Nome da família e uma lista editável de membros: nome, tipo (pessoa/cão/gato/outro), data de nascimento (opcional), raça quando for animal. Botão para adicionar e remover.

Passo 4 — Relações. Para cada par relevante, permitir declarar o papel (pai/mãe, filho(a), cônjuge, tutor do pet). Um aviso discreto com um link "algum membro é adotivo ou enteado?" que abre um campo opcional de vínculo por membro, explicando em uma frase que isso serve só para não cruzar histórico genético indevidamente e que não aparece na ficha. O padrão é sempre "biológico" — não pergunte proativamente.

Passo 5 — Conclusão. Resumo do que será criado, um lembrete de que o app já é totalmente utilizável sem IA, e que os recursos de IA (Chat, organizar documentos automaticamente) podem ser ligados depois em Ajustes, cadastrando a chave de um provedor à escolha — com opções gratuitas. Dois botões: "Criar minha família" e "Quero ver com dados de exemplo primeiro" (esse chama semearDadosDeExemplo com o uid do usuário logado).

Ao concluir, grave tudo no Firestore sob /usuarios/{uid}/, marque perfilConfig.onboarding_concluido e redirecione ao Painel.
Se o onboarding ainda não foi concluído para o usuário logado, qualquer rota redireciona para /onboarding.
```

**Aceite:** logado com uma conta, sou levado ao onboarding, não consigo passar do passo 1 sem marcar as duas caixas, conecto o Drive e vejo a pasta "Salus App" aparecer na minha conta do Drive, crio 2 pessoas e 1 pet, caio no Painel e vejo os membros salvos sob `/usuarios/{meu-uid}/` no Firestore. Logando com outra conta Google, o onboarding aparece de novo (dados isolados).

---

<a id="p4-5"></a>
## P4.5 — Retrofit: conectar ao Google Drive (rodar agora, se você já passou do P4)

**Objetivo:** dar ao onboarding e ao restante do app a conexão com o Drive, sem refazer o que P0-P4 já construíram. Use este prompt no lugar de reexecutar o P4 antigo.

```
Adicione a conexão com o Google Drive do usuário ao Salus App que já está construído (P0-P4 concluídos). Não refaça telas existentes — só acrescente o necessário.

1. No servidor, implemente o fluxo OAuth incremental do Google para o escopo drive.file com acesso offline (access_type=offline, prompt=consent), separado do login do Firebase (que continua como está). Crie as rotas:
   - GET /api/drive/iniciar-conexao: gera a URL de consentimento do Google para o usuário autenticado.
   - GET /api/drive/callback: recebe o código de autorização, troca por um refresh_token via servidor, salva em /usuarios/{uid}/perfil/config.drive_refresh_token (protegido pela regra de segurança já existente), e cria a pasta raiz "Salus App" no Drive do usuário na primeira conexão, salvando o id em drive_pasta_raiz_id.
   - Um helper server/drive/clienteDrive.ts que, a partir do refresh_token salvo, obtém um token de acesso de curta duração sempre que uma rota precisar ler/escrever no Drive — de forma silenciosa, sem novo consentimento.

2. No Firestore, atualize o tipo ItemCaixaEntrada (criado no P2): renomeie o campo storage_path para drive_file_id. Ajuste o repositório correspondente se necessário. Não crie nenhuma referência a Firebase Storage em nenhum lugar do código.

3. Acrescente um Passo 2 ao wizard de Onboarding já existente (entre o passo de privacidade e o de membros): "Conectar Google Drive", com a explicação de que é um consentimento único, botão "Conectar Google Drive" chamando /api/drive/iniciar-conexao, e um link discreto "pular por enquanto". Não recrie os outros passos do onboarding, só insira este.

4. Em Ajustes (crie a seção se ainda não existir), adicione um indicador de status "Google Drive: conectado / não conectado" com um botão "Conectar" ou "Reconectar", para quem pulou no onboarding ou revogou o acesso depois.

5. Teste o fluxo: conecte o Drive, confirme que a pasta "Salus App" aparece na conta Google do usuário, e confirme que fechar e reabrir o app (sem fazer nada no Google) não pede consentimento de novo.
```

**Aceite:** conecto o Drive uma vez, vejo a pasta "Salus App" criada na minha conta Google; recarrego a página e navego pelo app — nenhum novo consentimento é pedido; o campo `drive_file_id` existe no tipo `ItemCaixaEntrada` e não há mais nenhuma referência a `storage_path` ou a Firebase Storage no código.

---

<a id="p5"></a>
## P5 — Painel (o raio-x visual)

**Objetivo:** a tela que responde "como estamos?" sem chamar a IA.

```
Implemente o Painel, a tela inicial. Ele é 100% calculado localmente — não chama o Gemini.

1. Em src/dominio/alertas.ts, crie funções puras (sem I/O, testáveis) que recebem os dados e a data de hoje e retornam a lista de alertas classificados em quatro grupos: VENCIDO, VENCE_EM_30_DIAS, VENCE_EM_31_A_90_DIAS, SEM_DATA. Consideram: vacinas (proxima_em), medicamentos com renova_em, e check-ups agendados. Cada alerta traz membro, tipo, descrição, data e quantos dias faltam ou se passaram.

2. A tela mostra, nesta ordem:
   - Saudação e data de hoje.
   - Cartões de alerta agrupados. Vencido em vermelho sóbrio, 30 dias em âmbar, 31-90 dias em neutro. Cada cartão leva ao perfil do membro. Se não houver nada: "Nada vencendo nos próximos 30 dias ✅", em verde discreto.
   - Seção "Medicamentos em uso": tabela compacta membro / medicamento / dose / desde. Só status em_uso. Os prescritos aparecem em uma linha separada e discreta: "N receitas aguardando confirmação de início".
   - Seção "Condições em acompanhamento", agrupada por membro.
   - Faixa de membros: um avatar/inicial por membro, clicável, com ícone diferente para pessoa, cão e gato.
   - Se o último export tiver mais de 30 dias (ou nunca), um aviso discreto: "Faça um backup dos seus dados" com link para Ajustes.

3. Nada nessa tela usa palavras de alarme. Nenhum exame alterado é destacado em vermelho aqui.

Estado vazio: se não há alertas nem medicamentos, um EstadoVazio convidando a adicionar o primeiro documento na Caixa de Entrada.
```

**Aceite:** com os dados de exemplo, vejo pelo menos um item vencendo com a contagem de dias correta; sem dados, vejo o estado vazio; nenhuma requisição de rede é disparada ao abrir o Painel.

---

<a id="p6"></a>
## P6 — Perfil do membro

**Objetivo:** substituir os cinco arquivos `.md` de `Perfis/[Nome]/` por uma tela.

```
Implemente a tela de Perfil do Membro (/membro/:id), com cabeçalho e cinco abas.

Cabeçalho: nome, tipo com ícone, idade calculada a partir do nascimento, raça se for animal, e as alergias em destaque discreto. NÃO exiba o campo vinculo em lugar nenhum desta tela.

Aba Ficha: dados básicos, tipo sanguíneo, plano de saúde, contatos de emergência, condições ativas, alergias, especialistas de referência. Tudo editável in-place, com salvamento explícito (botão Salvar), nunca automático.

Aba Medicamentos: três seções — Em uso, Prescritos (aguardando confirmação de início) e Descontinuados. Na seção Prescritos, cada item tem um botão "Já estou tomando" que abre uma confirmação e só então muda o status para em_uso, pedindo a data de início. Botão para adicionar medicamento manualmente.

Aba Exames: agrupado por painel (ex: Hemograma, Perfil Lipídico) e ordenado por data decrescente. Cada linha: data, marcador, valor + unidade, e a faixa de referência exatamente como veio do laudo. Se faixa_referencia_laudo estiver vazia, mostre em cinza "faixa não informada no laudo". Quando flag for alto ou baixo, use um badge âmbar neutro com o texto "o laboratório sinalizou como alto/baixo" — nunca vermelho, nunca linguagem de alarme.

Aba Histórico: linha do tempo vertical dos eventos, mais recente primeiro, com botão para adicionar um registro manual.

Aba Documentos: grade dos documentos do membro agrupados por tipo, com nome, data e miniatura quando for imagem. Clicar abre o arquivo original no Google Drive do próprio usuário (usando o `drive_file_id` salvo e o `webViewLink` da Drive API). Botão para baixar, também via Drive API.

Todas as abas têm estado vazio próprio, explicando o que aparece ali e como adicionar.
```

**Aceite:** navego pelas cinco abas de um membro de exemplo; consigo mover um medicamento de "Prescrito" para "Em uso" e a mudança persiste após recarregar a página.

---

<a id="p7"></a>
## P7 — Caixa de Entrada: receber os arquivos

**Objetivo:** o arquivo entra e fica guardado no Drive do próprio usuário. Ainda sem IA.

```
Implemente a tela Caixa de Entrada, apenas a parte de recepção e armazenamento. Não chame o Gemini ainda.

1. Área de arrastar-e-soltar grande, com botão alternativo "escolher arquivos" e, no celular, um botão "tirar foto" que abre a câmera (input capture). Aceita PDF, JPG, PNG, WEBP, HEIC, MP3, M4A, WAV, OGG. Limite de 20 MB por arquivo, com mensagem clara se exceder. Se o usuário ainda não conectou o Google Drive (P4.5), mostre um aviso bloqueando o envio, com botão direto para conectar.

2. Cada arquivo recebido é enviado, via uma rota do servidor (POST /api/drive/upload, autenticada, usando o refresh_token do usuário para obter um token de acesso de curta duração), para a pasta "Salus App" no Google Drive daquele usuário. O servidor repassa o arquivo ao Drive e não o retém em nenhum lugar depois de concluído. A resposta traz o id do arquivo no Drive, que vira o ItemCaixaEntrada gravado no Firestore com drive_file_id apontando para lá, status 'pendente'. Mostre progresso de upload por arquivo.

3. Lista dos itens: miniatura ou ícone por tipo, nome do arquivo, tamanho, quando foi adicionado, e o status como badge. Ações por item: visualizar (abre o arquivo no Drive via drive_file_id), remover (apaga do Drive via API e do Firestore).

4. Um alerta discreto no topo quando houver itens pendentes: "N documentos aguardando organização".

5. Botão "Organizar documentos" já visível, porém desabilitado, com a legenda "em breve".

Tudo permanece após recarregar a página.
```

**Aceite:** arrasto um PDF e uma foto, recarrego a página, os dois continuam lá com miniatura e status "pendente".

---

<a id="p8"></a>
## P8 — Extração com o Gemini (structured output)

**Objetivo:** o app lê o documento e devolve uma proposta estruturada — sem gravar nada.

> **Nota:** assim como o P3, este prompt usa o Gemini diretamente. O **P17** generaliza esta rota para múltiplos provedores depois — construa aqui sem se preocupar com isso ainda.

```
Implemente a extração de documentos com o Gemini. Este é o núcleo do app — capriche na validação.

1. Em src/types/propostas.ts, defina o tipo Proposta e seu schema zod:
   Proposta {
     documento: { tipo: 'exame'|'laudo'|'receita'|'requisicao'|'audio'|'outro', data_documento, descricao_curta, nome_sugerido, emitido_por },
     membro: { membro_id_sugerido: string | null, nome_encontrado_no_documento: string | null, confianca: 'alta'|'media'|'baixa' },
     exames: { painel, marcador, valor, unidade, faixa_referencia_laudo, flag }[],
     medicamentos: { nome, dose, frequencia, prescrito_por, validade_receita }[],
     vacinas: { nome, aplicada_em, proxima_em }[],
     eventos: { data, tipo, descricao }[],
     observacoes: string[]
   }

2. Em server/schemas/, o responseSchema correspondente, e em server/prompts/extrair.ts o prompt de extração. Regras obrigatórias dentro do prompt:
   - NUCLEO_CLINICO concatenado no início.
   - Extraia apenas o que está escrito no documento. Nunca complete, nunca estime, nunca deduza valor ausente. Campo sem informação = string vazia.
   - faixa_referencia_laudo é a faixa impressa no próprio laudo, copiada literalmente. Se o laudo não trouxer, deixe vazio. NUNCA use uma faixa de referência do seu conhecimento.
   - flag é 'alto'/'baixo' apenas se o PRÓPRIO LAUDO sinalizou. Caso contrário, 'normal' se o laudo indicou normal, ou 'nao_informado'.
   - Medicamentos de receita SEMPRE entram como proposta de status prescrito, nunca em uso.
   - Para identificar o membro, receba a lista de membros (id, nome, tipo, nascimento) e devolva membro_id_sugerido com o nível de confiança. Se não tiver certeza, devolva null com confianca 'baixa'.
   - Áudio: transcreva e classifique como orientação médica, extraindo o que houver de medicamento, retorno ou recomendação.

3. Rota POST /api/extrair-documento: exige o token de autenticação (server/auth/verificarToken.ts); recebe o itemId da Caixa de Entrada e chaveGemini; se chaveGemini vier vazia, responda 400 com { erro: 'chave_ausente' }; busca o drive_file_id daquele item no Firestore, usa o refresh_token do usuário (server/drive/clienteDrive.ts, do P4.5) para baixar os bytes do arquivo diretamente do Drive dele, envia ao Gemini com structured output usando a chaveGemini recebida (nunca uma do ambiente do servidor), valida a resposta com zod no servidor, devolve a Proposta. Não persiste os bytes do arquivo em nenhum momento — só passam pela memória da requisição. Não loga conteúdo nem a chave nem o refresh_token.

4. No cliente, o botão "Organizar documentos" só fica ativo se o usuário já tiver uma chave própria cadastrada em Ajustes — caso contrário, mostra o aviso com link para lá. Quando ativo, processa a fila item a item, mostrando progresso por item (status 'processando' → 'proposto'), salvando a proposta no ItemCaixaEntrada. Erro de um item não interrompe os outros: marca status 'erro' com mensagem e botão "tentar de novo" (inclusive erro de chave inválida/sem cota, com mensagem específica).

5. Ao terminar, apenas mostre as propostas em modo leitura. NÃO grave nada nos dados do membro ainda — isso é o próximo prompt.
```

**Aceite:** processo um PDF real de exame e recebo uma proposta com os marcadores e as faixas do laudo copiadas corretamente. Testo com um exame cujo laudo não traz faixa: o campo vem vazio, não inventado.

---

<a id="p9"></a>
## P9 — Painel de Proposta e confirmação

**Objetivo:** o componente que faz do app o Salus.

```
Implemente o componente PainelDeProposta e o fluxo de confirmação. Nenhum outro caminho pode gravar dados.

1. src/componentes/PainelDeProposta.tsx recebe uma Proposta e mostra, em seções:
   - Documento: tipo, data, para onde vai ser arquivado, com o nome padronizado AAAA-MM-DD_Tipo_Descricao.ext
   - A quem pertence: seletor de membro pré-preenchido com a sugestão. Se confianca for 'media' ou 'baixa', o seletor aparece destacado e o botão de confirmar fica bloqueado até o usuário escolher explicitamente.
   - Cada bloco de dados (exames, medicamentos, vacinas, eventos) como uma lista de linhas com caixa de seleção individual, mostrando "valor atual → valor novo" quando já existir dado equivalente. O usuário pode desmarcar itens e editar valores antes de confirmar.
   - Bloco especial de RECEITA: para cada medicamento, a pergunta explícita "Você já comprou / está tomando este medicamento?" com as opções "Já estou tomando" e "Só a receita por enquanto" (padrão). O status só vira em_uso na primeira opção.
   - Rodapé fixo com três botões: Confirmar e arquivar · Editar · Descartar.

2. Em src/dominio/proposta.ts, a função aplicarProposta(uid, proposta, selecao) que traduz a proposta aprovada em operações de escrita, sempre sob /usuarios/{uid}/: cria/atualiza exames, medicamentos, vacinas, eventos; chama uma rota do servidor que usa o refresh_token do usuário para renomear/mover o arquivo dentro da pasta "Salus App" no Drive dele, refletindo o membro e o nome padronizado (ex: subpasta com o nome do membro, arquivo renomeado); registra um Evento "documento arquivado"; atualiza familia.atualizado_em; muda o ItemCaixaEntrada para 'arquivado'. Use um batch/transação do Firestore para a parte de dados — se falhar no meio, nada é gravado; se a reorganização no Drive falhar, mantenha o item como 'proposto' com aviso, sem perder a proposta.

3. Nenhum outro módulo do app pode chamar os repositórios de escrita a partir de saída de IA. Todo caminho passa por aplicarProposta.

4. Após confirmar, toast de sucesso com link "ver no perfil de [nome]".
```

**Aceite:** processo uma receita, escolho "só a receita por enquanto", confirmo, e o medicamento aparece na aba Prescritos do membro — nunca em Em uso. Desmarco um marcador de exame antes de confirmar e ele não é gravado.

---

<a id="p17"></a>
## P17 — Provedor de IA plugável (multi-provedor, com opções gratuitas)

**Objetivo:** deixar de depender só do Gemini. O usuário escolhe entre alguns provedores prontos (com opções gratuitas) ou cola a chave de qualquer serviço compatível com a API de Chat Completions da OpenAI. Este prompt generaliza o que P3 e P8 já construíram — não é uma feature nova do zero.

```
Generalize o acesso à IA do Salus App para múltiplos provedores. Hoje o app só fala com o Gemini via uma chave chamada chaveGemini — isso vira um sistema plugável.

1. Em src/types/dominio.ts, adicione o tipo ProvedorIA: { tipo: 'gemini' | 'openai_compat', url_base?: string, modelo: string, chave: string, nome_exibicao?: string }. Atualize PerfilConfig: renomeie o campo chave_gemini para provedor_ia: ProvedorIA | null. Ajuste o repositório de perfilConfig e qualquer lugar do código que ainda leia chave_gemini.

2. No servidor, crie server/ia/index.ts com uma função única chamarIA(provedor: ProvedorIA, entrada: { systemInstruction: string, mensagens: unknown[], responseSchema?: unknown, partesMultimodais?: unknown[] }): Promise<string> — o contrato que todo o resto do servidor usa, sem saber qual provedor está por trás.

3. Em server/ia/adaptadorGemini.ts, mova a lógica que hoje está direto nas rotas (usando @google/genai) para dentro desse adaptador, implementando o contrato de chamarIA. Ele continua sendo o mais capaz para multimodal (imagem, PDF, áudio).

4. Em server/ia/adaptadorOpenAICompativel.ts, implemente o mesmo contrato fazendo um POST para `${provedor.url_base}/chat/completions` (formato padrão de Chat Completions: messages com role/content, suporte a content em partes para imagem via base64 quando o provedor aceitar, header Authorization: Bearer ${provedor.chave}, e response_format json_schema quando disponível — senão, inclua instrução explícita no prompt para responder só em JSON e faça o parse manual antes de validar com zod). Esse único adaptador serve para Groq, OpenRouter, Mistral, OpenAI e qualquer outro compatível — não crie um arquivo por provedor.

5. Em server/ia/index.ts, a função chamarIA escolhe o adaptador certo pelo campo tipo do provedor recebido.

6. Atualize as rotas /api/chat (P3) e /api/extrair-documento (P8): pare de receber a chave do corpo da requisição. Em vez disso, depois de verificar o token e obter o uid, busque provedor_ia em /usuarios/{uid}/perfil/config no próprio servidor. Se não existir, responda 400 com { erro: 'ia_nao_configurada' }. Isso simplifica o cliente (ele só dispara a ação, não precisa buscar e anexar a chave a cada chamada) e reduz a chance de a chave transitar por lugares desnecessários.

7. Em src/servicos/api.ts, remova o envio manual da chave nas chamadas — o servidor resolve sozinho a partir do uid autenticado.

8. Em Ajustes, crie a seção "Provedor de IA" com:
   - Um aviso calmo no topo: "Isso é opcional. O Salus App funciona sem IA nenhuma — cadastre um provedor só se quiser recursos como organizar documentos automaticamente ou conversar em linguagem natural."
   - Cards de preset, cada um com nome, uma badge "Grátis" quando aplicável, ícones indicando suporte a imagem/PDF/áudio, e um link "como conseguir uma chave":
     - Google Gemini (recomendado — free tier generoso, melhor suporte a imagem/PDF/áudio)
     - OpenRouter (grátis, ~200 requisições/dia sem cartão, vários modelos com visão)
     - Groq (grátis, muito rápido, bom para o Chat)
     - Mistral (camada gratuita limitada, principalmente texto)
     - Personalizado (compatível com OpenAI): campos livres de URL base, nome do modelo e chave
   - Ao escolher um preset, pré-preencha url_base e modelo (deixe o usuário só colar a chave); no personalizado, os três campos ficam livres.
   - Botão "Testar chave": faz uma chamada simples e mostra sucesso/erro antes de salvar.
   - Se o provedor escolhido não suportar imagem/PDF, mostre um aviso: "Este provedor não processa documentos — a Caixa de Entrada vai continuar funcionando no modo manual."
   - Botão "Remover provedor" que apaga provedor_ia e volta o app ao modo 100% manual.

9. Na Caixa de Entrada (P7/P8), antes de habilitar "Organizar documentos", verifique a capacidade do provedor cadastrado. Sem provedor, ou com um provedor sem suporte a imagem/PDF, mostre a mensagem adequada e destaque o botão "Preencher manualmente" em vez de deixar o usuário tentar uma extração que vai falhar.

Não altere o Núcleo Clínico — ele continua sendo concatenado à instrução de sistema de qualquer provedor, sem exceção.
```

**Aceite:** em Ajustes, cadastro uma chave do Gemini, testo com sucesso, uso o Chat normalmente. Troco para uma chave do OpenRouter (preset), testo, e a extração de um documento com imagem continua funcionando. Removo o provedor: Chat e "Organizar documentos" ficam bloqueados com mensagem clara, mas todo o resto do app continua funcionando normalmente.

---

<a id="p18"></a>
## P18 — Modo manual completo (o app precisa valer a pena sem nenhuma IA)

**Objetivo:** provar, com um roteiro de teste real, que ninguém fica travado por não ter (ou não querer) uma chave de IA.

```
Audite e complete o caminho 100% manual do Salus App. Não é uma feature nova — é garantir que o que já existe cobre esse caminho de ponta a ponta.

1. Percorra o onboarding sem conectar Drive e sem cadastrar provedor de IA: confirme que é possível concluir, criar membros, e chegar ao Painel normalmente.

2. Na Caixa de Entrada, para quem conectou o Drive mas não tem provedor de IA (ou tem um sem suporte a imagem): confirme que o arquivo sobe normalmente e que existe um botão "Preencher manualmente" ao lado de "Organizar documentos" (desabilitado com explicação). Esse botão abre o mesmo PainelDeProposta usado pela extração automática, mas vazio — o usuário escolhe o membro, o tipo de documento, e preenche exames/medicamentos/vacinas/eventos manualmente. Ao confirmar, passa pelo mesmo aplicarProposta() de sempre, e o documento já enviado ao Drive fica associado ao registro criado.

3. Em cada aba do Perfil do Membro (Ficha, Medicamentos, Exames, Histórico), confirme que existe um jeito direto de adicionar/editar sem depender de IA (isso já deveria existir desde o P6 — se algo regrediu, corrija).

4. No Painel, adicione (se ainda não existir) um cartão discreto e não repetitivo sugerindo cadastrar um provedor de IA, mostrado só depois de um uso manual significativo (ex: terceiro registro manual de exame, ou primeiro documento sem conseguir extrair automaticamente) — nunca antes disso, nunca de forma insistente, nunca mais de uma vez por sessão. Texto no tom do app: "Cadastrar um provedor de IA deixa isso mais rápido — você tira uma foto e o app preenche os campos pra você conferir. Tem opções gratuitas." com botão para Ajustes e um "não mostrar de novo".

5. Escreva um teste (vitest ou manual). Se docs/QA.md já existir, acrescente a ele; se não, crie-o. O roteiro percorre: onboarding sem IA → criar membro → adicionar exame manual → subir documento sem provedor → preencher manualmente → confirmar → ver tudo refletido no Painel e no Perfil. Nenhum passo desse roteiro pode exigir uma chave de IA.

6. Revise todos os textos do app (telas, tooltips, estados vazios) atrás de qualquer frase que dê a entender que IA é obrigatória (ex: "faça login e cadastre sua chave para começar"). Corrija para linguagem que trata IA como recurso opcional.
```

**Aceite:** crio uma conta nova, nunca cadastro nenhuma chave, e consigo usar o Salus App inteiro — cadastrar família, registrar exames e medicamentos manualmente, anexar documentos, ver o Painel e a Agenda, exportar meus dados. Em nenhum momento o app trava ou dá a entender que preciso de IA para continuar.

---

<a id="p10"></a>
## P10 — Chat com contexto e propostas inline

**Objetivo:** a conversa em linguagem natural do Salus, agora dentro do app.

```
Evolua a tela de Chat para o assistente completo.

1. Toda mensagem envia ao servidor (autenticada, com a chave própria do usuário já validada) o snapshot compacto do índice (montarSnapshotDoIndice) e as últimas 10 mensagens da conversa. Nunca envie os arquivos originais nem o histórico completo, salvo se a pergunta claramente exigir — nesse caso, envie apenas o do membro citado e avise no rodapé da resposta quais dados foram consultados.

2. A resposta do servidor volta como { texto, proposta? } usando structured output. Quando o usuário disser algo como "registra que o Rex tomou a antirrábica hoje", o modelo devolve uma proposta compatível com o tipo Proposta, e o chat renderiza o PainelDeProposta embutido na conversa. Sem confirmação, nada é gravado.

3. Detecção passiva: se o usuário mencionar de passagem uma informação de saúde ("o médico trocou meu remédio"), a resposta termina com a pergunta "Percebi que você mencionou [resumo]. Quer que eu registre isso?" — nunca insista se a resposta for não.

4. Sugestões clicáveis quando o chat está vazio: "Como estamos?", "O que está vencendo?", "Registra que...", "Como está o [marcador] do [membro]?".

5. A conversa é guardada no Firestore sob /usuarios/{uid}/conversas/, com botão de limpar. Estado de carregando com streaming da resposta.

6. Reforce no prompt do servidor: responder em português simples, sem LaTeX, sem jargão, sem diagnóstico, e sempre apontar o profissional de saúde quando houver dúvida clínica.
```

**Aceite:** pergunto "o que está vencendo?" e recebo a resposta coerente com o Painel. Digito "registra que a Ana tomou a vacina da gripe hoje", aparece o painel de proposta, confirmo, e a vacina aparece na ficha da Ana.

---

<a id="p11"></a>
## P11 — Export, Import e portabilidade garantida

**Objetivo:** duas coisas ao mesmo tempo — a ponte que impede o app e o repositório de virarem projetos diferentes, e a garantia de que ninguém fica refém do Salus App continuar no ar. Isso é requisito de produto, não recurso secundário: o usuário precisa poder sair a qualquer momento com todos os dados intactos e legíveis.

```
Implemente exportação, importação e exclusão de conta na tela de Ajustes, com compatibilidade fiel ao repositório Salus v0.3.0.

EXPORTAR (botão "Exportar meus dados", em destaque na tela, não escondido): busca todos os dados do usuário logado no Firestore (sob /usuarios/{uid}/) e, opcionalmente, os arquivos dele no Drive (usando o refresh_token para baixá-los), e gera um .zip com jszip contendo exatamente esta árvore:

  Familia/_index.yaml          ← gerado a partir do snapshot, com os mesmos nomes de campo do framework
  Familia/META.md              ← índice legível: membros e papéis
  Familia/Agenda.md            ← vencidos / 30 dias / 31-90 dias / sem data
  Familia/Arvore.md            ← diagrama Mermaid das relações (pessoas e pets)
  Familia/Linha_do_Tempo_Geral.md
  Familia/Medicamentos_Ativos.md
  Familia/Genetica_Familiar.md
  Perfis/[Nome]/Ficha.md
  Perfis/[Nome]/Medicamentos.md
  Perfis/[Nome]/Genetica.md
  Perfis/[Nome]/Historico.md
  Perfis/[Nome]/Exames.md
  Perfis/[Nome]/Analises/*.md
  Perfis/[Nome]/Documentos/{Exames,Laudos,Receitas,Requisicoes,Audios}/  ← cópia dos arquivos, baixados do Drive do usuário
  salus-app-backup.json        ← dump fiel de todas as coleções do Firestore do usuário, para reimportação sem perda

Como os arquivos já vivem organizados no Drive do próprio usuário (pasta "Salus App", mesma árvore de subpastas), a exportação dos documentos aqui é uma cópia de conveniência para quem quer tudo num único arquivo — não é a única cópia que existe, o que torna essa portabilidade ainda mais robusta que antes. Ofereça duas opções de exportação: "completa" (inclui os arquivos, pode demorar se houver muitos) e "só os dados estruturados" (rápida, sem baixar do Drive).

Os .md seguem o formato do framework: tabelas em markdown, datas AAAA-MM-DD, faixa de referência do laudo ao lado de cada valor. O _index.yaml preserva os campos vinculo, condicoes_ativas, medicamentos_em_uso, medicamentos_prescritos, vacinas, proximos_checkups, ultimo_exame_em e marcadores_chave.

IMPORTAR (botão "Importar backup"): aceita o .zip acima, sempre gravando no /usuarios/{uid}/ do usuário logado no momento. Se houver salus-app-backup.json, use-o (fiel). Se não houver — caso de alguém vindo do framework em .md — leia Familia/_index.yaml e os arquivos de perfil e reconstrua o que for possível, listando ao final o que não pôde ser interpretado. Se o .zip trouxer arquivos em Documentos/, envie-os para o Drive do usuário atual (pasta "Salus App") durante a importação. Antes de escrever, mostre um resumo do que será importado e peça confirmação. Ofereça as opções "substituir tudo" e "mesclar".

Grave perfilConfig.ultimo_export com a data a cada exportação.

EXCLUSÃO DE CONTA (botão "Apagar minha conta e todos os dados", separado e discreto): o fluxo é obrigatoriamente:
  1. Mostra um aviso: "Isso apaga permanentemente todos os seus dados estruturados do Salus App. Seus documentos no Google Drive NÃO são apagados — continuam com você, na pasta 'Salus App'. Recomendamos exportar antes."
  2. Botão "Exportar agora" em destaque, e só depois um link menor "Continuar sem exportar".
  3. Confirmação digitando a palavra APAGAR.
  4. Ao confirmar: apaga todos os documentos das coleções do Firestore sob /usuarios/{uid}/ (incluindo o refresh_token do Drive, revogando o acesso do app) e, por fim, a conta do Firebase Authentication do usuário. Sem soft delete — a remoção é definitiva. Os arquivos no Drive do usuário permanecem intocados, é o comportamento correto.
```

**Aceite:** exporto no modo completo, abro o `.zip` e confiro que `Familia/_index.yaml` tem a mesma estrutura do template do repositório e que os documentos originais estão lá dentro; tento apagar a conta, o app me oferece exportar antes de deixar prosseguir; confirmo a exclusão e, ao tentar entrar de novo com a mesma conta Google, caio num onboarding vazio no Firestore — mas a pasta "Salus App" continua no meu Google Drive, intacta; importo o `.zip` numa conta nova e recupero o estado equivalente.

---

<a id="p12"></a>
## P12 — Auditoria de estrutura, isolamento e BYOK

**Objetivo:** pagar a dívida técnica e confirmar, com evidência, que o isolamento por usuário e o uso da chave de cada um estão corretos — não é opcional, é a validação final do que P0 e P3 prometeram.

```
Faça uma auditoria do código atual antes de continuarmos. Não adicione nenhuma feature nova.

1. Liste os arquivos com mais de 200 linhas e quebre-os em componentes ou módulos menores, respeitando a estrutura de pastas das System Instructions.
2. Verifique e corrija: nenhum arquivo em src/ importa @google/genai nem contém uma chave de API fixa.
3. Verifique e corrija: nenhum componente de chat ou de extração chama repositórios de escrita diretamente — todo caminho passa por aplicarProposta.
4. Verifique e corrija: toda rota em server/index.ts passa pela verificação de token antes de tocar em qualquer dado, e toda chamada de IA passa por server/ia/index.ts (chamarIA), resolvendo o provedor a partir de /usuarios/{uid}/perfil/config.provedor_ia no servidor — nunca uma variável de ambiente do servidor, nunca uma chave vinda direto do corpo da requisição sem checar o dono. Liste as rotas auditadas.
5. Verifique e corrija: todo repositório em src/data/repositorios/ e toda regra em firestore.rules restringe o caminho a /usuarios/{uid}/, sem exceção. Rode de novo o teste de escrita cruzada do P0 e confirme que continua sendo rejeitado.
6. Verifique e corrija: nenhum arquivo do app é armazenado via Firebase Storage em nenhum ponto do código — toda leitura/escrita de arquivo passa pela Drive API usando o refresh_token do usuário. Confirme que o servidor nunca grava o conteúdo de um arquivo em disco ou em variável de módulo (só em memória durante a requisição em curso).
7. Procure no código qualquer faixa de referência, valor "normal" ou intervalo clínico embutido (hardcoded). Se existir, remova e me aponte onde estava.
8. Procure as palavras "grave", "preocupante", "perigoso", "urgente", "crítico", "anormal" em textos visíveis ao usuário. Substitua por linguagem factual e calma.
9. Elimine os `any` restantes e resolva os avisos do TypeScript.
10. Confirme que toda resposta vinda do servidor é validada com zod antes de virar objeto de domínio.

Ao final, me entregue um relatório curto do que encontrou e corrigiu, item por item — com destaque separado para os itens 4, 5 e 6 (isolamento, BYOK e Drive), porque são os que garantem que nada fica vinculado à minha conta.
```

**Aceite:** recebo o relatório, o app continua funcionando igual, e os itens 2 a 6 vêm sem pendências — em especial a repetição do teste de escrita cruzada do P0 e a confirmação de que nenhum arquivo é retido pelo servidor.

---

<a id="p13"></a>
## P13 — Privacidade, permissões e conformidade

**Objetivo:** o que precisa estar no ar antes de qualquer pessoa de fora usar.

```
Implemente a camada de transparência e conformidade.

1. Tela /privacidade, acessível pelo rodapé e pelos Ajustes, em português simples e sem juridiquês, cobrindo: que a IA é opcional e o app funciona sem ela, onde os dados estruturados ficam (Firestore do Salus App, isolados por login — cada usuário só acessa a própria conta), onde os documentos originais ficam (Google Drive do próprio usuário, numa pasta que só o app acessa — o mantenedor nunca vê nem guarda esses arquivos), o que sai do dispositivo e quando (se o usuário cadastrou um provedor de IA, o conteúdo enviado para análise vai à API daquele provedor usando a chave própria do usuário, não uma do mantenedor), que o mantenedor do app não acessa os dados estruturados no uso normal mas tem acesso técnico de administrador do Firestore, o que o Salus nunca faz (diagnosticar, prescrever, vender dado), como exportar, como desconectar o Drive, como trocar ou remover o provedor de IA, e como apagar a conta por completo (deixando claro que os arquivos no Drive não são apagados), e a recomendação de backup periódico.

2. Disclaimer clínico no rodapé de toda análise, resumo ou resposta gerada por IA: "Gerado por inteligência artificial a partir dos seus documentos. Não substitui avaliação profissional." Deve acompanhar o texto quando o usuário copiar ou exportar.

3. Em metadata.json, declare requestFramePermissions com "microphone" e "camera" se a gravação de áudio e a captura de foto estiverem ativas. Peça a permissão só no momento do uso, com uma frase explicando por quê.

4. Trate os erros de forma humana: falha de rede, chave de API inválida ou sem cota, cota do Firestore excedida, Drive desconectado ou acesso revogado (com botão para reconectar, sem perder dado), arquivo não suportado, arquivo grande demais, sessão expirada. Cada um com mensagem clara e o que fazer em seguida. Nunca uma tela branca.

5. Adicione um aviso claro sempre que uma ação de IA falhar por falta de chave cadastrada, com um botão direto para Ajustes.
```

**Aceite:** desligo a rede e tento organizar um documento — recebo uma mensagem clara em vez de um erro técnico; removo minha chave em Ajustes e tento usar o chat — recebo o aviso certo, não um erro genérico; a tela de privacidade está acessível de qualquer lugar.

---

<a id="p14"></a>
## P14 — Roteiro de verificação

**Objetivo:** conferir o que não dá para ver olhando a tela.

```
Escreva e execute uma bateria de verificação do Salus App.

1. Crie testes unitários (vitest) para as funções puras:
   - src/dominio/alertas.ts: item vencido ontem, vencendo hoje, em 30 dias, em 89 dias, em 91 dias, e sem data. Inclua virada de ano e fevereiro de ano bissexto.
   - src/dominio/indice.ts: o snapshot não inclui documento original nem histórico completo, e limita os marcadores-chave.
   - src/dominio/proposta.ts: medicamento de receita nunca resulta em status em_uso sem a confirmação; itens desmarcados não são gravados; falha no meio da transação não deixa dado parcial.
   - export → import → export produz o mesmo conteúdo.

2. Complete docs/QA.md (crie se ainda não existir a partir do P18) com um roteiro manual cobrindo: login/logout, onboarding bloqueado sem consentimento, uma segunda conta Google não vê os dados da primeira, uso completo do app sem nenhuma chave de IA cadastrada (P18), troca entre provedores de IA em Ajustes incluindo um preset gratuito (P17), upload de PDF, upload de foto, upload de áudio, proposta com membro incerto, confirmação parcial, receita marcada como prescrita, chat registrando vacina, export/import, exclusão de conta com oferta de export, e recarregar a página em cada etapa.

3. Rode os testes e corrija o que falhar. Me mostre o resultado.
```

**Aceite:** todos os testes passam; `docs/QA.md` existe; eu percorro o roteiro manual e anoto o que falhar.

---

<a id="p15"></a>
## P15 — Publicação

**Objetivo:** o app na mão de outras pessoas — com cada uma cuidando dos próprios dados e da própria cota de IA, não da sua.

```
Prepare o Salus App para publicação.

1. Modo experimentar sem compromisso: habilite login anônimo no Firebase Authentication (Auth Anônimo), com um botão "Experimentar sem criar conta" na tela de Login. A sessão anônima usa exatamente o mesmo isolamento por uid que uma conta Google — os dados dela também ficam isolados. Mostre uma faixa fixa avisando: "Você está em modo experimental, sem conta. Se limpar os dados do navegador ou trocar de aparelho, isso pode ser perdido — crie uma conta Google para manter tudo em segurança." Ofereça um botão "Ver com dados de exemplo" que chama semearDadosDeExemplo.

2. Confirme que não existe nenhum caminho no app que funcione sem chave própria do usuário para os recursos de IA — isso já deveria estar garantido pelo P12, mas reverifique aqui especificamente pensando num usuário desconhecido usando o app pela primeira vez.

3. Tela "Sobre": o que é o Salus, link para o repositório no GitHub, licença MIT, autor, a explicação de que existe também a versão em arquivos para quem quer rodar 100% local, que o app funciona sem IA nenhuma, e que quando o usuário opta por IA, usa a própria chave de um provedor à escolha (com opções gratuitas) e o próprio Google Drive — o mantenedor do app não vê, não guarda e não paga pelo uso ou pelos arquivos de ninguém.

4. Revise o README do projeto do app: como usar (com e sem IA), onde obter uma chave gratuita (Gemini, Groq, OpenRouter ou Mistral), como o Drive é conectado (uma vez só), e as limitações (dado estruturado vive no Firestore do app, arquivos vivem no seu próprio Drive — reforce a recomendação de exportar periodicamente).

5. Rode uma verificação final de build e corrija qualquer erro pendente.
```

**Aceite:** abro a URL compartilhada em janela anônima, consigo entrar em modo "experimentar sem conta" e ver a Família Exemplo; sem chave cadastrada, nenhum recurso de IA funciona silenciosamente — todos pedem a chave com clareza; não vejo erro 403.

**Depois do P15, fora do AI Studio:**

1. **Share** → testar a URL em janela anônima, com uma conta Google diferente da sua, e em outro dispositivo. Confirme que uma conta não vê os dados da outra.
2. **Deploy to Cloud Run** se for para uso real com tráfego — como o custo de IA é de cada usuário (BYOK) e os arquivos vivem no Drive de cada um, o que resta sob sua responsabilidade é só o consumo leve de Firestore/Auth do seu projeto Firebase (ver §8 de `00_ARQUITETURA.md`).
3. **Push to GitHub** — use uma branch/pasta separada (ex: `app/`) para não colidir com o pacote npm `salus-ai`. Lembre: o AI Studio envia para o GitHub, mas **não puxa** mudanças de volta.
4. Revise as regras de segurança do Firestore uma última vez no console do Firebase, e confirme no Google Cloud Console que o app OAuth do Drive está configurado corretamente (tela de consentimento, escopo `drive.file`), antes de divulgar amplamente — é a peça que garante que "cada usuário é dono dos próprios dados e arquivos" continue verdadeiro sob tráfego real.

---

<a id="p16"></a>
## P16 — Painel de administração (só para você)

**Objetivo:** acompanhar a saúde do produto sem abrir o console do Firebase e sem, em nenhuma hipótese, ver dado clínico de outra conta.

```
Implemente um painel de administração restrito a você, sem nenhuma visibilidade sobre dados clínicos ou arquivos de outras contas.

1. No servidor, defina a lista de e-mails administradores como um secret (ex: ADMIN_EMAILS, separado por vírgula) configurado nas Secrets do AI Studio — nunca em código versionado nem em coleção do Firestore editável pelo cliente.

2. Crie a rota GET /api/admin/resumo: verifica o token do usuário (server/auth/verificarToken.ts), confere se o e-mail decodificado do token está em ADMIN_EMAILS; se não estiver, responde 403. Se estiver, usa o Firebase Admin SDK (que tem acesso irrestrito ao projeto, mas só é chamado aqui, só para quem está na lista) para devolver: número total de contas criadas, número de contas criadas nos últimos 30 dias, quantas contas têm o Google Drive conectado (drive_refresh_token preenchido), quantas têm algum provedor de IA cadastrado (provedor_ia preenchido) e a distribuição por tipo (gemini vs openai_compat, sem saber qual serviço específico), e a versão do app (de package.json). NUNCA leia ou devolva nome de membro, exame, medicamento, conteúdo de documento, chave de API ou o e-mail de qualquer usuário que não seja você.

3. No cliente, a rota /admin só aparece na barra lateral e só é acessível se GET /api/admin/resumo responder com sucesso — caso contrário, redirecione para o Painel normal sem mensagem de erro alarmante (só não mostra o link).

4. A tela /admin mostra os números acima em cards simples, mais um link para o repositório GitHub e para o changelog do projeto. Nenhuma tabela de usuários, nenhum e-mail de usuário, nenhum dado de família ou arquivo aparece aqui.

5. Adicione ao README uma nota explicando como configurar ADMIN_EMAILS nas Secrets do AI Studio.
```

**Aceite:** logado com meu e-mail (configurado em ADMIN_EMAILS), vejo o link `/admin` e os números agregados, incluindo quantas contas conectaram o Drive; logado com uma conta de teste que não está na lista, não vejo o link e, se tentar acessar `/admin` diretamente pela URL, sou redirecionado ao Painel sem ver nada.

---

<a id="resgate"></a>
## Prompts de resgate

Use quando algo quebrar. Sempre prefira o resgate a reescrever a feature do zero.

**A build quebrou / a preview não carrega**
```
Corrija todos os erros de build e de tipo do código atual. Não adicione nem remova funcionalidades — só faça compilar e rodar. Me liste o que estava quebrado.
```

**O agente virou tudo um arquivo só**
```
O arquivo [NOME] ficou grande demais. Quebre-o segundo a estrutura de pastas das System Instructions, sem mudar nenhum comportamento. Só mova código; não reescreva lógica.
```

**Ele mudou o que eu não pedi**
```
No último turno você alterou [X], que eu não pedi. Reverta essa alteração mantendo apenas [Y], que era o pedido original.
```

**A IA está inventando dado clínico**
```
Auditoria do Núcleo Clínico. Verifique todos os prompts em server/prompts/ e confirme, um a um: (1) NUCLEO_CLINICO está concatenado; (2) há instrução explícita de nunca completar informação ausente; (3) faixa de referência só pode vir do laudo; (4) medicamento de receita sempre entra como prescrito. Mostre o texto atual de cada prompt e corrija o que estiver faltando.
```

**Algo gravou sem eu confirmar**
```
Rastreie todos os caminhos de escrita no Firestore e no Google Drive do usuário. Liste cada lugar que chama um repositório de escrita ou a Drive API e quem o aciona. Qualquer caminho que parta de uma resposta de IA sem passar por aplicarProposta é um bug — corrija e me mostre a lista.
```

**Arquivo do usuário apareceu no Firebase em vez do Drive dele**
```
Rastreie todo uso de Firebase Storage no código (imports, referências a bucket, chamadas a getStorage/uploadBytes ou equivalentes). Este app não deve ter nenhum. Se encontrar, substitua pelo fluxo de Drive (server/drive/clienteDrive.ts do P4.5) e me mostre onde estava.
```

**Suspeita de vazamento entre contas (prioridade máxima — pare tudo e rode isso)**
```
Preciso confirmar o isolamento entre usuários agora. Faça, nesta ordem: (1) me mostre o conteúdo atual de firestore.rules; (2) confirme que toda regra restringe o caminho por request.auth.uid == uid do documento acessado, sem exceção; (3) repita o teste do P0 — logado, tente escrever em /usuarios/{outroUid}/teste e confirme que é rejeitado; (4) verifique se algum repositório em src/data/repositorios/ monta um caminho sem usar o uid do usuário autenticado; (5) verifique se alguma rota do servidor usa uma chave de IA fixa de ambiente, ou o refresh_token/provedor_ia de outro usuário que não o dono do token verificado, em vez de resolver sempre a partir do uid autenticado. Relate cada item com o resultado exato — não prossiga para outro prompt até isso vir limpo.
```

**IA parece obrigatória / app trava sem chave cadastrada**
```
Audite o app inteiro atrás de qualquer tela, botão ou fluxo que fique inacessível ou quebrado quando não há provedor_ia cadastrado em /usuarios/{uid}/perfil/config. Isso viola a regra 9 do Núcleo Clínico. Liste cada ponto encontrado e corrija para que só o Chat e a extração automática de documentos (nunca o resto do app) dependam de IA, sempre com uma explicação calma em vez de travar.
```

**Antes de mudanças grandes**
```
Antes de implementar, me descreva em até 10 linhas o que vai mudar e em quais arquivos. Não escreva código ainda — espere eu aprovar.
```

---

<a id="v2"></a>
## Prompts da v2 (depois do MVP no ar)

**V1 — Cruzar (evolução de marcadores)**
```
Implemente a tela Cruzar: escolher membro e marcador, ver a evolução em gráfico de linha (recharts) com os valores e as faixas do laudo, tendência descrita de forma factual (subiu/desceu/estável) sem interpretar causa, e a opção de salvar como Análise com data/hora e tabela de fontes. Cruzamento entre membros só é permitido entre membros com vinculo 'biologico' — bloqueie e explique quando não for o caso.
```

**V2 — Preparar consulta**
```
Implemente "Preparar consulta": escolher membro e especialidade, gerar um resumo de uma página com medicamentos em uso, alergias, condições, últimos exames relevantes à especialidade, eventos dos últimos 6 meses e uma lista de perguntas sugeridas. Layout otimizado para impressão e exportação em PDF, com o disclaimer no rodapé.
```

**V3 — Revisão periódica**
```
Implemente a revisão semestral: quando perfilConfig.proxima_revisao chegar, o Painel sugere revisar. Fluxo membro a membro confirmando se medicamentos, condições e vacinas continuam válidos, regenerando a agenda e atualizando as datas de revisão.
```

**V4 — Árvore da família**
```
Implemente a tela Árvore: diagrama das relações familiares (pessoas e pets) a partir do campo relacoes. Não exiba o campo vinculo no diagrama.
```

**V5 — PWA e offline**
```
Transforme em PWA instalável com service worker, e habilite a persistência offline nativa do Firestore (enableIndexedDbPersistence ou equivalente) para que os dados já sincronizados fiquem disponíveis sem rede. O app deve abrir e permitir consultar dados offline; só as funções que chamam o Gemini e as escritas ainda não sincronizadas ficam sujeitas à reconexão, com aviso claro.
```

**V6 — Criptografia ponta-a-ponta (opcional, para quem quiser privacidade máxima)**
```
Avalie e proponha, sem implementar ainda, como cifrar no navegador os campos mais sensíveis (nome, condições, exames) antes de gravar no Firestore, com uma chave derivada de algo que só o usuário tem — de forma que nem o administrador do projeto Firebase consiga ler o conteúdo bruto. Liste o que isso quebraria no app atual (ex: busca por texto, extração por IA de dados já salvos) antes de decidirmos se vale a pena.
```

**V7 — Acesso compartilhado por família (ex: cônjuge vendo os mesmos dados)**
```
Avalie, sem implementar ainda, como permitir que mais de uma conta (login) acesse a mesma central de saúde — por exemplo, marido e esposa vendo e editando os mesmos perfis. Isso muda o tenant de "conta" para "família com uma lista de acessos" e exige: nova estrutura de dados, novas regras de segurança, fluxo de convite (quem convida, como o convidado aceita, quem pode remover acesso), e uma decisão sobre se a chave de API do Gemini continua por conta (recomendado, para preservar "cada um paga o próprio uso") mesmo quando os dados são compartilhados. Descreva o plano de migração a partir do modelo atual (uma conta = uma central de saúde) antes de decidirmos implementar — não é uma mudança pequena, então vale planejar com calma quando o MVP de conta única já estiver estável e em uso.
```
