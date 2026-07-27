export interface Vacina {
  id: string;
  membro_id: string;
  nome: string;
  aplicada_em?: string;
  proxima_em?: string;
  lote?: string;
  local?: string;
  criado_em: string;
  criado_por?: string;
}
