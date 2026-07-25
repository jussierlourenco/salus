import { describe, it, expect } from 'vitest';
import { calcularAlertas } from './alertas';
import type { Membro, Medicamento, Vacina, Checkup } from '../types/dominio';

describe('calcularAlertas', () => {
  const membroAna: Membro = {
    id: 'm1',
    nome: 'Ana',
    tipo: 'pessoa',
    vinculo: 'biologico',
    condicoes_ativas: [],
    alergias: [],
    relacoes: [],
    criado_em: '2026-01-01',
    atualizado_em: '2026-01-01',
  };

  it('deve classificar medicamento vencido quando a data de renovação já passou', () => {
    const medVencido: Medicamento = {
      id: 'med-1',
      membro_id: 'm1',
      nome: 'Losartana 50mg',
      status: 'em_uso',
      renova_em: '2020-01-01', // data no passado
      criado_em: '2020-01-01',
      atualizado_em: '2020-01-01',
    };

    const alertas = calcularAlertas([membroAna], [medVencido], [], []);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].nivel).toBe('vencido');
    expect(alertas[0].tipo).toBe('medicamento');
    expect(alertas[0].membro_nome).toBe('Ana');
    expect(alertas[0].descricao).toContain('vencida');
  });

  it('não deve gerar alerta para medicamentos descontinuados', () => {
    const medDescontinuado: Medicamento = {
      id: 'med-2',
      membro_id: 'm1',
      nome: 'Dipirona',
      status: 'descontinuado',
      renova_em: '2020-01-01',
      criado_em: '2020-01-01',
      atualizado_em: '2020-01-01',
    };

    const alertas = calcularAlertas([membroAna], [medDescontinuado], [], []);
    expect(alertas).toHaveLength(0);
  });

  it('deve classificar vacina próxima com o nivel correto', () => {
    const hoje = new Date();
    const proximaEm30Dias = new Date(hoje.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const vacina: Vacina = {
      id: 'vac-1',
      membro_id: 'm1',
      nome: 'Gripe 2026',
      proxima_em: proximaEm30Dias,
      criado_em: '2026-01-01',
    };

    const alertas = calcularAlertas([membroAna], [], [vacina], []);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].nivel).toBe('vencendo_30d');
    expect(alertas[0].tipo).toBe('vacina');
  });

  it('deve alertar checkups realizados há mais de 1 ano', () => {
    const checkupAntigo: Checkup = {
      id: 'chk-1',
      membro_id: 'm1',
      tipo: 'Cardiológico',
      data: '2020-01-01',
      criado_em: '2020-01-01',
    };

    const alertas = calcularAlertas([membroAna], [], [], [checkupAntigo]);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].nivel).toBe('vencido');
    expect(alertas[0].tipo).toBe('checkup');
  });
});
