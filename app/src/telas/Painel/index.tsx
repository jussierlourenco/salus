import { useState, useEffect } from 'react';
import { Card, Badge, Carregando } from '../../core/ui';
import {
  Activity,
  Pill,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Heart,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  FlaskConical,
  Syringe,
  Inbox,
  Stethoscope,
  Hash,
  Droplets,
  Weight,
  User,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { listarMembros } from '../../modulos/membros/casos-de-uso/repositorioMembros';
import { listarMedicamentos } from '../../modulos/medicamentos/casos-de-uso/repositorioMedicamentos';
import { listarExames } from '../../modulos/exames/casos-de-uso/repositorioExames';
import { listarVacinas } from '../../modulos/vacinas/casos-de-uso/repositorioVacinas';
import { listarEventos } from '../../core/database/repositorio';
import { calcularAlertas } from '../../dominio/alertas';
import type { Membro } from '../../modulos/membros/entidades/membro';
import type { Medicamento } from '../../modulos/medicamentos/entidades/medicamento';
import type { Exame } from '../../modulos/exames/entidades/exame';
import type { Vacina } from '../../modulos/vacinas/entidades/vacina';
import type { Evento } from '../../core/database/repositorio';
import type { Alerta } from '../../types/dominio';

type SecaoAberta = 'membros' | 'medicamentos' | 'alertas' | 'exames_vacinas' | null;

const badgeVariante = {
  vencido: 'vencido' as const,
  vencendo_30d: 'alerta' as const,
  proximo_90d: 'neutro' as const,
};

const badgeTexto = {
  vencido: 'Vencido',
  vencendo_30d: 'Vence em 30d',
  proximo_90d: 'Próximos 90d',
};

function formatarData(data?: string): string {
  if (!data) return '';
  // Aceita YYYY-MM-DD ou ISO
  const d = data.split('T')[0]?.split(' ')[0] ?? data;
  const partes = d.split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return d;
}

// ── Subcomponente: Timeline ──

function TimelineLinha({ data, children }: { data: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-8 pb-5 last:pb-0 group">
      {/* Linha vertical */}
      <div className="absolute left-[11px] top-2 bottom-0 w-px bg-borda group-last:hidden" />
      {/* Bolinha */}
      <div className="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-2 border-salus-500/40 bg-fundo-card flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-salus-500" />
      </div>
      {/* Data */}
      <p className="text-[11px] font-medium text-texto-secundario uppercase tracking-wider mb-1">{data}</p>
      {/* Conteúdo */}
      <div>{children}</div>
    </div>
  );
}

// ── Componente principal ──

export function Painel() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [secaoAberta, setSecaoAberta] = useState<SecaoAberta>(null);

  const [membros, setMembros] = useState<Membro[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDados() {
      if (!usuario) return;
      setCarregando(true);
      try {
        const [mList, medList, exList, vacList, evList] = await Promise.all([
          listarMembros(usuario.uid),
          listarMedicamentos(usuario.uid),
          listarExames(usuario.uid),
          listarVacinas(usuario.uid),
          listarEventos(usuario.uid),
        ]);

        setMembros(mList);
        setMedicamentos(medList);
        setExames(exList);
        setVacinas(vacList);
        setEventos(evList);

        const alertasCalculados = calcularAlertas(mList, medList, vacList, []);
        setAlertas(alertasCalculados);
      } catch (err) {
        console.error('[Painel] Erro ao carregar dados do Firestore:', err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [usuario]);

  if (carregando) {
    return <Carregando texto="Carregando indicadores de saúde..." />;
  }

  const medsAtivosCount = medicamentos.filter((m) => m.status === 'em_uso' || m.status === 'prescrito').length;

  const toggleSecao = (secao: SecaoAberta) => {
    setSecaoAberta((prev) => (prev === secao ? null : secao));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Activity size={24} className="text-salus-500" />
          Painel de Saúde
        </h1>
        <p className="text-texto-secundario mt-1 text-sm">
          Clique nos cards para explorar os registros cadastrados.
        </p>
      </div>

      {/* Stats Grid — clicáveis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => toggleSecao('membros')} className="text-left">
          <Card hover padding="sm" className={`transition-all duration-200 ${secaoAberta === 'membros' ? 'ring-2 ring-salus-500/40' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-salus-400">
                <Users size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-texto">{membros.length}</p>
                <p className="text-xs text-texto-secundario">Membros Cadastrados</p>
              </div>
            </div>
          </Card>
        </button>
        <button onClick={() => toggleSecao('medicamentos')} className="text-left">
          <Card hover padding="sm" className={`transition-all duration-200 ${secaoAberta === 'medicamentos' ? 'ring-2 ring-salus-500/40' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-salus-400">
                <Pill size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-texto">{medsAtivosCount}</p>
                <p className="text-xs text-texto-secundario">Medicamentos Ativos</p>
              </div>
            </div>
          </Card>
        </button>
        <button onClick={() => toggleSecao('alertas')} className="text-left">
          <Card hover padding="sm" className={`transition-all duration-200 ${secaoAberta === 'alertas' ? 'ring-2 ring-salus-500/40' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`shrink-0 ${alertas.length > 0 ? 'text-alerta-400' : 'text-salus-400'}`}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-texto">{alertas.length}</p>
                <p className="text-xs text-texto-secundario">Alertas Pendentes</p>
              </div>
            </div>
          </Card>
        </button>
        <button onClick={() => toggleSecao('exames_vacinas')} className="text-left">
          <Card hover padding="sm" className={`transition-all duration-200 ${secaoAberta === 'exames_vacinas' ? 'ring-2 ring-salus-500/40' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-salus-400">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-texto">{exames.length + vacinas.length}</p>
                <p className="text-xs text-texto-secundario">Exames e Vacinas</p>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {/* ── Conteúdo das seções ── */}

      {/* Membros */}
      {secaoAberta === 'membros' && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-salus-400" />
            <h2 className="font-semibold text-texto">Membros da Família</h2>
            <Badge variante="neutro">{membros.length} total</Badge>
          </div>

          {membros.length === 0 ? (
            <div className="p-6 text-center text-texto-secundario border border-borda/50 rounded-[var(--radius-md)] bg-fundo-elevado/20">
              <p className="text-sm">Nenhum membro cadastrado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {membros.map((m) => (
                <div key={m.id} className="p-4 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-salus-600/15 flex items-center justify-center shrink-0">
                      {m.tipo === 'cao' ? <Stethoscope size={18} className="text-salus-400" /> : m.tipo === 'gato' ? <Stethoscope size={18} className="text-salus-400" /> : <User size={18} className="text-salus-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-texto">{m.nome}</p>
                        <Badge variante="neutro">{m.tipo === 'pessoa' ? 'Pessoa' : m.tipo === 'cao' ? 'Cão' : m.tipo === 'gato' ? 'Gato' : 'Outro'}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-texto-secundario mt-2">
                        {m.nascimento && <span><Hash size={10} className="inline mr-1" />{formatarData(m.nascimento)}</span>}
                        {m.raca && <span><Droplets size={10} className="inline mr-1" />Raça: {m.raca}</span>}
                        {m.peso_kg && <span><Weight size={10} className="inline mr-1" />{m.peso_kg} kg</span>}
                        {m.tipo_sanguineo && <span><Droplets size={10} className="inline mr-1" />Tipo: {m.tipo_sanguineo}</span>}
                      </div>
                      {m.condicoes_ativas?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.condicoes_ativas.map((c) => (
                            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-alerta-600/10 text-alerta-400 border border-alerta-600/20">{c}</span>
                          ))}
                        </div>
                      )}
                      {m.alergias?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.alergias.map((a) => (
                            <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-vencido-500/10 text-vencido-500 border border-vencido-500/20">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Medicamentos */}
      {secaoAberta === 'medicamentos' && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Pill size={18} className="text-alerta-400" />
            <h2 className="font-semibold text-texto">Medicamentos</h2>
            <Badge variante="neutro">{medicamentos.length} total</Badge>
          </div>

          {medicamentos.length === 0 ? (
            <div className="p-6 text-center text-texto-secundario border border-borda/50 rounded-[var(--radius-md)] bg-fundo-elevado/20">
              <p className="text-sm">Nenhum medicamento registrado.</p>
            </div>
          ) : (
            <div>
              {medicamentos
                .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
                .map((med) => {
                  const membro = membros.find((m) => m.id === med.membro_id);
                  return (
                    <div key={med.id} className="flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 mb-2">
                      <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-alerta-600/10 flex items-center justify-center shrink-0">
                        <Pill size={18} className="text-alerta-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-texto">{med.nome}</p>
                          <Badge variante={med.status === 'em_uso' ? 'salus' : med.status === 'prescrito' ? 'alerta' : 'neutro'}>
                            {med.status === 'em_uso' ? 'Em uso' : med.status === 'prescrito' ? 'Prescrito' : 'Descont.'}
                          </Badge>
                        </div>
                        <div className="text-xs text-texto-secundario space-y-0.5">
                          <p>{membro?.nome ?? 'Membro'} · Cadastrado em {formatarData(med.criado_em)}</p>
                          {med.dose && <p>Dose: {med.dose}</p>}
                          {med.frequencia && <p>Frequência: {med.frequencia}</p>}
                          {med.motivo && <p>Motivo: {med.motivo}</p>}
                          {med.desde && <p>Desde: {formatarData(med.desde)}</p>}
                          {med.renova_em && <p>Renova em: {formatarData(med.renova_em)}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      )}

      {/* Alertas */}
      {secaoAberta === 'alertas' && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-alerta-400" />
            <h2 className="font-semibold text-texto">Alertas de Saúde</h2>
            <Badge variante="alerta">{alertas.length} pendente(s)</Badge>
          </div>

          {alertas.length === 0 ? (
            <div className="p-6 text-center text-texto-secundario space-y-2 border border-borda/50 rounded-[var(--radius-md)] bg-fundo-elevado/20">
              <CheckCircle2 size={32} className="mx-auto text-salus-400/80 mb-1" />
              <p className="text-sm font-medium text-texto">Nenhum alerta pendente</p>
              <p className="text-xs">Todos os medicamentos e vacinas estão em dia.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60"
                >
                  <div className="shrink-0 mt-0.5">
                    {alerta.tipo === 'vacina' ? <Heart size={18} className="text-salus-400" /> : alerta.tipo === 'medicamento' ? <Pill size={18} className="text-alerta-400" /> : <Clock size={18} className="text-texto-secundario" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-texto">{alerta.membro_nome}</span>
                      <Badge variante={badgeVariante[alerta.nivel]}>{badgeTexto[alerta.nivel]}</Badge>
                    </div>
                    <p className="text-sm text-texto-secundario">{alerta.descricao}</p>
                    <p className="text-xs text-texto-secundario/60 mt-0.5">Data: {formatarData(alerta.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Exames e Vacinas — Timeline cronológica */}
      {secaoAberta === 'exames_vacinas' && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={18} className="text-salus-400" />
            <h2 className="font-semibold text-texto">Exames e Vacinas</h2>
            <Badge variante="neutro">{exames.length + vacinas.length} total</Badge>
          </div>
          <p className="text-xs text-texto-secundario mb-4">Linha do tempo cronológica dos registros clínicos.</p>

          {exames.length === 0 && vacinas.length === 0 ? (
            <div className="p-6 text-center text-texto-secundario space-y-2 border border-borda/50 rounded-[var(--radius-md)] bg-fundo-elevado/20">
              <Inbox size={32} className="mx-auto text-texto-secundario/40 mb-1" />
              <p className="text-sm font-medium text-texto">Nenhum exame ou vacina ainda</p>
              <p className="text-xs">
                Use a{' '}
                <button onClick={() => navigate('/caixa-de-entrada')} className="text-salus-400 hover:underline">
                  Caixa de Entrada
                </button>
                {' '}para enviar documentos e extrair dados.
              </p>
            </div>
          ) : (
            <>
              {/* Timeline de Exames */}
              {exames.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical size={16} className="text-salus-400" />
                    <h3 className="text-sm font-semibold text-texto">Exames</h3>
                    <Badge variante="neutro">{exames.length}</Badge>
                  </div>

                  {exames
                    .slice()
                    .sort((a, b) => (b.data || b.criado_em).localeCompare(a.data || a.criado_em))
                    .map((ex) => {
                      const membro = membros.find((m) => m.id === ex.membro_id);
                      return (
                        <TimelineLinha key={ex.id} data={formatarData(ex.data || ex.criado_em)}>
                          <div className="p-3 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-texto">{ex.marcador}</p>
                              {ex.flag && (
                                <Badge variante={ex.flag === 'alto' ? 'vencido' : ex.flag === 'baixo' ? 'alerta' : 'neutro'}>
                                  {ex.flag}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-texto-secundario space-y-0.5">
                              <p>{membro?.nome ?? 'Membro'}</p>
                              <p>
                                <span className="font-medium text-texto">{ex.valor}</span>
                                {ex.unidade ? ` ${ex.unidade}` : ''}
                              </p>
                              {ex.painel && <p>Painel: {ex.painel}</p>}
                              {ex.faixa_referencia_laudo && <p>Ref.: {ex.faixa_referencia_laudo}</p>}
                            </div>
                          </div>
                        </TimelineLinha>
                      );
                    })}
                </div>
              )}

              {/* Timeline de Vacinas */}
              {vacinas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Syringe size={16} className="text-purple-400" />
                    <h3 className="text-sm font-semibold text-texto">Vacinas</h3>
                    <Badge variante="neutro">{vacinas.length}</Badge>
                  </div>

                  {vacinas
                    .slice()
                    .sort((a, b) => {
                      const da = a.aplicada_em || a.criado_em;
                      const db = b.aplicada_em || b.criado_em;
                      return db.localeCompare(da);
                    })
                    .map((vac) => {
                      const membro = membros.find((m) => m.id === vac.membro_id);
                      return (
                        <TimelineLinha key={vac.id} data={formatarData(vac.aplicada_em || vac.criado_em)}>
                          <div className="p-3 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-texto">{vac.nome}</p>
                              {vac.proxima_em && <Badge variante="alerta">Próx: {formatarData(vac.proxima_em)}</Badge>}
                            </div>
                            <div className="text-xs text-texto-secundario space-y-0.5">
                              <p>{membro?.nome ?? 'Membro'}</p>
                              {vac.lote && <p>Lote: {vac.lote}</p>}
                              {vac.local && <p>Local: {vac.local}</p>}
                            </div>
                          </div>
                        </TimelineLinha>
                      );
                    })}
                </div>
              )}

              {/* Timeline de Eventos */}
              {eventos.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-texto">Eventos</h3>
                    <Badge variante="neutro">{eventos.length}</Badge>
                  </div>

                  {eventos
                    .slice()
                    .sort((a, b) => (b.data || b.criado_em).localeCompare(a.data || a.criado_em))
                    .map((ev) => {
                      const membro = membros.find((m) => m.id === ev.membro_id);
                      return (
                        <TimelineLinha key={ev.id} data={formatarData(ev.data || ev.criado_em)}>
                          <div className="p-3 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60">
                            <p className="text-sm font-semibold text-texto">{ev.descricao}</p>
                            <div className="text-xs text-texto-secundario mt-0.5">
                              <span>{membro?.nome ?? 'Membro'}</span>
                              {ev.tipo && <span> · {ev.tipo}</span>}
                              {ev.profissional && <span> · {ev.profissional}</span>}
                            </div>
                          </div>
                        </TimelineLinha>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Últimos Registros (atalho) */}
      {secaoAberta === null && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-salus-400" />
            <h2 className="font-semibold text-texto">Atalho</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => toggleSecao('membros')} className="p-4 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 text-left hover:bg-fundo-elevado/50 transition-colors">
              <Users size={20} className="text-salus-400 mb-2" />
              <p className="text-sm font-semibold text-texto">Ver Membros</p>
              <p className="text-xs text-texto-secundario mt-0.5">{membros.length} cadastrados</p>
            </button>
            <button onClick={() => toggleSecao('medicamentos')} className="p-4 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 text-left hover:bg-fundo-elevado/50 transition-colors">
              <Pill size={20} className="text-alerta-400 mb-2" />
              <p className="text-sm font-semibold text-texto">Ver Medicamentos</p>
              <p className="text-xs text-texto-secundario mt-0.5">{medsAtivosCount} ativos</p>
            </button>
            <button onClick={() => toggleSecao('exames_vacinas')} className="p-4 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 text-left hover:bg-fundo-elevado/50 transition-colors">
              <FlaskConical size={20} className="text-salus-400 mb-2" />
              <p className="text-sm font-semibold text-texto">Ver Exames e Vacinas</p>
              <p className="text-xs text-texto-secundario mt-0.5">{exames.length + vacinas.length} registros</p>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
