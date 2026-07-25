/**
 * Geração de Markdown — converte dados estruturados em arquivos .md
 * compatíveis com a árvore de pastas do framework Salus original.
 *
 * Essas funções são puras: recebem dados, devolvem string Markdown.
 */

import type { Membro, Medicamento, Exame, Vacina, Evento } from '../types/dominio';

// ── Helpers ──

function dataFormatada(data?: string): string {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function idade(nascimento?: string): string {
  if (!nascimento) return '';
  const nasc = new Date(nascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNasc = nasc.getMonth();
  if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < nasc.getDate())) {
    anos--;
  }
  return `${anos} anos`;
}

// ── Ficha.md ──

export function gerarFichaMd(membro: Membro): string {
  const tipoLabel = { pessoa: 'Pessoa', cao: 'Cão', gato: 'Gato', outro: 'Outro' }[membro.tipo];

  return `# ${membro.nome}

| Campo | Valor |
|---|---|
| **Tipo** | ${tipoLabel} |
| **Nascimento** | ${dataFormatada(membro.nascimento)}${membro.nascimento ? ` (${idade(membro.nascimento)})` : ''} |
| **Tipo Sanguíneo** | ${membro.tipo_sanguineo ?? 'Não informado'} |
${membro.raca ? `| **Raça** | ${membro.raca} |\n` : ''}${membro.peso_kg ? `| **Peso** | ${membro.peso_kg} kg |\n` : ''}
## Condições Ativas

${membro.condicoes_ativas.length > 0 ? membro.condicoes_ativas.map((c) => `- ${c}`).join('\n') : '_Nenhuma condição ativa registrada._'}

## Alergias

${membro.alergias.length > 0 ? membro.alergias.map((a) => `- ${a}`).join('\n') : '_Nenhuma alergia conhecida._'}

---
_Atualizado em ${dataFormatada(membro.atualizado_em)}_
`;
}

// ── Medicamentos.md ──

export function gerarMedicamentosMd(membro: Membro, medicamentos: Medicamento[]): string {
  const emUso = medicamentos.filter((m) => m.status === 'em_uso');
  const prescritos = medicamentos.filter((m) => m.status === 'prescrito');
  const descontinuados = medicamentos.filter((m) => m.status === 'descontinuado');

  const tabelaMed = (meds: Medicamento[]): string => {
    if (meds.length === 0) return '_Nenhum._\n';
    return `| Medicamento | Dose | Frequência | Desde | Renova em | Prescrito por |
|---|---|---|---|---|---|
${meds.map((m) =>
  `| ${m.nome} | ${m.dose ?? '—'} | ${m.frequencia ?? '—'} | ${dataFormatada(m.desde)} | ${dataFormatada(m.renova_em)} | ${m.prescrito_por ?? '—'} |`
).join('\n')}
`;
  };

  return `# Medicamentos — ${membro.nome}

## 💊 Em Uso

${tabelaMed(emUso)}

## 📋 Prescritos (aguardando confirmação de uso)

${tabelaMed(prescritos)}

## ⏹ Descontinuados

${tabelaMed(descontinuados)}

---
_Atualizado em ${dataFormatada(new Date().toISOString().split('T')[0])}_
`;
}

// ── Exames.md ──

export function gerarExamesMd(membro: Membro, exames: Exame[]): string {
  if (exames.length === 0) {
    return `# Exames — ${membro.nome}\n\n_Nenhum exame registrado._\n`;
  }

  // Agrupar por data
  const porData = exames.reduce<Record<string, Exame[]>>((acc, e) => {
    (acc[e.data] ??= []).push(e);
    return acc;
  }, {});

  const secoes = Object.entries(porData)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([data, exs]) => {
      const linhas = exs.map((e) => {
        const flag = e.flag === 'alto' ? ' ⬆' : e.flag === 'baixo' ? ' ⬇' : '';
        const faixa = e.faixa_referencia_laudo ? ` (ref: ${e.faixa_referencia_laudo})` : '';
        return `| ${e.marcador} | ${e.valor} ${e.unidade ?? ''} | ${flag || 'Normal'}${faixa} |`;
      });

      return `### ${dataFormatada(data)}${exs[0].painel ? ` — ${exs[0].painel}` : ''}

| Marcador | Valor | Flag |
|---|---|---|
${linhas.join('\n')}`;
    });

  return `# Exames — ${membro.nome}

${secoes.join('\n\n')}

---
_Atualizado em ${dataFormatada(new Date().toISOString().split('T')[0])}_
`;
}

// ── Historico.md ──

export function gerarHistoricoMd(membro: Membro, eventos: Evento[]): string {
  if (eventos.length === 0) {
    return `# Histórico — ${membro.nome}\n\n_Nenhum evento registrado._\n`;
  }

  const linhas = eventos
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((e) => `| ${dataFormatada(e.data)} | ${e.tipo} | ${e.descricao}${e.profissional ? ` (${e.profissional})` : ''} |`);

  return `# Histórico — ${membro.nome}

| Data | Tipo | Descrição |
|---|---|---|
${linhas.join('\n')}

---
_Atualizado em ${dataFormatada(new Date().toISOString().split('T')[0])}_
`;
}

// ── Genetica.md ──

export function gerarGeneticaMd(membro: Membro): string {
  return `# Genética — ${membro.nome}

## Vínculo

Tipo: **${membro.vinculo === 'biologico' ? 'Biológico' : membro.vinculo === 'adotivo' ? 'Adotivo' : 'Enteado'}**

${membro.vinculo !== 'biologico'
  ? '> Cruzamento genético familiar **não se aplica** a este membro por vínculo não-biológico.'
  : '> Condições hereditárias deste membro podem ser cruzadas com as dos demais membros biológicos da família.'
}

## Condições Hereditárias

_Nenhuma registrada ainda._

---
_Atualizado em ${dataFormatada(membro.atualizado_em)}_
`;
}

// ── _index.yaml (como Markdown para export legível) ──

export function gerarIndiceMd(
  membros: Membro[],
  medicamentos: Medicamento[],
  vacinas: Vacina[],
): string {
  const secoes = membros.map((m) => {
    const meds = medicamentos.filter((med) => med.membro_id === m.id && med.status === 'em_uso');
    const vacs = vacinas.filter((v) => v.membro_id === m.id);

    return `### ${m.nome} (${m.tipo})

- **Vínculo:** ${m.vinculo}
- **Condições:** ${m.condicoes_ativas.length > 0 ? m.condicoes_ativas.join(', ') : 'Nenhuma'}
- **Alergias:** ${m.alergias.length > 0 ? m.alergias.join(', ') : 'Nenhuma'}
- **Medicamentos em uso:** ${meds.length > 0 ? meds.map((med) => `${med.nome} ${med.dose ?? ''}`).join(', ') : 'Nenhum'}
- **Vacinas:** ${vacs.length > 0 ? vacs.map((v) => `${v.nome} (${dataFormatada(v.aplicada_em)})`).join(', ') : 'Nenhuma registrada'}`;
  });

  return `# Índice da Família

${secoes.join('\n\n')}

---
_Gerado em ${dataFormatada(new Date().toISOString().split('T')[0])}_
`;
}
