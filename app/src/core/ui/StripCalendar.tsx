import { useMemo } from 'react';

interface StripCalendarProps {
  dataSelecionada: string; // AAAA-MM-DD
  onSelecionar: (data: string) => void;
  diasAntes?: number;
  diasDepois?: number;
  className?: string;
}

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

const formatadorDiaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

/** Calendário horizontal em faixa para navegação rápida entre dias — usado na aba Diário do Perfil. */
export function StripCalendar({
  dataSelecionada,
  onSelecionar,
  diasAntes = 9,
  diasDepois = 3,
  className = '',
}: StripCalendarProps) {
  const hoje = useMemo(() => new Date(), []);
  const hojeISO = useMemo(() => paraISO(hoje), [hoje]);

  const dias = useMemo(() => {
    const lista: { iso: string; diaSemana: string; diaNumero: number; ehHoje: boolean }[] = [];
    for (let offset = -diasAntes; offset <= diasDepois; offset++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + offset);
      const iso = paraISO(data);
      lista.push({
        iso,
        diaSemana: formatadorDiaSemana.format(data).replace('.', ''),
        diaNumero: data.getDate(),
        ehHoje: iso === hojeISO,
      });
    }
    return lista;
  }, [hoje, hojeISO, diasAntes, diasDepois]);

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
      {dias.map((dia) => {
        const selecionado = dia.iso === dataSelecionada;
        return (
          <button
            key={dia.iso}
            type="button"
            onClick={() => onSelecionar(dia.iso)}
            className={`
              flex flex-col items-center justify-center shrink-0 w-12 h-16
              rounded-[var(--radius-md)] border transition-all touch-target
              ${selecionado
                ? 'bg-salus-600 border-salus-600 text-white shadow-lg shadow-salus-600/20'
                : 'bg-fundo-elevado/40 border-borda text-texto-secundario hover:bg-fundo-elevado hover:text-texto'
              }
            `}
          >
            <span className="text-[10px] font-medium uppercase">{dia.diaSemana}</span>
            <span className="text-base font-bold mt-0.5">{dia.diaNumero}</span>
            {dia.ehHoje && (
              <span className={`w-1 h-1 rounded-full mt-0.5 ${selecionado ? 'bg-white' : 'bg-salus-400'}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
