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
});
