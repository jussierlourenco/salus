import { describe, it, expect } from 'vitest';
import { validarPropostaIA } from './validacao';

describe('validarPropostaIA', () => {
  it('valida JSON correto retornado pela IA', () => {
    const jsonInput = JSON.stringify({
      tipo_documento: 'exame',
      medicamentos: [{ nome: 'Paracetamol', dose: '500mg' }],
      notas: 'Documento processado',
    });

    const resultado = validarPropostaIA(jsonInput);
    expect(resultado.tipo_documento).toBe('exame');
    expect(resultado.medicamentos).toHaveLength(1);
    expect(resultado.medicamentos?.[0].nome).toBe('Paracetamol');
  });

  it('faz fallback gracioso para texto simples se JSON for inválido', () => {
    const textoSimples = 'Texto não formatado em JSON';
    const resultado = validarPropostaIA(textoSimples);
    expect(resultado.notas).toBe(textoSimples);
    expect(resultado.markdown_gerado).toBe(textoSimples);
  });

  it('valida itens financeiros de uma nota sem convertê-los em prescrição', () => {
    const resultado = validarPropostaIA(JSON.stringify({
      tipo_documento: 'nota_compra_medicamento',
      precos_medicamentos: [{
        nome_medicamento: 'Dipirona',
        quantidade: 2,
        valor_unitario: 8.5,
        valor_total: 17,
        moeda: 'BRL',
        comprado_em: '2026-07-28',
      }],
    }));

    expect(resultado.medicamentos).toBeUndefined();
    expect(resultado.precos_medicamentos?.[0].valor_total).toBe(17);
    expect(resultado.precos_medicamentos?.[0].moeda).toBe('BRL');
  });

  it('preserva a data real do exame extraída do documento', () => {
    const resultado = validarPropostaIA(JSON.stringify({
      tipo_documento: 'exame',
      exames: [{ marcador: 'TSH neonatal', valor: '< 1,3', data: '2019-03-21' }],
    }));
    expect(resultado.exames?.[0].data).toBe('2019-03-21');
  });
});
