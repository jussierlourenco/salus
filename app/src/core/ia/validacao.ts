import { z } from 'zod';
import type { PropostaExtracao } from '../../types/dominio';

export const EsquemaMedicamento = z.object({
  nome: z.string(),
  dose: z.string().optional(),
  frequencia: z.string().optional(),
  status: z.enum(['em_uso', 'prescrito', 'descontinuado']).optional().default('prescrito'),
  motivo: z.string().optional(),
});

export const EsquemaPrecoMedicamento = z.object({
  nome_medicamento: z.string(),
  apresentacao: z.string().optional(),
  quantidade: z.coerce.number().positive().default(1),
  valor_unitario: z.coerce.number().nonnegative(),
  valor_total: z.coerce.number().nonnegative(),
  moeda: z.literal('BRL').default('BRL'),
  comprado_em: z.string(),
  estabelecimento: z.string().optional(),
});

export const EsquemaExame = z.object({
  marcador: z.string(),
  valor: z.string(),
  unidade: z.string().optional(),
  flag: z.enum(['normal', 'alto', 'baixo', 'nao_informado']).optional().default('nao_informado'),
  faixa_referencia_laudo: z.string().optional(),
});

export const EsquemaVacina = z.object({
  nome: z.string(),
  aplicada_em: z.string().optional(),
  proxima_em: z.string().optional(),
  lote: z.string().optional(),
});

export const EsquemaEvento = z.object({
  tipo: z.string(),
  descricao: z.string(),
  data: z.string().optional(),
});

export const EsquemaPropostaExtracao = z.object({
  membro_id: z.string().optional(),
  tipo_documento: z.string().optional(),
  medicamentos: z.array(EsquemaMedicamento).optional(),
  precos_medicamentos: z.array(EsquemaPrecoMedicamento).optional(),
  exames: z.array(EsquemaExame).optional(),
  vacinas: z.array(EsquemaVacina).optional(),
  eventos: z.array(EsquemaEvento).optional(),
  notas: z.string().optional(),
  markdown_gerado: z.string().optional(),
});

/**
 * Valida com segurança o JSON retornado do LLM.
 * Se o JSON estiver parcialmente inválido, faz a sanitização graciosa.
 */
export function validarPropostaIA(jsonTexto: string): PropostaExtracao {
  try {
    const raw = JSON.parse(jsonTexto);
    const parsed = EsquemaPropostaExtracao.safeParse(raw);
    if (parsed.success) {
      return parsed.data as PropostaExtracao;
    }
    if (typeof raw === 'object' && raw !== null) {
      return {
        notas: raw.notas ?? 'Extração concluída com validação parcial.',
        markdown_gerado: raw.markdown_gerado ?? jsonTexto,
        ...raw,
      };
    }
  } catch {
    // Ignora erro de JSON e devolve texto puro
  }

  return {
    notas: jsonTexto,
    markdown_gerado: jsonTexto,
  };
}
