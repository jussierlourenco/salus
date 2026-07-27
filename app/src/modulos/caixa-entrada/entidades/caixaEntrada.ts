import type { Medicamento } from '../../medicamentos/entidades/medicamento';
import type { Exame } from '../../exames/entidades/exame';
import type { Vacina } from '../../vacinas/entidades/vacina';
import type { Evento } from '../../eventos/entidades/evento';

export type StatusCaixaEntrada = 'pendente' | 'processando' | 'proposta_pronta' | 'confirmado' | 'descartado';

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
  /** ID do arquivo no IndexedDB local (storage local no navegador). */
  storage_id?: string;
  /** 'indexeddb' | 'drive' | 'manual' */
  storage_tipo?: string;
  /** Data real do evento clínico (extraída do documento) */
  data_evento?: string;
  criado_em: string;
  atualizado_em: string;
}
