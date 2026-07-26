import type { Exame } from '../exames/entidades/exame';

export function parseValorNumerico(valor: string): number | null {
  if (!valor) return null;
  let cleaned = valor.trim().replace(/^[<>]\s*/, '');
  cleaned = cleaned.replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function agruparPorMarcador(exames: Exame[]): Map<string, Exame[]> {
  const grupos = new Map<string, Exame[]>();
  for (const exame of exames) {
    const marcador = exame.marcador.trim();
    if (!grupos.has(marcador)) grupos.set(marcador, []);
    grupos.get(marcador)!.push(exame);
  }
  for (const [, lista] of grupos) {
    lista.sort((a, b) => a.data.localeCompare(b.data));
  }
  return grupos;
}

export function extrairFaixaReferencia(faixaStr?: string): { min: number; max: number } | null {
  if (!faixaStr) return null;
  const c = faixaStr.trim();
  const rangeMatch = c.match(/^(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*)$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]!.replace(',', '.'));
    const max = parseFloat(rangeMatch[2]!.replace(',', '.'));
    if (!isNaN(min) && !isNaN(max)) return { min, max };
  }
  const ltMatch = c.match(/^<\s*(\d+[.,]?\d*)$/);
  if (ltMatch) {
    const max = parseFloat(ltMatch[1]!.replace(',', '.'));
    if (!isNaN(max)) return { min: 0, max };
  }
  const gtMatch = c.match(/^>\s*(\d+[.,]?\d*)$/);
  if (gtMatch) {
    const min = parseFloat(gtMatch[1]!.replace(',', '.'));
    if (!isNaN(min)) return { min, max: min * 3 };
  }
  return null;
}

export function agruparPorData(exames: Exame[]): { data: string; exames: Exame[] }[] {
  const map = new Map<string, Exame[]>();
  for (const exame of exames) {
    if (!map.has(exame.data)) map.set(exame.data, []);
    map.get(exame.data)!.push(exame);
  }
  return Array.from(map.entries())
    .map(([data, exs]) => ({ data, exames: exs }))
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function listarMarcadores(exames: Exame[]): string[] {
  return Array.from(new Set(exames.map((e) => e.marcador.trim()))).sort();
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('T')[0]!.split('-');
  if (!ano || !mes) return data;
  return `${dia || ''}/${mes}/${ano}`;
}

export function formatarDataCurta(data: string): string {
  const [ano, mes, dia] = data.split('T')[0]!.split('-');
  if (!ano || !mes) return data;
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[parseInt(mes) - 1] || mes}${dia ? `/${dia}` : ''}`;
}

export function gerarYTicks(min: number, max: number): number[] {
  if (min === max) return [min];
  const roughStep = (max - min) / 5;
  if (roughStep === 0) return [min];
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  const start = Math.ceil(min / niceStep) * niceStep;
  const end = Math.floor(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = start; v <= end; v += niceStep) ticks.push(Math.round(v * 100) / 100);
  if (ticks.length < 2) ticks.push(min, max);
  return ticks;
}
