/**
 * Cálculo de alertas de saúde — puro, sem I/O.
 * Compara datas de vencimento com a data atual.
 */

import type { Membro, Medicamento, Vacina, Checkup, Alerta, NivelAlerta } from '../types/dominio';

function diferencaDias(dataStr: string): number {
  const data = new Date(dataStr);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  return Math.floor((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function classificarNivel(dias: number): NivelAlerta | null {
  if (dias < 0) return 'vencido';
  if (dias <= 30) return 'vencendo_30d';
  if (dias <= 90) return 'proximo_90d';
  return null;
}

export function calcularAlertas(
  membros: Membro[],
  medicamentos: Medicamento[],
  vacinas: Vacina[],
  checkups: Checkup[],
): Alerta[] {
  const alertas: Alerta[] = [];
  const membroMap = new Map(membros.map((m) => [m.id, m]));

  // Medicamentos com data de renovação
  for (const med of medicamentos) {
    if (med.status !== 'em_uso' || !med.renova_em) continue;
    const dias = diferencaDias(med.renova_em);
    const nivel = classificarNivel(dias);
    if (!nivel) continue;
    const membro = membroMap.get(med.membro_id);
    alertas.push({
      id: `med-${med.id}`,
      membro_id: med.membro_id,
      membro_nome: membro?.nome ?? 'Desconhecido',
      nivel,
      tipo: 'medicamento',
      descricao: `Receita ${med.nome} — ${nivel === 'vencido' ? 'vencida' : `renovar em ${dias} dias`}`,
      data: med.renova_em,
    });
  }

  // Vacinas com próxima dose
  for (const vac of vacinas) {
    if (!vac.proxima_em) continue;
    const dias = diferencaDias(vac.proxima_em);
    const nivel = classificarNivel(dias);
    if (!nivel) continue;
    const membro = membroMap.get(vac.membro_id);
    alertas.push({
      id: `vac-${vac.id}`,
      membro_id: vac.membro_id,
      membro_nome: membro?.nome ?? 'Desconhecido',
      nivel,
      tipo: 'vacina',
      descricao: `Vacina ${vac.nome} — ${nivel === 'vencido' ? 'vencida' : `em ${dias} dias`}`,
      data: vac.proxima_em,
    });
  }

  // Checkups periódicos
  for (const chk of checkups) {
    // Simplificação: considerar vencido se > 1 ano
    const dias = diferencaDias(chk.data);
    if (dias < -365) {
      const membro = membroMap.get(chk.membro_id);
      alertas.push({
        id: `chk-${chk.id}`,
        membro_id: chk.membro_id,
        membro_nome: membro?.nome ?? 'Desconhecido',
        nivel: 'vencido',
        tipo: 'checkup',
        descricao: `Check-up ${chk.tipo} — último há mais de 1 ano`,
        data: chk.data,
      });
    }
  }

  // Ordenar: vencidos primeiro, depois por data
  return alertas.sort((a, b) => {
    const ordemNivel = { vencido: 0, vencendo_30d: 1, proximo_90d: 2 };
    const diff = ordemNivel[a.nivel] - ordemNivel[b.nivel];
    if (diff !== 0) return diff;
    return a.data.localeCompare(b.data);
  });
}
