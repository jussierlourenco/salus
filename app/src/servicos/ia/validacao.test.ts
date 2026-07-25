import { describe, it, expect } from 'vitest';
import { validarPropostaIA } from './validacao';

describe('validarPropostaIA', () => {
  it('deve validar e retornar objeto de proposta de extração correto', () => {
    const jsonValido = JSON.stringify({
      notas: 'Exame de sangue normal',
      medicamentos: [
        { nome: 'Dipirona', dose: '500mg', status: 'prescrito' }
      ],
      exames: [
        { marcador: 'Glicose', valor: '90', flag: 'normal' }
      ],
    });

    const resultado = validarPropostaIA(jsonValido);
    expect(resultado.notas).toBe('Exame de sangue normal');
    expect(resultado.medicamentos).toHaveLength(1);
    expect(resultado.medicamentos![0].nome).toBe('Dipirona');
    expect(resultado.exames![0].flag).toBe('normal');
  });

  it('deve lidar graciosamente com JSON malformado', () => {
    const jsonInvalido = 'Isso não é um JSON válido';
    const resultado = validarPropostaIA(jsonInvalido);
    expect(resultado.notas).toBe(jsonInvalido);
    expect(resultado.markdown_gerado).toBe(jsonInvalido);
  });
});
