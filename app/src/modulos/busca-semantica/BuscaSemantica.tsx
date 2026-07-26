import { useState, useMemo, useCallback } from 'react';
import {
  Search, Sparkles, FileText, MessageCircle, ChevronRight,
  Image, Mic, Loader2, X, AlertTriangle,
} from 'lucide-react';
import { Card, Badge, Botao } from '../../core/ui';
import { criarProvedor } from '../../core/ia/interface';
import type { ConfigProvedorIA } from '../../types/dominio';
import type { CaixaEntradaItem } from '../../modulos/caixa-entrada/entidades/caixaEntrada';

interface BuscaSemanticaProps {
  caixaEntrada: CaixaEntradaItem[];
  configIA?: ConfigProvedorIA;
  onAbrirDocumento: (item: CaixaEntradaItem) => void;
}

interface ResultadoBusca {
  id: string;
  item: CaixaEntradaItem;
  trecho: string;
  score: number;
}

function extrairTexto(md?: string): string {
  if (!md) return '';
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_\[\]`>|~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function destacar(texto: string, termos: string[]): string {
  let resultado = texto;
  for (const termo of termos) {
    const regex = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    resultado = resultado.replace(regex, '±±±$1±±±');
  }
  resultado = resultado.replace(/±±±/g, (match, offset) =>
    offset % 3 === 0 ? '<mark class="bg-salus-600/30 text-salus-300 rounded-sm px-0.5">' : '</mark>',
  );
  return resultado;
}

function gerarTermos(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !['que', 'para', 'com', 'por', 'dos', 'das', 'qual', 'teve', 'tomar', 'como', 'esta', 'onde', 'sobre'].includes(t));
}

export function BuscaSemantica({ caixaEntrada, configIA, onAbrirDocumento }: BuscaSemanticaProps) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [buscandoIA, setBuscandoIA] = useState(false);
  const [respostaIA, setRespostaIA] = useState<string | null>(null);
  const [erroIA, setErroIA] = useState('');

  const temChaveIA = Boolean(configIA?.chave);

  const docsConfirmados = useMemo(
    () => caixaEntrada.filter((i) => i.status === 'confirmado' && i.proposta?.markdown_gerado),
    [caixaEntrada],
  );

  const buscar = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    setBuscou(true);
    setRespostaIA(null);
    setErroIA('');
    const termos = gerarTermos(q);

    // Full-text search on markdown (always runs)
    const scores: ResultadoBusca[] = [];
    for (const item of docsConfirmados) {
      const texto = extrairTexto(item.proposta?.markdown_gerado);
      let score = 0;
      let melhorTrecho = '';
      for (const termo of termos) {
        const idx = texto.indexOf(termo);
        if (idx >= 0) {
          score++;
          const start = Math.max(0, idx - 40);
          const end = Math.min(texto.length, idx + termo.length + 60);
          const trecho = item.proposta!.markdown_gerado!.slice(start, end).replace(/\n/g, ' ');
          if (trecho.length > melhorTrecho.length) melhorTrecho = trecho;
        }
      }
      if (score > 0) {
        scores.push({ id: item.id, item, trecho: melhorTrecho, score });
      }
    }
    scores.sort((a, b) => b.score - a.score);

    setResultados(scores);

    // Semantic search via AI (optional)
    if (temChaveIA) {
      setBuscandoIA(true);
      try {
        const provedor = criarProvedor(configIA);

        const contextoDocs = docsConfirmados
          .slice(0, 15)
          .map((item) => {
            const md = item.proposta?.markdown_gerado?.slice(0, 1000) ?? '';
            return `--- ${item.nome_arquivo} (${item.data_evento || item.criado_em}) ---\n${md}`;
          })
          .join('\n\n');

        const resposta = await provedor.chat(
          [{ papel: 'usuario', conteudo: `Com base APENAS nos documentos abaixo, responda: ${q}\n\nDocumentos:\n${contextoDocs}\n\nSe a resposta não estiver nos documentos, diga "Não encontrei essa informação nos documentos disponíveis."` }],
          `Documentos clínicos da família.`,
        );

        setRespostaIA(resposta.conteudo);
      } catch (err) {
        setErroIA(err instanceof Error ? err.message : 'Erro na busca semântica');
      } finally {
        setBuscandoIA(false);
      }
    }
  }, [query, docsConfirmados, temChaveIA, configIA]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') buscar();
  };

  const limpar = () => {
    setQuery('');
    setResultados([]);
    setBuscou(false);
    setRespostaIA(null);
    setErroIA('');
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search size={18} className="text-salus-400" />
        <h2 className="font-semibold text-texto">Busca Semântica</h2>
        {temChaveIA && <Badge variante="salus">IA</Badge>}
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={temChaveIA ? 'Pergunte em linguagem natural: "Qual remédio tomei para coluna?"' : 'Buscar nos documentos: glicemia, medicação, sintoma...'}
          className="w-full pl-9 pr-20 py-2.5 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 text-texto text-sm placeholder:text-texto-secundario/50 focus:outline-none focus:border-salus-500/50"
          aria-label="Buscar"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {query && (
            <button
              onClick={limpar}
              className="p-1 rounded-[var(--radius-sm)] text-texto-secundario hover:text-texto transition-colors"
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
          <Botao
            tamanho="sm"
            onClick={buscar}
            disabled={!query.trim() || buscandoIA}
            icone={buscandoIA ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          >
            Buscar
          </Botao>
        </div>
      </div>

      <p className="text-xs text-texto-secundario">
        {temChaveIA
          ? 'Faça perguntas em linguagem natural. A IA busca nos documentos para responder.'
          : 'Busca por palavras-chave nos documentos. Configure uma chave de IA para respostas inteligentes.'
        }
      </p>

      {/* Resposta IA */}
      {respostaIA && (
        <Card className="border-salus-600/30 bg-salus-600/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-salus-400" />
            <span className="text-sm font-semibold text-texto">Resposta</span>
            <Badge variante="salus">IA</Badge>
          </div>
          <p className="text-sm text-texto whitespace-pre-wrap leading-relaxed">{respostaIA}</p>
        </Card>
      )}

      {erroIA && (
        <div className="p-3 rounded-[var(--radius-md)] text-sm flex items-start gap-2 border bg-alerta-950/40 border-alerta-500/40 text-alerta-300">
          <AlertTriangle size={16} className="text-alerta-400 shrink-0 mt-0.5" />
          <span>Erro na consulta IA: {erroIA}</span>
        </div>
      )}

      {/* Resultados full-text */}
      {buscou && resultados.length === 0 && !buscandoIA && (
        <div className="py-8 text-center text-texto-secundario">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum resultado encontrado para "{query}".</p>
          <p className="text-xs mt-1">Tente termos diferentes ou verifique se os documentos já foram processados.</p>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-texto-secundario font-medium">
            {resultados.length} resultado(s) em documentos
          </p>
          {resultados.slice(0, 10).map((r) => (
            <button
              key={r.id}
              onClick={() => onAbrirDocumento(r.item)}
              className="w-full text-left group"
            >
              <div className="p-3 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 hover:bg-fundo-elevado/60 hover:border-salus-600/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-salus-400 shrink-0" />
                  <span className="text-sm font-semibold text-texto truncate">{r.item.nome_arquivo}</span>
                  {r.item.data_evento && (
                    <span className="text-[10px] text-texto-secundario shrink-0">
                      {r.item.data_evento.split('T')[0]}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs text-texto-secundario line-clamp-2 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: destacar(r.trecho, gerarTermos(query)) }}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {docsConfirmados.length === 0 && !buscou && (
        <div className="py-8 text-center text-texto-secundario">
          <Search size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum documento processado disponível para busca.</p>
          <p className="text-xs mt-1">Use a Caixa de Entrada para enviar e processar documentos primeiro.</p>
        </div>
      )}
    </div>
  );
}
