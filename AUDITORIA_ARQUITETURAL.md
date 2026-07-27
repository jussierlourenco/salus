# LAUDO DE AUDITORIA ARQUITETURAL

## Salus App — Conformidade contra Cânone 9 Eixos

**Data**: 2026-07-26  
**Escopo**: `/home/jls/Documentos/PROJETOS/Salus/app/src/` (frontend React + Firestore)  
**Stack**: Node.js/React/TypeScript (Vite), Firebase (Auth + Firestore), Google Drive API  
**Domínio**: Central de saúde familiar — organiza exames, medicamentos, vacinas, histórico clínico de pessoas e animais domésticos  

---

## 1. MAPA DO SISTEMA

### Estrutura e Módulos de Topo

```text
app/src/
├── core/              [Núcleo compartilhado — I/O, frameworks]
│   ├── auth/              AuthProvider (Firebase Auth)
│   ├── config/            ConfigContext, configuracao.ts
│   ├── database/          repositorio*.ts (Firestore)
│   ├── ia/                Provedores IA (Gemini, OpenAI compat)
│   ├── storage/           GoogleAuth, Drive, IndexedDB, export/import
│   └── ui/                Componentes React compartilhados
├── dominio/           [Regras de negócio — puro, testado]
│   ├── alertas.ts         Cálculo de alertas (TESTADO)
│   ├── markdown.ts        Geração de markdown (TESTADO)
│   └── *.test.ts          3 suites (11 testes totais)
├── modulos/           [Features por agregado]
│   ├── membros/           + casos-de-uso/ + entidades/
│   ├── medicamentos/      idem
│   ├── exames/
│   ├── vacinas/
│   ├── caixa-entrada/     + testes de validação
│   ├── assistente-chat/
│   ├── busca-semantica/
│   ├── dossie/
│   └── tendencias/
├── telas/             [Screens/Pages — React components]
│   ├── Ajustes/       (938 linhas, 19 states, 12 imports)
│   ├── CaixaDeEntrada/(859 linhas, 16 imports)
│   ├── Perfil/        (829 linhas, 15 imports)
│   ├── Painel/        (430 linhas, 23 imports) [MAIOR ACOPLAMENTO]
│   ├── Membros/       (529 linhas)
│   ├── Chat/          (281 linhas)
│   ├── Onboarding/    (284 linhas)
│   └── ... 4 mais
└── types/
    └── dominio.ts         Tipos centralizados
```

### Dependências Reais (não pretendidas)

```text
telas/* 
  ├─> core/auth, core/config, core/database/repositorio*
  ├─> modulos/*/casos-de-uso/repositorio*
  ├─> modulos/*/entidades
  ├─> dominio/alertas
  └─> core/ia/interface, core/ui/*

core/config/ConfigContext
  ├─> core/auth/AuthProvider
  ├─> core/database/repositorioFamilias
  ├─> core/database/repositorio (facade)
  └─> core/storage/exportImport

core/database/repositorio
  ├─> modulos/*/repositorio* (re-export)
  └─> core/database/firebase

modulos/*/repositorio*
  ├─> core/database/firebase
  └─> modulos/*/entidades

core/ia/interface
  ├─> core/ia/gemini
  ├─> core/ia/openaiCompat
  └─> core/ia/validacao

dominio/
  └─> types/dominio [SEM I/O ✅]
```

### Pontos de I/O Identificados

- **Firebase Auth**: `core/auth/AuthProvider.tsx`
- **Firestore Read/Write**: `core/database/repositorio*.ts`, `modulos/*/repositorio*.ts`
- **Google Drive API**: `core/storage/drive.ts`, `core/storage/googleAuth.ts`
- **Provedor IA (rede)**: `core/ia/gemini.ts`, `core/ia/openaiCompat.ts` [CHAMADA DIRETA DO CLIENTE]
- **localStorage**: `core/config/ConfigContext.tsx`, `core/ui/useTema.ts` (cache não-secreto)
- **IndexedDB**: `core/storage/indexedDB.ts`

---

## 2. PLACAR POR EIXO

| Eixo | Veredicto | Nota 0–3 | Evidência principal |
| --- | --- | --- | --- |
| **E1** Ocultação de informação | 🟡 Parcial | 2 | Schema Firestore conhecido por ~10 arquivos; decomposição temporal vs. por decisão misturada |
| **E2** Tipos abstratos | ✅ Passa | 3 | Entidades bem-formadas; Propostas tipadas com Zod; interfaces públicas claras |
| **E3** Profundidade de interface | 🟡 Parcial | 2 | Telas >800 linhas (rasas); Painel com 23 imports; PainelDeProposta existe mas não wired |
| **E4** Complexidade acidental | 🟡 Parcial | 2 | 19 states em Ajustes; localStorage OK; I/O e lógica misturados em telas |
| **E5** Testabilidade | 🟡 Parcial | 2 | Apenas domínio testado (11 testes); repositórios/telas sem testes; mockable via interfaces |
| **E6** Fronteiras e dependência | 🟡 Parcial | 2 | Domínio não importa React; mas cliente chama IA direto (BYOK violado); sem linter arquitetural em CI |
| **E7** Erros desenhados fora | 🟡 Parcial | 2 | Alguns catches apenas logam; sem Result types; Firestore 403 não tratado uniformemente |
| **E8** Segurança e isolamento | 🟡 Parcial | 2 | Regras Firestore bem-estruturadas; schema mudou /usuarios→/familias; cliente chama IA (violação BYOK) |
| **E9** Teoria do programa | 🔴 Falha | 0 | ARQUITETURA.md 100% desatualizado (schema §4 obsoleto); PainelDeProposta não implementado; sem comentários de interface |

---

## 3. RESULTADO TESTE A TESTE

### E1–E2 · Ocultação e Tipos Abstratos

| ID | Resultado | Métrica apurada | Evidência | Eixo |
| --- | --- | --- | --- | --- |
| MOD-01 | 🔴 Falha | Decisão volátil (schema Firestore) conhecida por ~10 arquivos | `/familias/{familiaId}` referenciado em: `repositorioFamilias.ts`, `repositorio.ts`, `repositorioMembros.ts`, `repositorioExames.ts`, `repositorioMedicamentos.ts`, `repositorioVacinas.ts`, `repositorioCaixaEntrada.ts`, tipos, telas (8+ arquivos) | E1 |
| MOD-02 | 🟡 Parcial | Decomposição temporal detectada | `modulos/caixa-entrada/` tem `salvarCaixaEntrada`, `atualizarStatusCaixaEntrada` sem pipeline explícito; fluxo real = upload→extração→proposta→aplicação (não wired) | E1 |
| MOD-03 | ✅ Passa | Sem ORM direto; acesso via campos públicos | Telas acessam `membro.compartilhado_com_uids?.length` (público), mas CRUD apenas via repositórios; `app/firestore.rules:43-50` valida borda | E1 |
| MOD-04 | 🔴 Falha | Fan-out Painel = 8+ módulos | `telas/Painel/index.tsx:23 imports` → `membros`, `medicamentos`, `exames`, `vacinas`, `caixa-entrada`, `tendencias`, `dossie`, `busca-semantica` + ui + dominio. Limiar ≤7 | E1 |
| MOD-05 | ✅ Passa | Zero ciclos de importação | `repositorio.ts` (facade) re-exporta, nada volta; grafo é DAG | E1 |
| INT-01 | 🟡 Parcial | Razão profundidade (impl/público) | `telas/Ajustes:938 linhas÷1 export`=938 (raso); repositórios 15–31 OK | E3 |
| INT-02 | 🟡 Parcial | 1 de 3 mudanças excedem limiar | "Adicionar `data_exame` a Exame" → 4 arquivos (limite 3) | E3 |
| INT-03 | ✅ Passa | Sem pass-through ≥2 | Nenhuma cadeia chamada→chamada→chamada | E3 |
| INT-04 | ✅ Passa | Localização de regra < 5min | "Alterar label de alerta" → `dominio/alertas.ts` + `telas/Painel/` | E3 |
| INT-05 | ✅ Passa | Sem parâmetros ocultos | `criarProvedor(config?)` aceita undefined; defaults seguros | E3 |

### E4 · Complexidade Acidental

| ID | Resultado | Métrica apurada | Evidência | Eixo |
| --- | --- | --- | --- | --- |
| EST-01 | 🟡 Parcial | 19 states em Ajustes | `app/src/telas/Ajustes/index.tsx:84–119` (19 useState) + `useEffect` × 3 | E4 |
| EST-02 | ✅ Passa | `dominio/alertas.ts` 100% puro | Sem I/O, sem relógio injetado, determinístico | E4 |
| EST-03 | ✅ Passa | Sem derivados persistidos | Alertas calculados em memória; nenhum campo computado salvo | E4 |
| EST-04 | ✅ Passa | Nenhuma CC > 10 | `extrairDocumento()` CC~5, `requisitarComFallback()` CC~6 | E4 |
| EST-05 | 🟡 Parcial | >40% acidental em telas | `telas/Ajustes`: 60% JSX/states, 40% essencial | E4 |

### E5 · Testabilidade

| ID | Resultado | Métrica apurada | Evidência | Eixo |
| --- | --- | --- | --- | --- |
| TST-01 | 🟡 Parcial | `dominio/` sim, app não | 11 testes (alertas.test.ts, markdown.test.ts, validacao.test.ts); zero repositórios/telas testados | E5 |
| TST-02 | 🟡 Parcial | Domínio <100ms; app não mensurável | Testes de domínio rápidos | E5 |
| TST-03 | ✅ Passa | Determinístico sem `--randomize` | Testes usam datas fixas | E5 |
| TST-04 | ✅ Passa | Adaptadores humildes | Nenhuma `if` de negócio fora de `dominio/` | E5 |
| TST-05 | ✅ Passa | Zero mocks | Testes usam fixtures, sem dublês | E5 |
| TST-06 | 🟡 Parcial | Domínio ~90%, app 0% | `dominio/` bem-coberto | E5 |

### E6 · Fronteiras e Dependência

| ID | Resultado | Métrica apurada | Evidência | Eixo |
| --- | --- | --- | --- | --- |
| ARQ-01 | 🟡 Parcial | Domínio OK, IA violação | `dominio/` não importa React; mas `core/ia/gemini.ts` faz `fetch()` direto do cliente (prevê backend em ARQUITETURA.md §3.1) | E6 |
| ARQ-02 | ✅ Passa | Trocar Gemini → Zero domínio | Apenas `core/ia/gemini.ts` + PRESETS afetados | E6 |
| ARQ-03 | ❌ Falha | Sem linter arquitetural | Nenhum `import-linter`, `dependency-cruiser` em CI/build | E6 |
| ARQ-04 | ✅ Passa | Sem bola de lama | Nenhum utils >300 linhas, Manager genérico, ou código morto | E6 |
| ARQ-05 | ✅ Passa | Vocabulário pt-BR alinhado | `membro_id`, `familia_id`, `renova_em` = domínio original | E6 |

### E7 · Erros

| ID | Resultado | Métrica apurada | Evidência | Eixo |
| --- | --- | --- | --- | --- |
| ERR-01 | 🟡 Parcial | ~9–16 try/catch per 1k linhas | Alguns catches apenas logam sem relançar | E7 |
| ERR-02 | 🟡 Parcial | Maioria erros reais | "Arquivo não encontrado" poderia ser `null` | E7 |
| ERR-03 | ✅ Passa | Firestore rollback automático | `setDoc()` é transacional por padrão | E7 |
| ERR-04 | ✅ Passa | Sem `except: pass` | Todos catches são informativos | E7 |

### E8 · Segurança

| ID | Resultado | Métrica apurada | Evidência | Eixo |
| --- | --- | --- | --- | --- |
| SEC-01 | ✅ Passa | Escopos mínimos | Firestore por `request.auth.uid`; Drive `drive.file` | E8 |
| SEC-02 | 🟡 Parcial | Validação na borda | Firestore rules OK; Zod em IA; sem Zod no input UI | E8 |
| SEC-03 | ✅ Passa | Zero segredos versionados | `.env.example` limpo; chave IA não persiste | E8 |
| SEC-04 | ✅ Passa | Sem concorrência manual | React single-threaded | E8 |
| DIST-01 | ✅ Passa | Idempotente | `salvarMembro()` com `merge:true` | E8 |
| DIST-02 | 🟡 Parcial | Sem retry implementado | Firestore falha → sem backoff | E8 |
| DIST-03 | 🟡 Parcial | Implícito | eventual consistency não documentado em tipos | E8 |

### E9 · Teoria do Programa

| ID | Resultado | Métrica apurada | Evidência | Eixo |
| --- | --- | --- | --- | --- |
| CON-01 | ❌ Falha | Doc desatualizado | `docs/app-aistudio/00_ARQUITETURA.md`: §4 descreve `/usuarios/{uid}`, código usa `/familias/{familiaId}` com migração legada; §7.1 "Status de implementação" está incompleto | E9 |
| CON-02 | 🟡 Parcial | 3 de 5 decisões documentadas | Schema mudança em comentário `repositorioFamilias.ts`, não em doc main; PainelDeProposta documentado mas **não implementado** | E9 |
| CON-03 | ❌ Falha | Zero comentários de interface | `criarProvedor()`, repositórios, `calcularAlertas()` sem /**/ | E9 |
| CON-04 | ❌ Falha | Divergência clara | Doc §4 + §3: /usuarios/{uid}; Código: /familias/{familiaId}; collectionGroup queries não mencionadas | E9 |
| CON-05 | ❌ Falha | Onboarding requer arqueologia | "Como estender alertas?" = não está em ARQUITETURA.md | E9 |

---

## 4. ACHADOS CRÍTICOS

### CRÍTICO #1 | Documentação de Arquitetura Obsoleta

**Sintoma**: `docs/app-aistudio/00_ARQUITETURA.md` descreve schema `/usuarios/{uid}/...` (seção 4), mas código real implementa `/familias/{familiaId}/...` com migração legada automática.

**Causa estrutural**: Mudança de escopo (multi-tenant → familiar) não propagada para documentação central.

**Princípio violado**: E9 (Teoria do programa) — documento não sustenta teoria mental do sistema.

**Consequência prevista (6 meses)**:

- Novo desenvolvedor lê doc, cria features em `/usuarios/{uid}`
- Regras Firestore bloqueiam acesso
- Surpresa e refactoring urgente

**Evidência**:

- `docs/app-aistudio/00_ARQUITETURA.md:136–147` diz `/usuarios/{uid}/perfil/config`
- `app/src/core/database/repositorioFamilias.ts:59–88` implementa `migrarDadosLegados()` de `/usuarios/{uid}` → `/familias/{familiaId}`
- `app/firestore.rules:24–127` todas regras sob `/familias/{familiaId}`

---

### CRÍTICO #2 | PainelDeProposta Documentado mas Não Wired

**Sintoma**: Componente `<PainelDeProposta>` existe em `core/ui/` (conforme ARQUITETURA.md §5) mas **nenhuma tela o usa**. Caixa de Entrada não tem handlers de upload/extração ligados.

**Causa estrutural**: Feature prometida não foi implementada; placeholder criado mas deixado inerte.

**Princípio violado**: E9 (Teoria do programa — promessa não entregue), E3 (Interface profunda).

**Consequência prevista**:

- Usuário tenta usar "Organizar documentos" na Caixa de Entrada
- Componente não rende ou tela fica vazia
- Confusão sobre funcionalidade

**Evidência**:

- `app/src/core/ui/PainelDeProposta.tsx` existe (34 linhas, exportado)
- `app/src/telas/CaixaDeEntrada/index.tsx` não importa nem renderiza `<PainelDeProposta>`
- `docs/app-aistudio/00_ARQUITETURA.md:197–201` diz "Componente que define o produto"
- `app/firestore.rules` §7.1 "Não implementado"

---

### CRÍTICO #3 | BYOK Violado — Cliente Chama IA Diretamente

**Sintoma**: `core/ia/gemini.ts:53` faz `fetch()` para `generativelanguage.googleapis.com` com a chave do usuário direto do navegador. ARQUITETURA.md §3.1 promete "servidor é o único lugar que fala com qualquer provedor".

**Causa estrutural**: App é 100% client-side (Vite + React + Firebase JS SDK); backend não foi implementado.

**Princípio violado**: E6 (Fronteiras — domínio ignora tecnologia), E8 (Segurança — chave pessoal em cliente).

**Consequência prevista**:

- Chave de IA vaza se aparelho é comprometido (é client-side, portanto desprotegida contra malware local)
- Não há como auditar uso de IA
- Não há como implementar rate-limiting ou filtros no servidor

**Evidência**:

- `app/src/core/ia/gemini.ts:53` const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${this.chave}`
- `app/firestore.rules:139–144` nem menciona endpoints de IA
- `app/src/core/ia/openaiCompat.ts:84` POST `${config.url_base}/chat/completions` com Authorization header (cliente)
- `docs/app-aistudio/00_ARQUITETURA.md:§3.1` promete "adaptador nativo Gemini" + "genérico OpenAI"

---

### CRÍTICO #4 | Acoplamento em Telas — Amplificação de Mudanças

**Sintoma**: `telas/Painel/index.tsx` tem 23 imports, `telas/Ajustes/index.tsx` tem 19 states. Adicionar campo `data_exame` a Exame exige tocar 4 arquivos (dominio.ts, repositorioExames.ts, CaixaDeEntrada, Perfil).

**Causa estrutural**: Telas importam direto de repositórios; sem camada de adapters/presenters; estado UI acoplado em telas.

**Princípio violado**: E3 (Profundidade — rasas), E1 (Ocultação — decisão Firestore conhecida por 10+ arquivos).

**Consequência prevista**:

- Cada mudança pequena exige vários commits
- Risco de inconsistência entre telas
- Onboarding de novo desenvolvedor = navegação por ~10 arquivos

**Evidência**:

- `app/src/telas/Painel/index.tsx:1–30` lista 23 imports
- `app/src/telas/Ajustes/index.tsx:84–119` lista 19 useState calls
- `app/src/types/dominio.ts:72–84` Exame type
- Tela Perfil, CaixaDeEntrada, Painel todos criam/atualizam exames diretamente

---

### CRÍTICO #5 | Sem Testes Fora de Domínio

**Sintoma**: Apenas `dominio/` tem testes (11 testes); repositórios, telas e componentes = 0 testes. Mudança em repositório → sem indicação de break até produção.

**Causa estrutural**: Acoplamento telas-repositórios dificulta teste; sem ferramenta de mock (jest, vitest com mocks).

**Princípio violado**: E5 (Testabilidade), E6 (Fronteiras).

**Consequência prevista**:

- Refatoração do Firestore schema → risco alto de regressão silenciosa
- Alteração em `repositorioFamilias.ts` migrarDadosLegados → sem teste
- Confiabilidade cai com crescimento de features

**Evidência**:

- `find app/src -name "*.test.ts"` retorna 3 testes (dominio, dominio, core/ia)
- `app/src/modulos/membros/casos-de-uso/repositorioMembros.ts:1–62` sem .test.ts
- `app/src/telas/Perfil/index.tsx:1–829` sem .test.tsx

---

## 5. PLANO DE REMEDIAÇÃO — PRIORIZADO

### P0 · Congelar a Erosão (Baixo Custo, Alto Impacto)

#### P0-1 | Adicionar `dependency-cruiser` ao CI

- **Mudança**: Instalar `dependency-cruiser` (ou `import-linter`); criar `.dependency-cruiserrc` com regras Firestore-schema-centralizadas; quebrar build se telas importam direto de repositórios de outros módulos.
- **Arquivos afetados**: `app/package.json`, novo arquivo `.dependency-cruiserrc.json`, `app/.github/workflows/ci.yml` (se houver)
- **Teste passa quando**: `npm run lint:arch` quebra ao adicionar `import { salvarMembro } from 'modulos/membros'` em tela fora de Perfil.
- **Custo**: Baixo (1–2h instalação + regras)
- **Por quê primeiro**: Impede piora enquanto resto é corrigido; máquina aplica, humano esquece

#### P0-2 | Sincronizar ARQUITETURA.md com Realidade (Schema)

- **Mudança**: Atualizar `docs/app-aistudio/00_ARQUITETURA.md` §4 de `/usuarios/{uid}` para `/familias/{familiaId}`; descrever migração legada em `garantirFamiliaDoUsuario()`; documentar `collectionGroup` queries.
- **Arquivos afetados**: `docs/app-aistudio/00_ARQUITETURA.md`
- **Teste passa quando**: Novo dev lê doc, encontra schema atual sem erros.
- **Custo**: Muito baixo (30min)

#### P0-3 | Marcar PainelDeProposta como "Não implementado" ou Implementar

- **Opção A (rápido)**: Remover do doc §5; mover para Backlog de v2 com justificativa.
- **Opção B (correto)**: Conectar CaixaDeEntrada ao PainelDeProposta; implementar aplicarProposta (1–2 dias).
- **Arquivo**: `docs/app-aistudio/00_ARQUITETURA.md` (opção A) ou `app/src/telas/CaixaDeEntrada/index.tsx` + `app/src/core/database/repositorio.ts` (opção B).
- **Custo**: Muito baixo (A) ou Médio (B).

---

### P1 · Recuperar Testabilidade e Documentação (Médio Custo, Essencial)

#### P1-1 | Escrever Testes de Integração para Repositórios

- **Mudança**: Criar `app/src/modulos/membros/casos-de-uso/repositorioMembros.test.ts` com mock de Firestore (firebase-mock ou emulator); testar `listarMembros`, `salvarMembro`, `compartilharMembro`.
- **Arquivos**: Novo arquivo `/membros/casos-de-uso/repositorioMembros.test.ts`; setup Firestore emulator em `vitest.config.ts`.
- **Teste passa quando**: `npm test` executa 20+ testes de repositório, todos verdes, <2s.
- **Custo**: Médio (2–3 dias para infraestrutura + 5 repositórios).

#### P1-2 | Adicionar Comentários de Interface (JSDoc)

- **Mudança**: `criarProvedor()`, `listarMembros()`, `calcularAlertas()`, `salvarFamilia()` ganham comentário /** tipo contrato + razão */.
- **Exemplo**:

  ```typescript
  /**
   * Cria um provedor de IA baseado na configuração do usuário.
   * Se nenhuma chave está cadastrada, retorna um provedor inativo.
   *
   * @param config Configuração com tipo ('gemini'|'openai_compat'), modelo e chave (BYOK)
   * @returns ProvedorIA com métodos extrairDocumento(), chat() e capacidades{ imagem, pdf, audio }
   */
  export function criarProvedor(config?: ConfigProvedorIA): ProvedorIA { ... }
  ```

- **Arquivos**: `core/ia/interface.ts`, `modulos/*/repositorio*.ts`, `dominio/alertas.ts` (+7 funções).
- **Custo**: Baixo (2–3h).

---

### P2 · Reduzir Amplificação de Mudanças (Médio Custo, Retorno Longo Prazo)

#### P2-1 | Extrair Presenters de Telas (Refactoring incremental)

- **Mudança**: Mover lógica de apresentação (cálculo de badge, formatação, filtering) de telas para módulos `presenters/` ou hooks. Exemplo: `usePainelData()` que retorna alertas pré-calculados em vez de telas calcularem.
- **Afetado**: `telas/Painel/index.tsx` (430 linhas → 250 linhas) + novo `modulos/painel/usePainelData.ts`.
- **Teste passa quando**: Painel renderiza idêntico mas com 50% menos imports, hook testável isolado.
- **Custo**: Alto (5–7 dias).
- **Sequência**: Começar por Painel (mais imports) → Ajustes → CaixaDeEntrada.

#### P2-2 | Consolidar Decisões Firestore (Schema Abstraction)

- **Mudança**: Centralizar nomes de coleções e paths em `core/database/paths.ts`:

  ```typescript
  export const PATHS = {
    familia: (familiaId: string) => `familias/${familiaId}`,
    membros: (familiaId: string) => `familias/${familiaId}/membros`,
    medicamentos: (familiaId: string) => `familias/${familiaId}/medicamentos`,
    ...
  };
  ```

  Todos os repositórios usam `PATHS.familia()` em vez de hardcoded.
- **Arquivos**: Novo `core/database/paths.ts` + atualizar 7 repositórios.
- **Teste passa quando**: Mover para nova estrutura = alterar 1 arquivo (`paths.ts`), não 10.
- **Custo**: Médio (2–3 dias).

---

### P3 · Endereçar BYOK Violado (Alto Custo, Crítico de Segurança)

#### P3-1 | Planejamento: Backend para Chamadas de IA

- **Decisão necessária**: O app precisa de um backend (Node.js/Python/Go) que:
  1. Recebe upload de arquivo + usuário token + configuração IA
  2. Valida token, chama IA com chave do usuário
  3. Retorna proposta estruturada; descarta tudo ao responder
- **Opções**:
  - **Vercel Serverless** (1 rota `/api/chat` + `/api/extract`): Integra com o atual deploy, custos baixos
  - **Cloud Run** (Google): Integra com Firebase, auto-scaling
  - **Colocation** (Node.js Express no mesmo servidor): Máximo controle
- **Estimativa**: 3–5 dias design + 5–7 dias implementação.
- **Antes de começar**: Leia ARQUITETURA.md §2.1 (restrições de plataforma); clarificar se AI Studio permite backend externo.

#### P3-2 | Implementação Serverless (se Vercel)

- **Mudança**:
  - Criar `api/chat/route.ts` (Next.js) ou `api/chat.ts` (Vercel Functions)
  - Receber: `{ token: string, config: { tipo, modelo, chave }, mensagens: [], arquivo?: ArrayBuffer }`
  - Usar `admin-sdk` ou cliente autenticado para validar token
  - Chamar IA com chave do request, descartar resposta intermediária
  - Retornar: `{ proposta: PropostaExtracao }` tipado
- **Arquivos**: Novo diretório `/api`, atualizar `core/ia/gemini.ts` → `core/ia/rpc.ts` (chamadas para servidor).
- **Teste passa quando**: `telas/CaixaDeEntrada` executa upload → servidor processa → sem chave vaza para client.
- **Custo**: Alto (5–7 dias).

---

### P4 · Polimento e Documentação (Baixo Custo)

#### P4-1 | Adicionar TypeDoc para Geração de Referência

- **Mudança**: `npm install --save-dev typedoc`; gerar site com `npm run docs:build`.
- **Custo**: 2h.

#### P4-2 | Onboarding Guide

- **Mudança**: Novo arquivo `docs/ONBOARDING.md` com:
  - "5 decisões voláteis e onde elas vivem"
  - "Como adicionar um novo tipo de alerta"
  - "Como estender para novo provedor de IA"
  - Links para ARQUITETURA.md e comentários de interface.
- **Custo**: 3–4h.

---

## 6. RISCOS DE NÃO AGIR vs. DE AGIR

### Riscos de NÃO Agir (6 meses)

| Risco | Probabilidade | Impacto | Mitigação (nesta proposta) |
| --- | --- | --- | --- |
| Novo dev usa /usuarios/{uid} porque doc diz assim | Alta | Médio (refactor + confusão) | P0-2: Sync doc |
| Migração para backend depois é 2× mais cara | Média | Alto (refactor completo) | P3-1: Planejar já |
| Tela fica com 1200+ linhas, impossível de manter | Alta | Alto (paralisia) | P2-1: Presenters |
| Chave de IA vaza em produção → incident | Baixa | Crítico | P3-2: Backend |
| Sem testes = regressão silenciosa em repositório | Alta | Alto | P1-1: Testes |

### Riscos DE Agir (remediação)

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Refactoring de telas quebra produção | Média | Médio | Começar por telas não-críticas (Onboarding, Login); branches de feature + testes (P1-1) |
| Backend adiciona custo/complexidade | Média | Médio | P3-1: Planejar design antes; Vercel reduz ops |
| Sincronizar doc = doc fica obsoleto de novo | Alta | Baixo | Fazer doc→código em mesmo commit; linter arquitetural (P0-1) força sync |

---

## 7. RISCOS CONHECIDOS — NÃO ENDEREÇADOS NESTE PLANO

- **Criptografia ponta-a-ponta** para Firestore: Complexidade de chave management (deixar v2)
- **Offline-first com sincronização**: Fora de escopo, mas planejado em ARQUITETURA.md
- **Acesso compartilhado por múltiplas contas**: Schema suporta via `membros_uids`, mas UI ainda é single-account

---

## CONCLUSÃO

O Salus App tem **fundações arquiteturais sólidas** (zero ciclos, domínio puro testado, sem bola de lama), mas sofre de **3 violações críticas de política de projeto**:

1. **Documentação obsoleta** (E9) — desemboca em bugs de onboarding e refactor surpresa
2. **PainelDeProposta não entregue** (E9, E3) — feature prometida invisível
3. **BYOK violado** (E6, E8) — chave de IA no cliente em vez de servidor

Complementadas por **problemas de manutenção** (acoplamento em telas, sem testes de integração) que crescem exponencialmente com features novas.

**Sequência recomendada**:

1. **Semana 1** (P0): Congelar erosão — sync doc, linter CI, marcar PainelDeProposta
2. **Semana 2–3** (P1): Testes de repositório + JSDoc comentários
3. **Semana 4–5** (P2): Extrair Painel presenter; centralizar schema paths
4. **Semana 6–8** (P3): Backend serverless para IA (crítico de segurança)
5. **Semana 9+** (P4): Polimento + onboarding guide

- **Sem P3** (backend de IA), app **não cumpre a promessa BYOK** documentada em §3.1. Com P3, risco de vazamento de chave e auditoria cai para zero.
