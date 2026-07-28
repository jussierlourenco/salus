/* ═══════════════════════════════════════════════════════
 * Salus — Tipos de Domínio
 * Espelham o schema do _index.yaml do framework original.
 * Nomes em português para compatibilidade 1:1 com export/import.
 * ═══════════════════════════════════════════════════════ */

import type { Evento } from '../modulos/eventos/entidades/evento';
export type { Evento };

export type TipoMembro = 'pessoa' | 'cao' | 'gato' | 'outro';
export type Vinculo = 'biologico' | 'adotivo' | 'enteado';
export type StatusMedicamento = 'em_uso' | 'prescrito' | 'descontinuado';
export type FlagExame = 'normal' | 'alto' | 'baixo' | 'nao_informado';
export type StatusCaixaEntrada = 'pendente' | 'processando' | 'proposta_pronta' | 'confirmado' | 'descartado';

export type TipoRelacao = 'pai' | 'mae' | 'filho' | 'filha' | 'conjuge' | 'dono' | 'outro';

export interface Relacao {
  membro_id: string;
  tipo: TipoRelacao;
}

export interface Membro {
  id: string;
  nome: string;
  tipo: TipoMembro;
  nascimento?: string; // AAAA-MM-DD
  vinculo: Vinculo;
  condicoes_ativas: string[];
  alergias: string[];
  tipo_sanguineo?: string;
  relacoes: Relacao[];
  raca?: string; // para pets
  peso_kg?: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Medicamento {
  id: string;
  membro_id: string;
  nome: string;
  dose?: string;
  frequencia?: string;
  status: StatusMedicamento;
  desde?: string; // AAAA-MM-DD
  renova_em?: string; // AAAA-MM-DD
  prescrito_por?: string;
  motivo?: string;
  criado_em: string;
  atualizado_em: string;
}

/** Observação imutável de preço obtida de nota/cupom de compra. */
export interface PrecoMedicamento {
  id: string;
  membro_id: string;
  medicamento_id?: string;
  nome_medicamento: string;
  apresentacao?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  moeda: 'BRL';
  comprado_em: string; // AAAA-MM-DD
  estabelecimento?: string;
  documento_id?: string;
  criado_em: string;
  criado_por_uid: string;
}

export interface Vacina {
  id: string;
  membro_id: string;
  nome: string;
  aplicada_em?: string; // AAAA-MM-DD
  proxima_em?: string; // AAAA-MM-DD
  lote?: string;
  local?: string;
  criado_em: string;
}

export interface Checkup {
  id: string;
  membro_id: string;
  tipo: string;
  data: string; // AAAA-MM-DD
  profissional?: string;
  notas?: string;
  criado_em: string;
}

export interface Exame {
  id: string;
  membro_id: string;
  data: string; // AAAA-MM-DD
  painel?: string; // 'hemograma', 'bioquímica', etc
  marcador: string;
  valor: string;
  unidade?: string;
  faixa_referencia_laudo?: string; // string livre do laudo
  flag: FlagExame;
  documento_id?: string;
  criado_em: string;
}

export interface Analise {
  id: string;
  membro_id?: string;
  titulo: string;
  criado_em: string;
  tipo: string; // 'comparativo' | 'evolucao' | 'geral'
  fontes: string[];
  dados: Record<string, unknown>[];
  conclusao: string;
}

export interface CaixaEntradaItem {
  id: string;
  nome_arquivo: string;
  mime: string;
  drive_file_id?: string;
  status: StatusCaixaEntrada;
  membro_id?: string;
  criado_por_uid?: string;
  storage_owner_uid?: string;
  tipo_documento?: string; // 'exame' | 'laudo' | 'receita' | 'requisicao' | 'audio' | 'outro'
  proposta?: PropostaExtracao;
  storage_id?: string;
  storage_tipo?: string;
  data_evento?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface PropostaExtracao {
  membro_id?: string;
  tipo_documento?: string;
  medicamentos?: Partial<Medicamento>[];
  precos_medicamentos?: Partial<PrecoMedicamento>[];
  exames?: Partial<Exame>[];
  vacinas?: Partial<Vacina>[];
  eventos?: Partial<Evento>[];
  notas?: string;
  markdown_gerado?: string;
}

export type ProvedorIATipo = 'gemini' | 'openai_compat';

export interface ConfigProvedorIA {
  tipo: ProvedorIATipo;
  url_base?: string;
  modelo: string;
  chave: string;
}

export interface PresetProvedor {
  id: string;
  nome: string;
  tipo: ProvedorIATipo;
  url_base?: string;
  modelo_padrao: string;
  gratis: boolean;
  suporta_imagem: boolean;
  suporta_pdf: boolean;
  suporta_audio: boolean;
  descricao: string;
}

export interface ConfigUsuario {
  onboarding_concluido: boolean;
  consentimentos: {
    lgpd: boolean;
    disclaimer_clinico: boolean;
    dados_terceiros: boolean;
  };
  versao_consentimento: number;
  data_consentimento?: string;
  provedor_ia?: ConfigProvedorIA;
  drive_pasta_raiz_id?: string;
  drive_conectado?: boolean;
  ultima_revisao?: string;
  proxima_revisao?: string;
  ultimo_export?: string;
}

export interface Familia {
  id: string;
  nome: string;
  membros_uids: string[];
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

// ── Cadastro / Admin de Usuários ──

export type StatusUsuarioSalus = 'pending' | 'approved' | 'denied';

export interface UsuarioSalus {
  uid: string;
  email: string;
  nome?: string;
  foto_url?: string;
  status: StatusUsuarioSalus;
  admin: boolean;
  criado_em: string;
  aprovado_em?: string;
  aprovado_por?: string;
  familia_id?: string;
}

// ── Alertas do Painel ──

export type NivelAlerta = 'vencido' | 'vencendo_30d' | 'proximo_90d';

export interface Alerta {
  id: string;
  membro_id: string;
  membro_nome: string;
  nivel: NivelAlerta;
  tipo: 'vacina' | 'medicamento' | 'checkup';
  descricao: string;
  data: string;
}
