import { useMemo, useState, type ComponentType } from 'react';
import {
  Plus, Pill, ThermometerSun, Activity, Syringe, Stethoscope, NotebookPen,
} from 'lucide-react';
import { Card, Campo, Botao, EstadoVazio, StripCalendar, Timeline, TimelineEvent, BottomSheet } from '../../core/ui';

/**
 * Tipos e mock desta aba são um superset de `types/dominio.ts#Evento` (adiciona `timestamp`
 * com hora e `payload` estruturado) só para validar o visual. Quando existir
 * `modulos/eventos/casos-de-uso`, isto deve ser reconciliado com a entidade real.
 */
type TipoEventoDiario = 'medicamento' | 'sintoma' | 'medicao' | 'vacina' | 'consulta' | 'outro';

interface EventoDiario {
  id: string;
  membro_id: string;
  timestamp: string; // ISO 8601 completo (data + hora)
  tipo: TipoEventoDiario;
  payload: {
    titulo: string;
    valor?: string;
    notas?: string;
  };
}

const ICONE_POR_TIPO: Record<TipoEventoDiario, ComponentType<{ size?: number }>> = {
  medicamento: Pill,
  vacina: Syringe,
  medicao: Activity,
  sintoma: ThermometerSun,
  consulta: Stethoscope,
  outro: NotebookPen,
};

const ESTILO_ICONE_POR_TIPO: Record<TipoEventoDiario, string> = {
  medicamento: 'bg-salus-900/50 border-salus-700/50 text-salus-300',
  vacina: 'bg-salus-900/50 border-salus-700/50 text-salus-300',
  medicao: 'bg-fundo-elevado border-borda text-texto-secundario',
  sintoma: 'bg-alerta-600/20 border-alerta-600/30 text-alerta-400',
  consulta: 'bg-fundo-elevado border-borda text-texto-secundario',
  outro: 'bg-fundo-elevado border-borda text-texto-secundario',
};

const FILTROS: { id: 'todos' | TipoEventoDiario; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'medicamento', label: 'Remédios' },
  { id: 'sintoma', label: 'Sintomas' },
  { id: 'medicao', label: 'Medições' },
  { id: 'vacina', label: 'Vacinas' },
  { id: 'consulta', label: 'Consultas' },
];

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function timestampMock(diasAtras: number, hora: number, minuto: number): string {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  data.setHours(hora, minuto, 0, 0);
  return data.toISOString();
}

function gerarEventosMock(membroId: string): EventoDiario[] {
  return [
    {
      id: 'mock-1',
      membro_id: membroId,
      timestamp: timestampMock(0, 8, 0),
      tipo: 'medicamento',
      payload: { titulo: 'Losartana 50mg', valor: '1 comprimido' },
    },
    {
      id: 'mock-2',
      membro_id: membroId,
      timestamp: timestampMock(0, 9, 15),
      tipo: 'medicao',
      payload: { titulo: 'Pressão arterial', valor: '128/82 mmHg' },
    },
    {
      id: 'mock-3',
      membro_id: membroId,
      timestamp: timestampMock(0, 13, 30),
      tipo: 'sintoma',
      payload: { titulo: 'Dor de cabeça leve', notas: 'Após o almoço; melhorou com repouso.' },
    },
    {
      id: 'mock-4',
      membro_id: membroId,
      timestamp: timestampMock(0, 20, 0),
      tipo: 'medicamento',
      payload: { titulo: 'Losartana 50mg', valor: '1 comprimido' },
    },
    {
      id: 'mock-5',
      membro_id: membroId,
      timestamp: timestampMock(1, 10, 0),
      tipo: 'consulta',
      payload: { titulo: 'Retorno com cardiologista', notas: 'Dra. Marina Costa — check-up de rotina.' },
    },
    {
      id: 'mock-6',
      membro_id: membroId,
      timestamp: timestampMock(1, 16, 45),
      tipo: 'vacina',
      payload: { titulo: 'Influenza (dose anual)' },
    },
    {
      id: 'mock-7',
      membro_id: membroId,
      timestamp: timestampMock(2, 7, 30),
      tipo: 'medicao',
      payload: { titulo: 'Glicemia em jejum', valor: '92 mg/dL' },
    },
  ];
}

function formatarHora(timestamp: string): string {
  const data = new Date(timestamp);
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface AbaDiarioProps {
  membroId: string;
}

export function AbaDiario({ membroId }: AbaDiarioProps) {
  const [eventos, setEventos] = useState<EventoDiario[]>(() => gerarEventosMock(membroId));
  const [dataSelecionada, setDataSelecionada] = useState(() => paraISO(new Date()));
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | TipoEventoDiario>('todos');
  const [sheetAberto, setSheetAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form do novo registro
  const [novoTipo, setNovoTipo] = useState<TipoEventoDiario>('sintoma');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaHora, setNovaHora] = useState(() => new Date().toTimeString().slice(0, 5));
  const [novoValor, setNovoValor] = useState('');
  const [novasNotas, setNovasNotas] = useState('');

  const eventosDoDia = useMemo(() => {
    return eventos
      .filter((ev) => paraISO(new Date(ev.timestamp)) === dataSelecionada)
      .filter((ev) => filtroAtivo === 'todos' || ev.tipo === filtroAtivo)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [eventos, dataSelecionada, filtroAtivo]);

  const fecharSheet = () => {
    setSheetAberto(false);
    setNovoTipo('sintoma');
    setNovoTitulo('');
    setNovaHora(new Date().toTimeString().slice(0, 5));
    setNovoValor('');
    setNovasNotas('');
  };

  const handleRegistrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;
    setSalvando(true);

    const [hora, minuto] = novaHora.split(':').map(Number);
    const dataEvento = new Date(`${dataSelecionada}T00:00:00`);
    dataEvento.setHours(hora || 0, minuto || 0, 0, 0);

    const novoEvento: EventoDiario = {
      id: `mock-${Date.now()}`,
      membro_id: membroId,
      timestamp: dataEvento.toISOString(),
      tipo: novoTipo,
      payload: {
        titulo: novoTitulo.trim(),
        valor: novoValor.trim() || undefined,
        notas: novasNotas.trim() || undefined,
      },
    };

    setEventos((atual) => [...atual, novoEvento]);
    setSalvando(false);
    fecharSheet();
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho interno: strip calendar + chips de filtro */}
      <Card padding="sm" className="space-y-3">
        <StripCalendar dataSelecionada={dataSelecionada} onSelecionar={setDataSelecionada} />
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.id}
              type="button"
              onClick={() => setFiltroAtivo(filtro.id)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors shrink-0
                ${filtroAtivo === filtro.id
                  ? 'bg-salus-600/15 text-salus-400 border-salus-600/30'
                  : 'bg-transparent text-texto-secundario border-borda hover:bg-fundo-elevado/50'
                }
              `}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Feed principal: timeline vertical do dia selecionado */}
      {eventosDoDia.length === 0 ? (
        <EstadoVazio
          icone={<NotebookPen size={40} />}
          titulo="Nenhum registro neste dia"
          descricao="Toque no botão + para anotar um sintoma, medicação, medição ou nota rápida."
        />
      ) : (
        <Timeline>
          {eventosDoDia.map((ev) => {
            const Icone = ICONE_POR_TIPO[ev.tipo];
            return (
              <TimelineEvent
                key={ev.id}
                hora={formatarHora(ev.timestamp)}
                icone={<Icone size={14} />}
                titulo={ev.payload.titulo}
                valor={ev.payload.valor}
                descricao={ev.payload.notas}
                corIcone={ESTILO_ICONE_POR_TIPO[ev.tipo]}
              />
            );
          })}
        </Timeline>
      )}

      {/* FAB: input contextual — já assume o membro deste perfil */}
      <button
        type="button"
        onClick={() => setSheetAberto(true)}
        className="
          fixed bottom-20 right-5 lg:bottom-8 lg:right-10 z-40
          w-14 h-14 rounded-full bg-salus-600 hover:bg-salus-700 text-white
          shadow-lg shadow-salus-600/30 flex items-center justify-center
          transition-all active:scale-95
        "
        aria-label="Registrar novo evento no diário"
      >
        <Plus size={24} />
      </button>

      <BottomSheet aberto={sheetAberto} onFechar={fecharSheet} titulo="Novo registro no Diário">
        <form onSubmit={handleRegistrar} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-texto-secundario mb-1">Tipo de registro</label>
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value as TipoEventoDiario)}
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm"
            >
              <option value="sintoma">Sintoma</option>
              <option value="medicamento">Remédio</option>
              <option value="medicao">Medição</option>
              <option value="vacina">Vacina</option>
              <option value="consulta">Consulta</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <Campo
            label="Título *"
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            placeholder="ex: Dor nas costas, Losartana 50mg, Pressão arterial"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Horário" type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} />
            <Campo
              label="Valor (opcional)"
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              placeholder="ex: 128/82 mmHg, 1 comprimido"
            />
          </div>
          <Campo
            label="Notas (opcional)"
            tipo="textarea"
            value={novasNotas}
            onChange={(e) => setNovasNotas(e.target.value)}
            placeholder="Contexto adicional, o que ajudou, observações..."
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-borda">
            <Botao variante="secundario" tamanho="sm" type="button" onClick={fecharSheet}>
              Cancelar
            </Botao>
            <Botao tamanho="sm" type="submit" disabled={salvando || !novoTitulo.trim()} icone={<Plus size={16} />}>
              Registrar
            </Botao>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
