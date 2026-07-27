import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Plus, Pill, ThermometerSun, Activity, Syringe, Stethoscope, NotebookPen,
} from 'lucide-react';
import { Card, Campo, Botao, Carregando, EstadoVazio, StripCalendar, Timeline, TimelineEvent, BottomSheet } from '../../core/ui';
import { useAuth } from '../../core/auth/AuthProvider';
import { listarEventos, salvarEvento } from '../../modulos/eventos/casos-de-uso/repositorioEventos';
import type { Evento } from '../../modulos/eventos/entidades/evento';

/**
 * Categorias reconhecidas pela UI do Diário para ícone/cor/filtro. `Evento.tipo` no Firestore
 * é livre (string) — qualquer valor fora deste conjunto (ex: extraído por IA) cai em 'outro'.
 */
type TipoEventoDiario = 'medicamento' | 'sintoma' | 'medicao' | 'vacina' | 'consulta' | 'outro';

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

function categorizar(tipo: string): TipoEventoDiario {
  return tipo in ICONE_POR_TIPO ? (tipo as TipoEventoDiario) : 'outro';
}

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

interface AbaDiarioProps {
  familiaId: string;
  membroId: string;
}

export function AbaDiario({ familiaId, membroId }: AbaDiarioProps) {
  const { usuario } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
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

  const carregarEventos = async () => {
    setCarregando(true);
    try {
      const lista = await listarEventos(familiaId, membroId);
      setEventos(lista);
    } catch (err) {
      console.error('[AbaDiario] Erro ao carregar eventos:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familiaId, membroId]);

  const eventosDoDia = useMemo(() => {
    return eventos
      .filter((ev) => ev.data === dataSelecionada)
      .filter((ev) => filtroAtivo === 'todos' || categorizar(ev.tipo) === filtroAtivo)
      .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
  }, [eventos, dataSelecionada, filtroAtivo]);

  const fecharSheet = () => {
    setSheetAberto(false);
    setNovoTipo('sintoma');
    setNovoTitulo('');
    setNovaHora(new Date().toTimeString().slice(0, 5));
    setNovoValor('');
    setNovasNotas('');
  };

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;
    setSalvando(true);
    try {
      await salvarEvento(familiaId, {
        membro_id: membroId,
        data: dataSelecionada,
        hora: novaHora || undefined,
        tipo: novoTipo,
        descricao: novoTitulo.trim(),
        valor: novoValor.trim() || undefined,
        notas: novasNotas.trim() || undefined,
        criado_por: usuario?.uid,
      });
      fecharSheet();
      await carregarEventos();
    } catch (err) {
      alert('Erro ao registrar no Diário: ' + (err as Error).message);
    } finally {
      setSalvando(false);
    }
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
      {carregando ? (
        <Carregando texto="Carregando diário..." />
      ) : eventosDoDia.length === 0 ? (
        <EstadoVazio
          icone={<NotebookPen size={40} />}
          titulo="Nenhum registro neste dia"
          descricao="Toque no botão + para anotar um sintoma, medicação, medição ou nota rápida."
        />
      ) : (
        <Timeline>
          {eventosDoDia.map((ev) => {
            const Icone = ICONE_POR_TIPO[categorizar(ev.tipo)];
            return (
              <TimelineEvent
                key={ev.id}
                hora={ev.hora ?? '—'}
                icone={<Icone size={14} />}
                titulo={ev.descricao}
                valor={ev.valor}
                descricao={ev.notas}
                corIcone={ESTILO_ICONE_POR_TIPO[categorizar(ev.tipo)]}
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
            <Botao
              tamanho="sm"
              type="submit"
              disabled={salvando || !novoTitulo.trim()}
              icone={salvando ? undefined : <Plus size={16} />}
              carregando={salvando}
            >
              {salvando ? 'Registrando...' : 'Registrar'}
            </Botao>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
