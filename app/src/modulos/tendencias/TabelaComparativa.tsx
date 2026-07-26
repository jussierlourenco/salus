import { useState, useMemo } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import type { Exame } from '../exames/entidades/exame';
import { agruparPorData, formatarData } from './utils';

interface TabelaComparativaProps {
  exames: Exame[];
}

export function TabelaComparativa({ exames }: TabelaComparativaProps) {
  const sessoes = useMemo(() => agruparPorData(exames), [exames]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const toggleData = (data: string) => {
    setSelectedDates((prev) =>
      prev.includes(data) ? prev.filter((d) => d !== data) : [...prev, data],
    );
  };

  const selecionarTodas = () => {
    if (selectedDates.length === sessoes.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(sessoes.map((s) => s.data));
    }
  };

  const selectedSorted = useMemo(
    () => [...selectedDates].sort((a, b) => a.localeCompare(b)),
    [selectedDates],
  );

  const marcadores = useMemo(() => {
    const selectedExames = exames.filter((e) => selectedDates.includes(e.data));
    const set = new Set(selectedExames.map((e) => e.marcador.trim()));
    return Array.from(set).sort();
  }, [exames, selectedDates]);

  const valorNaData = (marcador: string, data: string) => {
    return exames.find((e) => e.marcador.trim() === marcador && e.data === data);
  };

  const flagCor = (flag: string) => {
    switch (flag) {
      case 'alto':
        return 'text-alerta-400';
      case 'baixo':
        return 'text-salus-400';
      case 'normal':
        return 'text-salus-500';
      default:
        return 'text-texto-secundario';
    }
  };

  const flagBg = (flag: string) => {
    switch (flag) {
      case 'alto':
        return 'bg-alerta-600/10';
      case 'baixo':
        return 'bg-salus-600/10';
      case 'normal':
        return 'bg-salus-600/5';
      default:
        return '';
    }
  };

  if (sessoes.length === 0) {
    return (
      <div className="py-8 text-center text-texto-secundario">
        <Activity size={32} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhum exame disponível para comparação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de datas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-texto-secundario uppercase tracking-wider">
            Selecionar datas para comparar
          </p>
          <button
            onClick={selecionarTodas}
            className="text-xs text-salus-400 hover:text-salus-300 transition-colors"
          >
            {selectedDates.length === sessoes.length ? 'Limpar' : 'Selecionar todas'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sessoes.map((s) => {
            const ativa = selectedDates.includes(s.data);
            return (
              <button
                key={s.data}
                onClick={() => toggleData(s.data)}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all touch-target min-h-0 ${
                  ativa
                    ? 'bg-salus-600/15 border-salus-600/30 text-salus-400'
                    : 'bg-fundo-elevado/30 border-borda/60 text-texto-secundario hover:border-borda'
                }`}
              >
                {formatarData(s.data)}
                <span className="ml-1 opacity-60">({s.exames.length})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Estado: poucas datas */}
      {selectedDates.length < 2 && (
        <div className="p-4 rounded-[var(--radius-md)] bg-fundo-elevado/20 border border-borda/50 text-center">
          <AlertTriangle size={20} className="mx-auto mb-1 text-alerta-400" />
          <p className="text-sm text-texto-secundario">
            Selecione ao menos <strong className="text-texto">2 datas</strong> para comparar os marcadores lado a lado.
          </p>
        </div>
      )}

      {/* Tabela comparativa */}
      {selectedDates.length >= 2 && (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-borda/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-fundo-elevado/40">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-texto uppercase tracking-wider border-b border-borda/60 whitespace-nowrap">
                  Marcador
                </th>
                {selectedSorted.map((data) => (
                  <th
                    key={data}
                    className="text-left px-3 py-2.5 text-xs font-semibold text-texto uppercase tracking-wider border-b border-borda/60 whitespace-nowrap"
                  >
                    {formatarData(data)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marcadores.map((marcador, idx) => (
                <tr
                  key={marcador}
                  className={idx % 2 === 0 ? 'bg-fundo-card/30' : 'bg-fundo-card/10'}
                >
                  <td className="px-3 py-2.5 text-texto font-medium whitespace-nowrap border-b border-borda/30">
                    {marcador}
                  </td>
                  {selectedSorted.map((data) => {
                    const exame = valorNaData(marcador, data);
                    return (
                      <td
                        key={data}
                        className={`px-3 py-2.5 border-b border-borda/30 whitespace-nowrap ${
                          exame ? flagBg(exame.flag) : ''
                        }`}
                      >
                        {exame ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-texto font-medium">
                              {exame.valor}
                            </span>
                            {exame.unidade && (
                              <span className="text-texto-secundario text-[10px]">
                                {exame.unidade}
                              </span>
                            )}
                            {exame.flag && exame.flag !== 'nao_informado' && (
                              <span
                                className={`text-[10px] font-medium ${flagCor(exame.flag)}`}
                              >
                                ●
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-texto-secundario/40">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
