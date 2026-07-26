import { useState, useEffect } from 'react';
import { Card, Badge, Carregando, VisualizadorDocumento } from '../../core/ui';
import {
  Activity, Pill, AlertTriangle, Calendar, TrendingUp, Heart, Users, Clock,
  CheckCircle2, FileText, Inbox, Image, Mic,
  ChevronRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { listarMembros } from '../../modulos/membros/casos-de-uso/repositorioMembros';
import { listarMedicamentos } from '../../modulos/medicamentos/casos-de-uso/repositorioMedicamentos';
import { listarExames } from '../../modulos/exames/casos-de-uso/repositorioExames';
import { listarVacinas } from '../../modulos/vacinas/casos-de-uso/repositorioVacinas';
import { listarCaixaEntrada } from '../../modulos/caixa-entrada/casos-de-uso/repositorioCaixaEntrada';
import { calcularAlertas } from '../../dominio/alertas';
import type { Membro } from '../../modulos/membros/entidades/membro';
import type { Medicamento } from '../../modulos/medicamentos/entidades/medicamento';
import type { Exame } from '../../modulos/exames/entidades/exame';
import type { Vacina } from '../../modulos/vacinas/entidades/vacina';
import type { CaixaEntradaItem } from '../../modulos/caixa-entrada/entidades/caixaEntrada';
import type { Alerta } from '../../types/dominio';

type SecaoAberta = 'membros' | 'medicamentos' | 'alertas' | null;

const badgeVariante = { vencido: 'vencido' as const, vencendo_30d: 'alerta' as const, proximo_90d: 'neutro' as const };
const badgeTexto = { vencido: 'Vencido', vencendo_30d: 'Vence em 30d', proximo_90d: 'Próximos 90d' };

function fmtData(d?: string): string {
  if (!d) return '';
  const p = d.split('T')[0]!.split('-');
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  return d;
}

function mesAno(d: string): string {
  const p = d.split('T')[0]!.split('-');
  if (p.length < 2) return d;
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[parseInt(p[1]!) - 1] || p[1]} ${p[0]}`;
}

function iconeTipo(item: CaixaEntradaItem) {
  const m = item.mime_type || '';
  if (m.startsWith('image/')) return { icon: Image, cor: 'text-purple-400', bg: 'bg-purple-600/10', label: 'Imagem' };
  if (m.startsWith('audio/')) return { icon: Mic, cor: 'text-alerta-400', bg: 'bg-alerta-600/10', label: 'Áudio' };
  if (m === 'application/pdf') return { icon: FileText, cor: 'text-vencido-500', bg: 'bg-vencido-500/10', label: 'PDF' };
  return { icon: FileText, cor: 'text-salus-400', bg: 'bg-salus-600/10', label: 'Documento' };
}

function statusBadge(item: CaixaEntradaItem) {
  switch (item.status) {
    case 'confirmado': return <Badge variante="salus">Confirmado</Badge>;
    case 'processando': return <Badge variante="alerta">Processando...</Badge>;
    case 'proposta_pronta': return <Badge variante="neutro">Proposta</Badge>;
    case 'descartado': return <Badge variante="neutro">Descartado</Badge>;
    default: return <Badge variante="neutro">{item.status}</Badge>;
  }
}

function resumoProposta(item: CaixaEntradaItem): string[] {
  const p = item.proposta;
  if (!p) return [];
  const linhas: string[] = [];
  if (p.tipo_documento) linhas.push(p.tipo_documento);
  const total = (p.medicamentos?.length ?? 0) + (p.exames?.length ?? 0) + (p.vacinas?.length ?? 0);
  if (total > 0) linhas.push(`${total} dado(s) extraído(s)`);
  return linhas;
}

// ── Timeline Item ──

function CardTimeline({
  item,
  onAbrirDocumento,
}: {
  item: CaixaEntradaItem;
  onAbrirDocumento: (item: CaixaEntradaItem) => void;
}) {
  const tipo = iconeTipo(item);
  const Icone = tipo.icon;
  const resumo = resumoProposta(item);
  const data = item.data_evento || item.criado_em;

  return (
    <button
      onClick={() => onAbrirDocumento(item)}
      className="w-full text-left group"
    >
      <div className="relative pl-8 pb-3 last:pb-0">
        <div className="absolute left-[11px] top-2 bottom-0 w-px bg-borda group-last:hidden" />
        <div className={`absolute left-0 top-1 w-[23px] h-[23px] rounded-full border-2 border-borda bg-fundo-card flex items-center justify-center`}>
          <div className="w-2 h-2 rounded-full bg-salus-500" />
        </div>

        <div className={`p-3 rounded-[var(--radius-md)] border transition-all
          ${item.status === 'processando'
            ? 'bg-fundo-elevado/20 border-borda/50 animate-pulse-soft'
            : 'bg-fundo-elevado/40 border-borda/60 hover:bg-fundo-elevado/60 hover:border-salus-600/30'
          }`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-[var(--radius-sm)] ${tipo.bg} flex items-center justify-center shrink-0`}>
              <Icone size={16} className={tipo.cor} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-texto truncate">{item.nome_arquivo}</p>
                {statusBadge(item)}
              </div>
              <p className="text-xs text-texto-secundario">
                {tipo.label} · {fmtData(data)}
              </p>
              {resumo.length > 0 && (
                <p className="text-xs text-salus-400 mt-1 flex items-center gap-1">
                  <Sparkles size={10} />
                  {resumo.join(' · ')}
                </p>
              )}
              {item.proposta?.notas && (
                <p className="text-xs text-texto-secundario mt-1 line-clamp-2">{item.proposta.notas}</p>
              )}
            </div>
            <ChevronRight size={16} className="text-texto-secundario/40 group-hover:text-texto-secundario transition-colors shrink-0 mt-2" />
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Componente Principal ──

export function Painel() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [secaoAberta, setSecaoAberta] = useState<SecaoAberta>(null);

  const [membros, setMembros] = useState<Membro[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [caixaEntrada, setCaixaEntrada] = useState<CaixaEntradaItem[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  // Visualizador de documento
  const [docAberto, setDocAberto] = useState<CaixaEntradaItem | null>(null);

  useEffect(() => {
    async function carregar() {
      if (!usuario) return;
      setCarregando(true);
      try {
        const [mList, medList, exList, vacList, ceList] = await Promise.all([
          listarMembros(usuario.uid),
          listarMedicamentos(usuario.uid),
          listarExames(usuario.uid),
          listarVacinas(usuario.uid),
          listarCaixaEntrada(usuario.uid),
        ]);
        setMembros(mList);
        setMedicamentos(medList);
        setExames(exList);
        setVacinas(vacList);
        setCaixaEntrada(ceList.filter((i) => i.status !== 'descartado'));
        setAlertas(calcularAlertas(mList, medList, vacList, []));
      } catch (err) {
        console.error('[Painel] Erro ao carregar:', err);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [usuario]);

  if (carregando) return <Carregando texto="Carregando painel..." />;

  const medsAtivos = medicamentos.filter((m) => m.status === 'em_uso' || m.status === 'prescrito').length;
  const docsConfirmados = caixaEntrada.filter((i) => i.status === 'confirmado');
  const itemsTimeline = [...docsConfirmados, ...caixaEntrada.filter((i) => i.status !== 'confirmado')]
    .sort((a, b) => (b.data_evento || b.criado_em).localeCompare(a.data_evento || a.criado_em));

  // Agrupar por mês/ano
  const grupos = new Map<string, CaixaEntradaItem[]>();
  for (const item of itemsTimeline) {
    const chave = mesAno(item.data_evento || item.criado_em);
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(item);
  }

  const toggleSecao = (s: SecaoAberta) => setSecaoAberta((p) => (p === s ? null : s));

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Activity size={24} className="text-salus-500" />
          Timeline de Saúde
        </h1>
        <p className="text-texto-secundario mt-1 text-sm">
          Linha do tempo dos documentos e registros clínicos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => toggleSecao('membros')} className="text-left">
          <Card hover padding="sm" className={secaoAberta === 'membros' ? 'ring-2 ring-salus-500/40' : ''}>
            <div className="flex items-center gap-3">
              <Users size={22} className="text-salus-400 shrink-0" />
              <div><p className="text-2xl font-bold text-texto">{membros.length}</p><p className="text-xs text-texto-secundario">Membros</p></div>
            </div>
          </Card>
        </button>
        <button onClick={() => toggleSecao('medicamentos')} className="text-left">
          <Card hover padding="sm" className={secaoAberta === 'medicamentos' ? 'ring-2 ring-salus-500/40' : ''}>
            <div className="flex items-center gap-3">
              <Pill size={22} className="text-alerta-400 shrink-0" />
              <div><p className="text-2xl font-bold text-texto">{medsAtivos}</p><p className="text-xs text-texto-secundario">Medicamentos</p></div>
            </div>
          </Card>
        </button>
        <button onClick={() => toggleSecao('alertas')} className="text-left">
          <Card hover padding="sm" className={secaoAberta === 'alertas' ? 'ring-2 ring-salus-500/40' : ''}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={22} className={`${alertas.length > 0 ? 'text-alerta-400' : 'text-salus-400'} shrink-0`} />
              <div><p className="text-2xl font-bold text-texto">{alertas.length}</p><p className="text-xs text-texto-secundario">Alertas</p></div>
            </div>
          </Card>
        </button>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <TrendingUp size={22} className="text-salus-400 shrink-0" />
            <div><p className="text-2xl font-bold text-texto">{exames.length + vacinas.length}</p><p className="text-xs text-texto-secundario">Exames+Vacinas</p></div>
          </div>
        </Card>
      </div>

      {/* Seções expandidas */}
      {secaoAberta === 'membros' && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4"><Users size={18} className="text-salus-400" /><h2 className="font-semibold text-texto">Membros</h2><Badge variante="neutro">{membros.length}</Badge></div>
          {membros.length === 0 ? <p className="text-sm text-texto-secundario text-center py-6">Nenhum membro.</p> : membros.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 mb-2">
              <div className="w-10 h-10 rounded-full bg-salus-600/15 flex items-center justify-center shrink-0"><Users size={18} className="text-salus-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-texto">{m.nome}</p>
                <p className="text-xs text-texto-secundario">{m.tipo} · {fmtData(m.nascimento)}</p>
                {m.condicoes_ativas?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{m.condicoes_ativas.map((c) => <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-alerta-600/10 text-alerta-400">{c}</span>)}</div>}
                {m.alergias?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{m.alergias.map((a) => <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-vencido-500/10 text-vencido-500">{a}</span>)}</div>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {secaoAberta === 'medicamentos' && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4"><Pill size={18} className="text-alerta-400" /><h2 className="font-semibold text-texto">Medicamentos</h2><Badge variante="neutro">{medicamentos.length}</Badge></div>
          {medicamentos.length === 0 ? <p className="text-sm text-texto-secundario text-center py-6">Nenhum.</p> : medicamentos.sort((a, b) => b.criado_em.localeCompare(a.criado_em)).map((med) => {
            const m = membros.find((x) => x.id === med.membro_id);
            return (<div key={med.id} className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 mb-2">
              <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-alerta-600/10 flex items-center justify-center shrink-0"><Pill size={18} className="text-alerta-400" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="text-sm font-semibold text-texto">{med.nome}</p><Badge variante={med.status === 'em_uso' ? 'salus' : med.status === 'prescrito' ? 'alerta' : 'neutro'}>{med.status === 'em_uso' ? 'Em uso' : med.status === 'prescrito' ? 'Prescrito' : 'Descont.'}</Badge></div>
                <p className="text-xs text-texto-secundario">{m?.nome ?? 'Membro'}{med.dose ? ` · ${med.dose}` : ''}{med.frequencia ? ` · ${med.frequencia}` : ''}</p>
                {med.motivo && <p className="text-xs text-texto-secundario mt-0.5">Motivo: {med.motivo}</p>}
              </div>
            </div>);
          })}
        </Card>
      )}

      {secaoAberta === 'alertas' && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={18} className="text-alerta-400" /><h2 className="font-semibold text-texto">Alertas</h2><Badge variante="alerta">{alertas.length}</Badge></div>
          {alertas.length === 0 ? <div className="p-6 text-center border border-borda/50 rounded-[var(--radius-md)]"><CheckCircle2 size={28} className="mx-auto text-salus-400 mb-1" /><p className="text-sm text-texto-secundario">Nenhum alerta.</p></div> : alertas.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60 mb-2">
              <div className="shrink-0 mt-0.5">{a.tipo === 'vacina' ? <Heart size={18} className="text-salus-400" /> : a.tipo === 'medicamento' ? <Pill size={18} className="text-alerta-400" /> : <Clock size={18} className="text-texto-secundario" />}</div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-semibold text-texto">{a.membro_nome}</span><Badge variante={badgeVariante[a.nivel]}>{badgeTexto[a.nivel]}</Badge></div><p className="text-sm text-texto-secundario">{a.descricao}</p></div>
            </div>
          ))}
        </Card>
      )}

      {/* Timeline Principal */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-salus-400" />
          <h2 className="font-semibold text-texto">Linha do Tempo</h2>
          <Badge variante="neutro">{itemsTimeline.length} registro(s)</Badge>
        </div>

        {itemsTimeline.length === 0 ? (
          <div className="p-8 text-center text-texto-secundario border border-borda/50 rounded-[var(--radius-md)]">
            <Inbox size={36} className="mx-auto text-texto-secundario/40 mb-2" />
            <p className="text-sm font-medium text-texto">Nenhum documento registrado</p>
            <p className="text-xs mt-1">Use a <button onClick={() => navigate('/caixa-de-entrada')} className="text-salus-400 hover:underline">Caixa de Entrada</button> para enviar documentos.</p>
          </div>
        ) : (
          [...grupos.entries()].map(([grupo, itens]) => (
            <div key={grupo} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Calendar size={14} className="text-salus-400" />
                <span className="text-xs font-semibold text-texto uppercase tracking-wider">{grupo}</span>
                <span className="text-[10px] text-texto-secundario">({itens.length})</span>
              </div>
              {itens.map((item) => (
                <CardTimeline
                  key={item.id}
                  item={item}
                  onAbrirDocumento={(i) => setDocAberto(i)}
                />
              ))}
            </div>
          ))
        )}
      </Card>

      {/* Modal do Visualizador */}
      {docAberto && (
        <VisualizadorDocumento
          storageId={docAberto.storage_id ?? ''}
          proposta={docAberto.proposta}
          nomeArquivo={docAberto.nome_arquivo}
          mimeType={docAberto.mime_type}
          onFechar={() => setDocAberto(null)}
        />
      )}
    </div>
  );
}
