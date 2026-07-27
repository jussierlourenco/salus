# Blueprint — Salus App

> Documento técnico de arquitetura do **Salus App** (`app/`), a versão web multi-tenant do framework Salus. Reflete o estado real do código em `app/src` (não o plano aspiracional de `docs/app-aistudio/`, que diverge em pontos marcados abaixo). Última verificação: 2026-07-27.

---

## 1. O que é

Central de saúde da família (pessoas, cães e gatos): organiza exames, medicamentos, vacinas e histórico clínico. Existe em **duas formas irmãs**, com o mesmo modelo de dados (`_index.yaml` ⇄ Firestore) para permitir export/import bidirecional:

| | Framework (raiz do repo) | **Salus App** (`app/`) |
|---|---|---|
| Onde vive o dado | Arquivos `.md` + `Familia/_index.yaml` locais | Firestore, isolado por família |
| Quem executa a lógica | A IA do usuário (Claude/Gemini/Cursor), via skills em `.agents/skills/` | O próprio app (React SPA) |
| Interface | Chat livre no editor/IDE | Telas web (SPA) + chat embutido |
| Instalação | `npx salus-ai init` | Login com Google, direto no navegador |

Este blueprint cobre o **Salus App**.

---

## 2. Stack

- **Frontend**: React 19 + TypeScript + Vite 8, roteado com `react-router-dom` v7, estilizado com Tailwind v4 (`@tailwindcss/vite`).
- **Dados**: Firebase Auth (login Google) + Firestore (dado clínico estruturado). Não há backend próprio — **é um SPA 100% client-side**, o Firebase JS SDK roda direto no navegador.
- **Arquivos originais** (PDF/foto/áudio): Google Drive do próprio usuário, via Google Identity Services (`core/storage/googleAuth.ts`) — token de acesso de curta duração mantido só em memória, sem `refresh_token` persistido em nenhum lugar.
- **IA (BYOK — Bring Your Own Key)**: cada usuário cadastra a própria chave de um provedor (Gemini nativo, ou qualquer provedor compatível com Chat Completions da OpenAI — Groq, OpenRouter, Mistral, etc). Chamado **direto do navegador** (ver §6, divergência conhecida).
- **Validação**: Zod nas respostas de IA antes de virarem propostas de gravação.
- **Qualidade**: Vitest (testes), oxlint (lint), dependency-cruiser (regras arquiteturais — `lint:arch`), PWA via `vite-plugin-pwa`.
- **Deploy**: Vercel (`vercel.json`) e/ou Firebase Hosting (`firebase.json`).

---

## 3. Arquitetura de código (`app/src/`)

```
src/
├── core/              núcleo compartilhado — I/O e frameworks, sem regra de negócio
│   ├── auth/              AuthProvider (Firebase Auth)
│   ├── config/            ConfigContext (onboarding, consentimentos, provedor de IA)
│   ├── database/          repositorio.ts (facade), repositorioFamilias.ts, repositorioUsuarios.ts
│   ├── ia/                interface.ts (contrato), gemini.ts, openaiCompat.ts, validacao.ts (Zod)
│   ├── storage/           googleAuth.ts, drive.ts, indexedDB.ts, exportImport.ts (.zip)
│   └── ui/                Botao, Campo, Card, Badge, EstadoVazio, AppShell, PainelDeProposta*
├── dominio/           regras de negócio puras, sem I/O, 100% testadas
│   ├── alertas.ts         cálculo de vencido / vencendo em 30d / 31-90d
│   ├── markdown.ts        geração de markdown (compat. export/import)
│   └── useAlertas.ts
├── modulos/           uma pasta por agregado, cada uma com casos-de-uso/ + entidades/
│   ├── membros/ · medicamentos/ · exames/ · vacinas/   (CRUD completo)
│   ├── caixa-entrada/     upload → extração → proposta (fluxo parcialmente ligado, ver §6)
│   ├── assistente-chat/
│   ├── busca-semantica/
│   ├── dossie/            DossieMedico.tsx
│   └── tendencias/         GraficoTendencia, PainelTendencias, TabelaComparativa
├── telas/             uma pasta por rota (screens)
│   Login · Onboarding · ConsentimentoLGPD · AguardandoAprovacao · Painel ·
│   Membros · Perfil · CaixaDeEntrada · Chat · Ajustes · AdminUsuarios
└── types/dominio.ts   tipos centralizados, nomes em português (espelham o _index.yaml)
```

**Regra de dependência**: `dominio/` não importa React nem I/O; `telas/` conhece `core/*` e `modulos/*`; `modulos/*/casos-de-uso` fala só com `core/database/firebase`. Sem ciclos de import (verificado — grafo é DAG). `dependency-cruiser` roda como `npm run lint:arch` para checar isso continuamente.

### Rotas (`App.tsx`)

```
/login
/aguardando                      (conta pendente de aprovação)
/consentimento-lgpd
/onboarding
/                (AppShell)
  /membros
  /membro/:id                    (Perfil — abas Ficha·Medicamentos·Exames·Histórico·Documentos)
  /caixa-de-entrada
  /chat
  /ajustes
  /admin/usuarios
```

---

## 4. Modelo de dados (Firestore)

Nomes de campo em português, 1:1 com o `_index.yaml` do framework original, para tornar o export/import trivial.

```
/familias/{familiaId}                       doc: nome, membros_uids[], criado_por, criado_em
/familias/{familiaId}/membros/{id}          + compartilhado_com_uids[] (acesso cruzado por membro)
/familias/{familiaId}/medicamentos/{id}
/familias/{familiaId}/vacinas/{id}
/familias/{familiaId}/eventos/{id}
/familias/{familiaId}/exames/{id}
/familias/{familiaId}/caixa_entrada/{id}     metadado; arquivo em si vive no Drive do usuário
/familias/{familiaId}/config/{id}           onboarding_concluido, consentimentos, provedor_ia, drive_pasta_raiz_id
/admin_usuarios/{uid}                        status (pending|approved|denied), admin, familia_id
/usuarios/{uid}/...                          legado — migrado automaticamente por migrarDadosLegados()
```

**Entidades principais** (`types/dominio.ts`):

| Entidade | Campos-chave |
|---|---|
| `Membro` | `tipo` (pessoa\|cao\|gato\|outro), `vinculo` (biologico\|adotivo\|enteado), `condicoes_ativas[]`, `alergias[]`, `relacoes[]` |
| `Medicamento` | `status` (em_uso\|prescrito\|descontinuado), `renova_em` |
| `Vacina` | `aplicada_em`, `proxima_em` |
| `Exame` | `marcador`, `valor`, `faixa_referencia_laudo` (**string livre do laudo, nunca calculada**), `flag` |
| `Evento` | linha do tempo livre (consulta, sintoma, cirurgia, ...) |
| `Analise` | comparativos salvos com timestamp e `fontes[]` |
| `CaixaEntradaItem` / `PropostaExtracao` | pipeline upload → IA → proposta → confirmação |
| `ConfigProvedorIA` | `{ tipo: gemini|openai_compat, url_base?, modelo, chave }` — a chave BYOK do usuário |

Três campos exigem cuidado deliberado:
- **`vinculo`**: nunca exibido na Ficha (privacidade); só governa o cruzamento genético entre membros com vínculo biológico.
- **`faixa_referencia_laudo`**: nunca inferida pela IA — só copiada do laudo. Vazio ⇒ UI mostra "faixa não informada", nunca inventa.
- **`provedor_ia.chave`**: em texto simples no Firestore, protegida só pela regra de acesso (aceitável para BYOK; documentado na UI, não anunciado como criptografado).

### Regras de segurança (`app/firestore.rules`)

- Acesso por família: só `uid` presente em `membros_uids` do doc `/familias/{id}` lê/escreve suas subcoleções.
- **Compartilhamento granular por membro**: um `uid` fora da família pode ler/escrever `medicamentos`/`exames`/`vacinas`/`eventos` de um membro específico se estiver em `compartilhado_com_uids` daquele membro — sem enxergar o resto da família.
- `caixa_entrada` e `config`: acesso só para membros da família (sem granularidade por membro).
- `admin_usuarios/{uid}`: cada usuário só edita `familia_id` do próprio doc; e-mail admin (`jussier.silva@gmail.com`) hardcoded nas regras com acesso total.
- Negação geral (`match /{document=**} { allow read, write: if false }`) como fallback.
- ⚠️ Regras escritas mas **pendente de deploy** no projeto Firebase real (não verificável a partir daqui).

---

## 5. Fluxos principais

1. **Onboarding**: consentimento LGPD → cadastro de membros (pessoas/pets) → relações de parentesco/vínculo → aprovação de conta (gate `AguardandoAprovacao`, status em `admin_usuarios`).
2. **Painel**: raio-x visual — vencidos, vencendo em 30d/90d, medicamentos ativos — 100% local, nunca depende de IA (`dominio/alertas.ts`, puro e testado).
3. **Caixa de Entrada**: upload de documento → (se BYOK configurado) extração por IA → `PropostaExtracao` → confirmação explícita do usuário → grava no Firestore. **Sem chave de IA, o caminho é preenchimento manual** — mesmo poder de registro, sem o atalho de não digitar.
4. **Chat** (`assistente-chat`): perguntas em linguagem natural com propostas de registro inline; requer chave de IA.
5. **Ajustes**: escolha de provedor de IA (presets com metadados `suporta_imagem`/`suporta_pdf`/`suporta_audio`), export/import `.zip` compatível com o framework, tema claro/escuro, privacidade.
6. **Admin** (`/admin/usuarios`): aprovação de contas pendentes; visível só para o e-mail admin.

**Princípio inegociável**: nenhuma gravação de IA é direta — toda saída que toca dado deveria passar por `PainelDeProposta` (valor atual → valor novo, com Confirmar/Editar/Descartar). Só `Confirmar` chama o repositório.

---

## 6. Divergências conhecidas entre plano e código real

(Fonte: `AUDITORIA_ARQUITETURAL.md` de 2026-07-26 e `docs/app-aistudio/00_ARQUITETURA.md` §7.1)

| Área | Estado real |
|---|---|
| Servidor de IA | **Não existe.** `core/ia/gemini.ts` / `openaiCompat.ts` chamam o provedor **direto do navegador** com a chave do usuário — o plano original previa um backend intermediário. Correção exigiria criar um backend do zero (ex: rotas serverless). |
| `<PainelDeProposta>` | Componente existe em `core/ui/`, **não está ligado a nenhuma tela**. Caixa de Entrada ainda não dispara o fluxo upload→extração→proposta→aplicação ponta a ponta. |
| Credencial de Drive | Corrigida com desenho revisado: sem `refresh_token` persistido; token de curta duração só em memória via Google Identity Services. |
| Painel `/admin` de métricas agregadas | Não implementado (existe só `/admin/usuarios` para aprovação de contas). |
| Fan-out do Painel | `telas/Painel` importa de 8+ módulos (limiar recomendado ≤7) — maior acoplamento do app. |
| Cobertura de testes | Só `dominio/` é testado (11 testes); repositórios e telas sem testes. |
| Telas grandes | `Ajustes` (938 linhas, 19 states), `CaixaDeEntrada` (859 linhas), `Perfil` (829 linhas) — candidatas a decomposição. |
| Regras Firestore | Escritas e coerentes, mas **não confirmadamente deployadas** no projeto real. |

---

## 7. Segurança e privacidade — resumo operacional

- Isolamento por família via regras Firestore (não só código do app).
- Arquivos originais nunca tocam o projeto do mantenedor — vivem no Drive do próprio usuário (`drive.file`, escopo mais restrito).
- BYOK: custo de IA é do usuário, nunca do mantenedor do app.
- Export `.zip` no formato do framework é tratado como princípio de produto (não feature opcional) — mitiga vendor lock-in caso o app seja descontinuado.
- Disclaimer clínico obrigatório: o Salus **organiza**, não diagnostica nem prescreve.

---

## 8. Onde cavar mais fundo

- Plano de produto original e decisões de design: `docs/app-aistudio/00_ARQUITETURA.md`, `01_SYSTEM_INSTRUCTIONS.md`, `02_PROMPTS.md`.
- Auditoria de conformidade arquitetural (9 eixos): `AUDITORIA_ARQUITETURAL.md`.
- Configuração de credenciais (chave de IA por usuário, Client ID OAuth do Drive): `app/CONFIGURACAO.md`.
- Skill de auditoria contínua: `.agents/skills/auditoria-arquitetural/`.
