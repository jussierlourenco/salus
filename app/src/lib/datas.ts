/**
 * Utilitários de formatação de datas.
 * Todas as datas no sistema são strings AAAA-MM-DD.
 */

export function formatarData(data: string): string {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

export function dataHoje(): string {
  return new Date().toISOString().split('T')[0];
}

export function diferencaDias(dataStr: string): number {
  const data = new Date(dataStr);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  return Math.floor((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export function dataRelativa(data: string): string {
  const dias = diferencaDias(data);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  if (dias < 0) return `Há ${Math.abs(dias)} dias`;
  return `Em ${dias} dias`;
}
