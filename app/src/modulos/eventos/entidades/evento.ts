export interface Evento {
  id: string;
  membro_id: string;
  data: string; // AAAA-MM-DD
  hora?: string; // HH:mm — horário dentro do dia, usado pela timeline da aba Diário
  /**
   * Livre (não é uma enum fechada): vem tanto do formulário da aba Diário quanto de
   * extração por IA (`core/ia/validacao.ts#EsquemaEvento`), que valida só como string.
   * Valores conhecidos pela UI do Diário: 'consulta' | 'sintoma' | 'medicamento' |
   * 'medicao' | 'vacina' | 'cirurgia' | 'internacao' | 'outro'.
   */
  tipo: string;
  descricao: string;
  valor?: string; // valor de destaque opcional (ex: "128/82 mmHg", "1 comprimido")
  profissional?: string;
  local?: string;
  notas?: string;
  criado_em: string;
  atualizado_em?: string;
  criado_por?: string;
  atualizado_por?: string;
}
