export type FlagExame = 'normal' | 'alto' | 'baixo' | 'nao_informado';

export interface Exame {
  id: string;
  membro_id: string;
  data: string;
  painel?: string;
  marcador: string;
  valor: string;
  unidade?: string;
  faixa_referencia_laudo?: string;
  flag: FlagExame;
  documento_id?: string;
  criado_em: string;
}
