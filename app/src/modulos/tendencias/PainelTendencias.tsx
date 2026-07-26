import { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, LineChart, Table2, Search, FlaskConical, AlertCircle } from 'lucide-react';
import { Badge, EstadoVazio } from '../../core/ui';
import type { Exame } from '../exames/entidades/exame';
import { agruparPorMarcador, listarMarcadores } from './utils';
import { GraficoTendencia } from './GraficoTendencia';
import { TabelaComparativa } from './TabelaComparativa';

type Aba = 'evolucao' | 'comparativo';

interface PainelTendenciasProps {
  exames: Exame[];
}

export function PainelTendencias({ exames }: PainelTendenciasProps) {
  const [aba, setAba] = useState<Aba>('evolucao');
  const [marcadorSelecionado, setMarcadorSelecionado] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const grupos = useMemo(() => agruparPorMarcador(exames), [exames]);
  const marcadores = useMemo(() => listarMarcadores(exames), [exames]);

  // Auto-select first marcador with data
  useEffect(() => {
    if (!marcadorSelecionado && marcadores.length > 0) {
      setMarcadorSelecionado(marcadores[0]!);
    }
  }, [marcadores, marcadorSelecionado]);

  const marcadoresFiltrados = useMemo(() => {
    if (!filtro) return marcadores;
    const termo = filtro.toLowerCase();
    return marcadores.filter((m) => m.toLowerCase().includes(termo));
  }, [marcadores, filtro]);

  const examesDoMarcador = marcadorSelecionado
    ? grupos.get(marcadorSelecionado) ?? []
    : [];

  const trackChanges = (marcador: string) => {
    setMarcadorSelecionado(marcador);
    setFiltro('');
  };

  if (exames.length === 0) {
    return (
      <EstadoVazio
        icone={<FlaskConical size={36} />}
        titulo="Nenhum exame cadastrado"
        descricao="Adicione exames pela Caixa de Entrada para começar a acompanhar a evolução dos biomarcadores."
      />
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-salus-400" />
          <h2 className="font-semibold text-texto">Evolução de Exames</h2>
          <Badge variante="neutro">{exames.length} registro(s)</Badge>
        </div>
      </div>

      {/* Abas: Evolução / Comparativo */}
      <div className="flex gap-1 bg-fundo-elevado/20 rounded-[var(--radius-md)] p-1 border border-borda/50 w-fit">
        <button
          onClick={() => setAba('evolucao')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all ${
            aba === 'evolucao'
              ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
              : 'text-texto-secundario hover:text-texto border border-transparent'
          }`}
        >
          <LineChart size={14} />
          Evolução
        </button>
        <button
          onClick={() => setAba('comparativo')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all ${
            aba === 'comparativo'
              ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
              : 'text-texto-secundario hover:text-texto border border-transparent'
          }`}
        >
          <Table2 size={14} />
          Comparativo
        </button>
      </div>

      {aba === 'evolucao' ? (
        <>
          {/* Seletor de biomarcador */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-texto-secundario pointer-events-none" />
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar biomarcadores..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 text-texto placeholder:text-texto-secundario/50 focus:outline-none focus:border-salus-500/50"
              />
            </div>
            <div
              ref={scrollRef}
              className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin"
            >
              {marcadoresFiltrados.map((m) => {
                const ativo = m === marcadorSelecionado;
                const grupo = grupos.get(m)!;
                const numericos = grupo.filter(
                  (e) => e.valor && !isNaN(parseFloat(e.valor.replace(',', '.'))),
                ).length;
                return (
                  <button
                    key={m}
                    onClick={() => trackChanges(m)}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium border transition-all touch-target min-h-0 ${
                      ativo
                        ? 'bg-salus-600/15 border-salus-600/30 text-salus-400'
                        : 'bg-fundo-elevado/20 border-borda/50 text-texto-secundario hover:border-salus-600/30 hover:text-texto'
                    }`}
                    title={`${numericos} valor(es) numérico(s)`}
                  >
                    {m}
                    <span className="ml-1 opacity-50">({numericos})</span>
                  </button>
                );
              })}
              {marcadoresFiltrados.length === 0 && filtro && (
                <p className="text-xs text-texto-secundario py-2">
                  Nenhum biomarcador encontrado para "{filtro}".
                </p>
              )}
            </div>
          </div>

          {/* Gráfico */}
          {marcadorSelecionado && examesDoMarcador.length > 0 && (
            <div className="rounded-[var(--radius-md)] border border-borda/60 bg-fundo-card/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical size={14} className="text-salus-400" />
                <span className="text-sm font-semibold text-texto">{marcadorSelecionado}</span>
                <span className="text-[10px] text-texto-secundario">
                  {examesDoMarcador.length} {examesDoMarcador.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <GraficoTendencia exames={examesDoMarcador} marcador={marcadorSelecionado} />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-borda/60 bg-fundo-card/30 p-4">
          <TabelaComparativa exames={exames} />
        </div>
      )}

      {exames.length > 0 && marcadores.length === 0 && (
        <div className="p-4 rounded-[var(--radius-md)] bg-fundo-elevado/20 border border-borda/50 text-center">
          <AlertCircle size={20} className="mx-auto mb-1 text-alerta-400" />
          <p className="text-sm text-texto-secundario">
            Os exames cadastrados não possuem biomarcadores nomeados. Edite os registros para adicionar nomes de marcadores.
          </p>
        </div>
      )}
    </div>
  );
}
