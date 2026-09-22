import { describe, it, expect } from 'vitest';
import { destacarTermos } from './destaque';
import { isValidElement } from 'react';

describe('destacarTermos (Prevenção de XSS)', () => {
  it('deve retornar null se texto estiver vazio', () => {
    expect(destacarTermos('', ['glicose'])).toBeNull();
  });

  it('deve retornar a string original se a lista de termos estiver vazia', () => {
    const texto = 'Hemograma completo com plaquetas';
    expect(destacarTermos(texto, [])).toBe(texto);
  });

  it('deve segmentar o texto em nós React com <mark> para os termos encontrados', () => {
    const texto = 'Resultado de glicose em jejum';
    const termos = ['glicose'];
    const resultado = destacarTermos(texto, termos) as any[];

    expect(Array.isArray(resultado)).toBe(true);
    // Deve conter elementos válidos do React
    expect(resultado.some((elem) => isValidElement(elem) && elem.type === 'mark')).toBe(true);
  });

  it('não deve interpretar tags HTML como código (escapando HTML nativamente)', () => {
    const payloadMalicioso = '<img src=x onerror=alert(1)> glicose alterada';
    const termos = ['glicose'];
    const resultado = destacarTermos(payloadMalicioso, termos) as any[];

    expect(Array.isArray(resultado)).toBe(true);
    // As partes de texto comuns são mantidas como strings nos nós React, não geram innerHTML
    const nosSpan = resultado.filter((elem) => isValidElement(elem) && elem.type === 'span');
    expect(nosSpan.length).toBeGreaterThan(0);
    // O texto do payload malicioso é preservado como string textual pura
    expect(nosSpan[0].props.children).toContain('<img src=x onerror=alert(1)>');
  });
});
