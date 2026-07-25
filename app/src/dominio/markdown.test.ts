import { describe, it, expect } from 'vitest';
import {
  gerarFichaMd,
  gerarMedicamentosMd,
  gerarExamesMd,
  gerarGeneticaMd,
  gerarIndiceMd,
} from './markdown';
import type { Membro, Medicamento, Exame } from '../types/dominio';

describe('gerarFichaMd', () => {
  const membro: Membro = {
    id: 'm1',
    nome: 'Maria Silva',
    tipo: 'pessoa',
    vinculo: 'biologico',
    condicoes_ativas: ['Asma'],
    alergias: ['Penicilina'],
    tipo_sanguineo: 'O+',
    relacoes: [],
    criado_em: '2026-01-01',
    atualizado_em: '2026-07-25',
  };

  it('deve gerar o Markdown da Ficha com tabela e listas legíveis', () => {
    const md = gerarFichaMd(membro);
    expect(md).toContain('# Maria Silva');
    expect(md).toContain('| **Tipo** | Pessoa |');
    expect(md).toContain('| **Tipo Sanguíneo** | O+ |');
    expect(md).toContain('- Asma');
    expect(md).toContain('- Penicilina');
  });
});

describe('gerarMedicamentosMd', () => {
  const membro: Membro = {
    id: 'm1',
    nome: 'Maria Silva',
    tipo: 'pessoa',
    vinculo: 'biologico',
    condicoes_ativas: [],
    alergias: [],
    relacoes: [],
    criado_em: '2026-01-01',
    atualizado_em: '2026-07-25',
  };

  it('deve agrupar medicamentos por status (Em Uso, Prescrito, Descontinuado)', () => {
    const meds: Medicamento[] = [
      {
        id: '1',
        membro_id: 'm1',
        nome: 'Aerolin',
        status: 'em_uso',
        dose: '2 jatos',
        criado_em: '2026-01-01',
        atualizado_em: '2026-07-25',
      },
      {
        id: '2',
        membro_id: 'm1',
        nome: 'Amoxicilina',
        status: 'descontinuado',
        criado_em: '2026-01-01',
        atualizado_em: '2026-07-25',
      },
    ];

    const md = gerarMedicamentosMd(membro, meds);
    expect(md).toContain('## 💊 Em Uso');
    expect(md).toContain('Aerolin');
    expect(md).toContain('## ⏹ Descontinuados');
    expect(md).toContain('Amoxicilina');
  });
});

describe('gerarExamesMd', () => {
  const membro: Membro = {
    id: 'm1',
    nome: 'Maria Silva',
    tipo: 'pessoa',
    vinculo: 'biologico',
    condicoes_ativas: [],
    alergias: [],
    relacoes: [],
    criado_em: '2026-01-01',
    atualizado_em: '2026-07-25',
  };

  it('deve formatar marcadores de exames e incluir flags de alteração', () => {
    const exames: Exame[] = [
      {
        id: 'e1',
        membro_id: 'm1',
        data: '2026-07-01',
        marcador: 'Glicose',
        valor: '110',
        unidade: 'mg/dL',
        flag: 'alto',
        criado_em: '2026-07-01',
      },
    ];

    const md = gerarExamesMd(membro, exames);
    expect(md).toContain('### 01/07/2026');
    expect(md).toContain('Glicose');
    expect(md).toContain('110 mg/dL');
    expect(md).toContain('⬆');
  });
});

describe('gerarGeneticaMd', () => {
  it('deve avisar se o vínculo não for biológico', () => {
    const membroPet: Membro = {
      id: 'm2',
      nome: 'Rex',
      tipo: 'cao',
      vinculo: 'adotivo',
      condicoes_ativas: [],
      alergias: [],
      relacoes: [],
      criado_em: '2026-01-01',
      atualizado_em: '2026-07-25',
    };

    const md = gerarGeneticaMd(membroPet);
    expect(md).toContain('não se aplica');
  });
});

describe('gerarIndiceMd', () => {
  it('deve consolidar o resumo de todos os membros no índice', () => {
    const membro: Membro = {
      id: 'm1',
      nome: 'Maria',
      tipo: 'pessoa',
      vinculo: 'biologico',
      condicoes_ativas: [],
      alergias: [],
      relacoes: [],
      criado_em: '2026-01-01',
      atualizado_em: '2026-07-25',
    };

    const md = gerarIndiceMd([membro], [], []);
    expect(md).toContain('# Índice da Família');
    expect(md).toContain('### Maria (pessoa)');
  });
});
