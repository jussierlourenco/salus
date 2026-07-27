export type TipoMembro = 'pessoa' | 'cao' | 'gato' | 'outro';
export type Vinculo = 'biologico' | 'adotivo' | 'enteado';
export type TipoRelacao = 'pai' | 'mae' | 'filho' | 'filha' | 'conjuge' | 'dono' | 'outro';

export interface Relacao {
  membro_id: string;
  tipo: TipoRelacao;
}

export interface Membro {
  id: string;
  nome: string;
  tipo: TipoMembro;
  nascimento?: string;
  vinculo: Vinculo;
  condicoes_ativas: string[];
  alergias: string[];
  tipo_sanguineo?: string;
  relacoes: Relacao[];
  raca?: string;
  peso_kg?: number;
  compartilhado_com_uids?: string[];
  criado_em: string;
  atualizado_em: string;
}
