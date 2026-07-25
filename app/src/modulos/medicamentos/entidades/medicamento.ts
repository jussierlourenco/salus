export type StatusMedicamento = 'em_uso' | 'prescrito' | 'descontinuado';

export interface Medicamento {
  id: string;
  membro_id: string;
  nome: string;
  dose?: string;
  frequencia?: string;
  status: StatusMedicamento;
  desde?: string;
  renova_em?: string;
  prescrito_por?: string;
  motivo?: string;
  criado_em: string;
  atualizado_em: string;
}
