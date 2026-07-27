# Tutorial Completo — Salus App

> Guia passo a passo do **Salus App** (versão web, `app/`). Para a versão framework (Markdown + IA no editor), veja o [COMECE_AQUI.md](../COMECE_AQUI.md) na raiz do repositório.

---

## 1. Antes de começar

Você vai precisar de:
- Uma **conta Google**, para fazer login.
- (Opcional, mas recomendado) Uma **chave de API de um provedor de IA** — sem ela o app funciona, mas sem Chat e sem extração automática de documentos. Veja o passo 9.
- Se for rodar localmente: Node.js instalado, e as credenciais de Firebase configuradas (veja [CONFIGURACAO.md](../app/CONFIGURACAO.md)).

Rodando localmente:
```bash
cd app
npm install
npm run dev
```

---

## 2. Primeiro acesso: login e aprovação

1. Abra o app — você cai em **`/login`**. Clique para entrar com sua conta Google.
2. Se for a primeira vez que esse e-mail acessa esta instância, você cai em **"Aguardando aprovação"**. O acesso ao Salus é controlado por um administrador (o e-mail configurado como admin da instância) — sem a aprovação dele, o restante do app fica bloqueado.
3. Depois de aprovado, na próxima vez que você logar, o app te leva direto para o **Consentimento LGPD**: leia e aceite para prosseguir.

---

## 3. Onboarding — montando a família

Na primeira vez, o app guia um cadastro inicial:
1. **Cadastro dos membros**: adicione as pessoas e os pets (cães/gatos) da família.
2. **Parentesco e vínculo**: para cada membro, defina a relação com os demais e o vínculo (`Biológico`, `Adotivo`, `Enteado`). O vínculo biológico é o que habilita o cruzamento de histórico genético entre parentes — ele nunca aparece na Ficha, é só um controle interno.

Depois desse passo você entra no app propriamente dito, na tela **Painel**.

---

## 4. Painel — o raio-x da família

É a tela inicial (`/`). Mostra, sem precisar de nenhuma chave de IA (o cálculo é 100% local):
- O que está **vencido**, **vencendo em 30 dias** e **vencendo em 31–90 dias** (vacinas, receitas, check-ups).
- Medicamentos ativos da família.
- Atalhos para tendências, dossiê médico e busca semântica, se você expandir as seções.

Use esta tela como ponto de partida de qualquer sessão: "o que precisa da minha atenção hoje?".

---

## 5. Cadastrando e editando membros

Vá em **Membros** no menu:
- Adicione uma pessoa ou pet novo (tipo: pessoa, cão, gato ou outro).
- Edite alergias, condições ativas, relações de parentesco.
- Clique em um membro para abrir o **Perfil** dele.

---

## 6. Perfil de um membro

Ao abrir `/membro/:id`, você vê abas:

| Aba | Para que serve |
|---|---|
| **Ficha** | Resumo de 1 página: tipo sanguíneo, alergias, condições, vacinas, contatos de emergência. |
| **Medicamentos** | Lista de medicamentos em três status: `Em uso`, `Prescrito`, `Descontinuado`. |
| **Exames** | Tabela evolutiva de marcadores de exame e sinais vitais (peso, pressão, glicemia etc.), com a faixa de referência tal como veio do laudo. |
| **Diário** | Linha do tempo do dia a dia — veja o passo 7. |
| **Histórico** | Linha do tempo geral de tudo que aconteceu com esse membro. |
| **Documentos** | Arquivos originais (exames, laudos, receitas, áudios) associados a esse membro. |

### Registrando algo manualmente
Em Medicamentos, Exames ou Vacinas, use o botão de adicionar para criar um registro na mão — não depende de IA nem de upload de documento.

---

## 7. Usando o Diário

Dentro do Perfil de um membro, na aba **Diário**:

1. Escolha o dia no **calendário em tira** no topo (por padrão, hoje).
2. Filtre por tipo se quiser: Todos, Remédios, Sintomas, Medições, Vacinas, Consultas.
3. Toque no botão **+** (canto inferior direito) para abrir o formulário de novo registro:
   - **Tipo**: sintoma, remédio, medição, vacina, consulta ou outro.
   - **Título** (obrigatório): ex. "Dor nas costas", "Losartana 50mg", "Pressão arterial".
   - **Horário** e **Valor** (opcionais): ex. "128/82 mmHg", "1 comprimido".
   - **Notas** (opcional): contexto adicional.
4. Clique em **Registrar**. O item aparece imediatamente na linha do tempo do dia selecionado.

O Diário é o lugar mais rápido para anotar algo no calor do momento, sem precisar passar por upload de documento.

---

## 8. Caixa de Entrada — subindo documentos

Vá em **Caixa de Entrada** para processar exames, receitas, laudos, fotos ou áudios de orientação médica:

1. Envie o arquivo (PDF, imagem ou áudio).
2. **Se você tem uma chave de IA configurada** (veja passo 9): o app tenta extrair automaticamente medicamentos, exames, vacinas e/ou eventos do documento e monta uma **proposta**.
3. Revise a proposta: cada item extraído (medicamento, exame, vacina, evento) aparece para você **aceitar ou descartar** individualmente, agrupado por tipo.
4. Preste atenção a avisos de **inconsistência temporal** — o app sinaliza quando a data do documento parece muito diferente de hoje, para você confirmar que não é engano.
5. Confirme para gravar os itens aceitos no histórico do membro correto.

**Sem chave de IA configurada**, a extração automática não roda — você preenche os campos manualmente a partir do mesmo documento, o que ainda assim deixa o arquivo original organizado e associado ao membro certo.

Medicamentos encontrados em receitas entram como **"Prescrito"**, nunca direto como "Em uso" — a mudança de status exige sua confirmação separada de que já comprou ou está tomando.

---

## 9. Configurando a IA (BYOK) em Ajustes

Vá em **Ajustes → Provedor de IA**:

1. Escolha um provedor: **Gemini** (recomendado), **Groq**, **OpenRouter**, **Mistral**, ou "compatível com OpenAI" (informando URL base e modelo).
2. Pegue uma chave grátis no site do provedor (o app tem um link direto em "Como conseguir uma chave grátis"):
   - Gemini: https://aistudio.google.com/apikey
   - Groq: https://console.groq.com/keys
   - OpenRouter: https://openrouter.ai/settings/keys
   - Mistral: https://console.mistral.ai/api-keys
3. Cole a chave no campo, clique em **"Testar Conexão"**.
4. Salve. A partir daqui, o **Chat** e a **extração automática** da Caixa de Entrada passam a funcionar.

A chave é sua — fica associada só à sua conta, e qualquer custo de uso é seu, não do mantenedor do app.

---

## 10. Conversando com o Chat

Vá em **Chat** (requer chave de IA configurada) para fazer perguntas em linguagem natural sobre o histórico da família, por exemplo:
- "Como está a saúde do Rex?"
- "O colesterol do Alberth melhorou desde o ano passado?"
- "Alguma vacina ou receita está vencendo?"

Quando a resposta envolver gravar algo novo, o Chat propõe o registro inline para você confirmar — nenhuma escrita acontece sem essa confirmação.

---

## 11. Conectando o Google Drive (opcional)

Em **Ajustes → Google Drive**, clique em **"Conectar Google Drive"**:
- Abre um pop-up de consentimento do Google.
- Uma pasta "Salus App" é criada no seu próprio Drive, e é lá (não em um servidor do mantenedor) que os documentos originais enviados na Caixa de Entrada ficam guardados.
- O acesso concedido é o mais restrito possível: o app só enxerga os arquivos que ele mesmo cria.
- A sessão de acesso dura cerca de 1 hora; ao expirar, o app tenta renovar sozinho ou pede para reconectar.

Se essa seção mostrar um aviso em vez do botão, é porque a instância do app não tem a integração configurada (`VITE_GOOGLE_CLIENT_ID`) — o resto do app continua funcionando normalmente.

---

## 12. Exportando e importando dados

Em **Ajustes → Exportar/Importar**:
- **Exportar** gera um `.zip` no formato compatível com a versão framework (Markdown) — útil para backup ou para migrar para a versão local.
- **Importar** lê um `.zip` nesse mesmo formato e recria os registros.

---

## 13. Compartilhando o perfil de um membro

Se você precisa dar acesso a alguém (ex.: outro cuidador) só aos dados de **um** membro específico, sem abrir a família toda, isso é feito por membro (`compartilhado_com_uids`) — consulte quem administra sua instância sobre como conceder esse acesso pela tela correspondente.

---

## 14. Administração (só para o admin da instância)

Em **`/admin/usuarios`** (visível só para o e-mail cadastrado como administrador):
- Aprovar ou negar contas novas que pediram acesso.
- Essa é a única tela de administração disponível — não há um painel de métricas agregadas da família.

---

## 15. Preferências gerais

Em **Ajustes** você também encontra:
- **Tema** claro/escuro.
- **Privacidade / LGPD**: revisão do consentimento dado no onboarding.

---

## Lembrete final

O Salus organiza e cruza informação de saúde — ele **não diagnostica nem substitui** avaliação médica ou veterinária. Use-o para chegar mais preparado à consulta, não para decidir tratamento sozinho.
