---
name: finalizar-prompt
description: 'Use ao final de cada ciclo de implementação em Salus. Roda testes, verifica build, atualiza documentação, e comita + faz push das mudanças.'
argument-hint: '[nome da tarefa concluída, ex: "P0-1"]'
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
---

# Finalizar Prompt — Salus App

<objective>
Ao final de cada ciclo de implementação, encerrar o ciclo de trabalho em 4 etapas obrigatórias, nesta ordem:
1. Testes e verificação de build (lint, type-check, test)
2. Atualização da documentação (docs/ e AUDITORIA_ARQUITETURAL.md se relevante)
3. Commit das alterações com mensagem clara
4. Push para o repositório (opcional, confirma com usuário)

Não pule etapas. Se uma etapa falhar, pare e corrija antes de avançar para a próxima.
</objective>

<context>
Argumento: $ARGUMENTS — identifica qual tarefa/feature está sendo encerrada (ex: "P0-1", "feature X"). Se vazio, infira pelo `git status` e `git log` recente o que foi implementado nesta sessão.

Diretório de trabalho: `/home/jls/Documentos/PROJETOS/Salus`
App: `/home/jls/Documentos/PROJETOS/Salus/app`
</context>

<process>

## 1. Testes e verificação de build

Objetivo: verificar que o código está saudável e não quebrou nada.

1. Na pasta `/app`, rode a suíte de validação do projeto:

   ```bash
   npm run lint          # oxlint
   npm run lint:arch     # dependency-cruiser
   npm run build         # tsc -b && vite build
   npm run test          # vitest run
   ```

2. Se qualquer verificação falhar:
   - Leia a mensagem de erro com cuidado
   - Corrija o código
   - Re-rode as verificações
   - Só então avance para a próxima etapa

## 2. Atualizar documentação

1. Identifique se a alteração impacta:
   - Arquitetura (componentes, estrutura de pastas, padrões de dependência) → atualizar `docs/app-aistudio/00_ARQUITETURA.md`
   - Estado da auditoria ou remediação → atualizar `AUDITORIA_ARQUITETURAL.md`
   - Configuração/setup → atualizar `.env.example` e docs de configuração

2. Releia o trecho correspondente em cada arquivo afetado. Se houver inconsistências, atualize.

3. Se o commit introduz uma variável de ambiente nova, adicione em `app/.env.example`.

## 3. Commit das alterações

1. Rode `git status` e `git diff` para revisar tudo que será commitado.
2. Selecione os arquivos específicos (não `git add -A`):
   ```bash
   git add arquivo1.ts arquivo2.md ...
   ```

3. Crie um commit com mensagem clara em português, focando no "porquê" e "o quê":
   - Exemplo: `feat: add dependency-cruiser for architectural enforcement`
   - Exemplo: `docs: update architecture spec for P0 stabilization`

4. **Não faça commit de `.env` ou secrets.**

## 4. Push para repositório

1. Pergunte ao usuário: "Posso commitar e fazer push dessas mudanças?"
2. Se aprovado, rode:
   ```bash
   git push
   ```
   Nunca use `--force` nem `--no-verify` sem permissão explícita.

</process>

<output>
Ao final, resuma em poucas linhas:
- O que foi testado/verificado (lint, build, tests)
- Quais docs foram atualizados
- Hash do commit e se foi feito push
</output>
