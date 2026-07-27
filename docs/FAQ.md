# Perguntas Frequentes — Salus App

> Este FAQ cobre o **Salus App** (a versão web, em `app/`) — login com Google, telas, Firestore. Para a versão framework (arquivos `.md` locais lidos por um assistente de IA no editor), veja o [README.md](../README.md) e o [COMECE_AQUI.md](../COMECE_AQUI.md) na raiz do repositório.

---

## Sobre o Salus

**O que é o Salus?**
Uma central de saúde para a família inteira — pessoas, cães e gatos. Ele organiza exames, medicamentos, vacinas, consultas e documentos originais (PDFs, fotos, áudios) em um só lugar, e permite conversar em linguagem natural sobre esse histórico.

**Existem duas versões — qual é a diferença?**
| | Framework (raiz do repo) | Salus App (`app/`) |
|---|---|---|
| Onde vive o dado | Arquivos Markdown + `Familia/_index.yaml`, no seu computador | Firestore (nuvem), isolado por família |
| Quem executa a lógica | A IA do seu editor (Claude, Gemini, Cursor...) via skills | O próprio app (React) |
| Interface | Chat livre no editor | Telas web + chat embutido |
| Instalação | `npx salus-ai init` | Login com Google no navegador |

Os dois compartilham o mesmo modelo de dados e são compatíveis via export/import `.zip`, então dá para migrar de um para o outro.

**O Salus faz diagnóstico médico?**
Não. O Salus **organiza, arquiva e cruza informações de saúde**. Ele não diagnostica, não prescreve e não substitui a avaliação de um médico ou veterinário. Sempre que algo parecer alterado, o app sugere mostrar a um profissional.

---

## Contas e acesso

**Como eu entro no app?**
Login com conta Google, na tela `/login`. Não existe cadastro por e-mail/senha separado.

**Fiz login mas caí em uma tela "Aguardando aprovação" — o que é isso?**
Contas novas nascem com status `pending` em `admin_usuarios`. Um administrador precisa aprovar o acesso em `/admin/usuarios` antes de você poder usar o app. Isso existe porque o Salus é multi-tenant e o dono da instância controla quem entra.

**Quem é administrador?**
Só o e-mail cadastrado como admin (fixo nas regras do Firestore) enxerga `/admin/usuarios` e pode aprovar/negar contas.

**Depois de aprovado, o que acontece?**
Você passa por um consentimento LGPD e depois pelo onboarding: cadastro dos membros da família (pessoas e pets), parentesco e vínculo biológico/adotivo.

**Posso compartilhar o perfil de um membro específico com outra pessoa (ex.: cuidador, ex-cônjuge) sem dar acesso à família toda?**
Sim. Cada membro tem uma lista própria de `compartilhado_com_uids`. Quem está nessa lista lê/escreve medicamentos, exames, vacinas e eventos **daquele membro**, sem ver o resto da família.

---

## Dados, privacidade e segurança

**Onde ficam guardados meus dados?**
Dados clínicos estruturados (membros, medicamentos, exames, vacinas, eventos) ficam no Firestore, isolados por família via regras de segurança. Os **arquivos originais** (PDF, foto, áudio) nunca ficam em um servidor do mantenedor — ficam no **Google Drive do próprio usuário**, numa pasta "Salus App" que o app cria com o escopo mais restrito possível (`drive.file`: o app só enxerga os arquivos que ele mesmo criou).

**O app guarda meu token do Google Drive?**
Não de forma persistente. O token de acesso dura cerca de 1 hora e fica só em memória durante a sessão — nunca é salvo em `localStorage` nem no Firestore. Ao recarregar a página, o app tenta renovar silenciosamente; se não conseguir, pede para reconectar.

**Minha chave de IA fica exposta?**
Ela é salva em texto simples no Firestore, protegida apenas pela regra de acesso por família (não é criptografada). Isso é uma decisão de design documentada, aceitável para o modelo BYOK (a chave é sua, o custo é seu) — mas vale saber disso antes de colar uma chave com permissões amplas.

**Existe algum campo que a IA nunca deveria inventar?**
Sim, dois em especial:
- **`faixa_referencia_laudo`** (faixa de referência de um exame): só é copiada literalmente do laudo, nunca calculada pela IA. Se estiver vazia, a UI mostra "faixa não informada" em vez de inventar um valor.
- **`vínculo`** (biológico/adotivo/enteado): nunca aparece na Ficha por privacidade; só é usado internamente para decidir o que entra no cruzamento genético entre membros.

**Toda saída da IA vira gravação automática no meu histórico?**
Não deveria — o princípio do produto é que nenhuma gravação de IA é direta: toda proposta passa por uma tela de confirmação (valor atual → valor novo, com Confirmar/Editar/Descartar) antes de tocar o banco.

---

## IA e chave de API (BYOK)

**Preciso pagar para usar o Salus?**
O app em si é gratuito. A parte que pode ter custo é a IA (extração de documentos e Chat), e você usa a **sua própria chave** de um provedor (BYOK — Bring Your Own Key). Todos os provedores suportados têm camada gratuita.

**Quais provedores de IA são suportados?**
- **Google Gemini** (recomendado) — free tier generoso, com suporte a imagem e PDF, ideal para a Caixa de Entrada.
- **Groq** — muito rápido, bom para o Chat.
- **OpenRouter** — vários modelos gratuitos (sufixo `:free`).
- **Mistral** — camada gratuita "Experiment" limitada.

Qualquer outro provedor compatível com a API "Chat Completions" da OpenAI também funciona, informando URL base e modelo.

**Onde eu cadastro minha chave?**
Em **Ajustes → Provedor de IA**. Cole a chave e clique em "Testar Conexão" antes de salvar.

**E se eu não quiser cadastrar chave nenhuma?**
O app funciona normalmente pelo caminho manual — você digita tudo. Só ficam indisponíveis: o Chat e a extração automática de documentos na Caixa de Entrada (que viraria preenchimento manual).

**Quem paga pelo uso da IA?**
Sempre o usuário dono da chave, nunca o mantenedor do app — é o ponto central do modelo BYOK.

---

## Documentos e Caixa de Entrada

**Como eu adiciono um exame, receita ou laudo novo?**
Vá em **Caixa de Entrada**, envie o arquivo (PDF, foto ou áudio). Com uma chave de IA configurada, o app tenta extrair automaticamente medicamentos, exames, vacinas ou eventos e monta uma proposta para você revisar e confirmar antes de gravar.

**A extração automática é confiável?**
Trate como um rascunho, não como verdade absoluta — sempre revise a proposta antes de confirmar, especialmente valores de exames e datas. O app também avisa quando a data extraída do documento diverge muito da data atual, como checagem de sanidade.

**Um medicamento encontrado numa receita já entra como "Em uso"?**
Não automaticamente. Ele entra como "Prescrito" e só muda para "Em uso" depois que você confirma que comprou/está tomando.

---

## Uso do dia a dia

**O que é o Diário, na Ficha de cada membro?**
Uma aba dentro do Perfil do membro para registrar rapidamente sintomas, medicações tomadas, medições (pressão, peso etc.), vacinas ou notas de consulta, organizados por dia num calendário e numa linha do tempo.

**Como vejo o que está vencendo (vacina, receita, check-up)?**
No **Painel**, a tela inicial mostra o raio-x da família: o que já venceu, o que vence em 30 dias e o que vence em 31–90 dias. Esse cálculo é local (não depende de IA).

**Posso exportar meus dados para sair do app sem perder nada?**
Sim. Em **Ajustes**, há exportação/importação em `.zip` no mesmo formato usado pela versão framework (Markdown) — pensado deliberadamente para evitar vendor lock-in.

**O app funciona offline ou no celular?**
É um PWA (instalável), mas depende de internet para ler/gravar no Firestore — não há um modo totalmente offline com sincronização posterior.

**Tem tema escuro?**
Sim, claro/escuro em **Ajustes**.

---

## Problemas comuns

**Cliquei em "Conectar Google Drive" e nada acontece / aparece um aviso.**
Provavelmente a instância do app não tem o `VITE_GOOGLE_CLIENT_ID` configurado. Sem essa variável, a integração com Drive fica desabilitada — o resto do app (incluindo upload manual, se aplicável) continua funcionando.

**O Google mostra um aviso "app não verificado" ao conectar o Drive.**
Normal enquanto a instância está em modo de teste no Google Cloud Console — só quem foi adicionado como "usuário de teste" consegue prosseguir. Isso é resolvido publicando o app (não exige verificação pesada, pois o escopo usado é o mais restrito possível).

**Encontrei um bug ou quero sugerir algo — para onde vai?**
Abra uma issue no repositório do projeto (ou fale com quem administra sua instância do Salus).
