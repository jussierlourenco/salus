import type { Medicamento } from '../../medicamentos/entidades/medicamento';
import type { Exame } from '../../exames/entidades/exame';
import type { Vacina } from '../../vacinas/entidades/vacina';

export type StatusCaixaEntrada = 'pendente' | 'processando' | 'proposta_pronta' | 'confirmado' | 'descartado';

export interface Evento {
  id: string;
  membro_id: string;
  data: string;
  tipo: string;
  descricao: string;
  profissional?: string;
  local?: string;
  notas?: string;
  criado_em: string;
}

export interface PropostaExtracao {
  membro_id?: string;
  tipo_documento?: string;
  medicamentos?: Partial<Medicamento>[];
  exames?: Partial<Exame>[];
  vacinas?: Partial<Vacina>[];
  eventos?: Partial<Evento>[];
  notas?: string;
  markdown_gerado?: string;
}

export interface CaixaEntradaItem {
  id: string;
  nome_arquivo: string;
  drive_file_id?: string;
  mime_type: string;
  status: StatusCaixaEntrada;
  proposta?: PropostaExtracao;
  criado_em: string;
  atualizado_em: string;
}
