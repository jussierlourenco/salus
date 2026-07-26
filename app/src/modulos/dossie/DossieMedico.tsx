import { useState, useMemo, useCallback } from 'react';
import {
  Stethoscope, Calendar, Pill, Activity, Heart, ChevronDown, ChevronUp,
  Sparkles, AlertTriangle, RefreshCw, Filter,
} from 'lucide-react';
import { Card, Badge, Botao } from '../../core/ui';
import { criarProvedor } from '../../core/ia/interface';
import type { ConfigProvedorIA } from '../../types/dominio';
import type { Membro } from '../membros/entidades/membro';
import type { Medicamento } from '../medicamentos/entidades/medicamento';
import type { Exame } from '../exames/entidades/exame';
import type { Vacina } from '../vacinas/entidades/vacina';
import type { Evento } from '../../core/database/repositorio';

type Periodo = '3m' | '6m' | '12m' | 'all';

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Último ano' },
  { value: 'all', label: 'Todo histórico' },
];

function dataLimite(periodo: Periodo): string {
  if (periodo === 'all') return '1900-01-01';
  const d = new Date();
  const meses = periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12;
  d.setMonth(d.getMonth() - meses);
  return d.toISOString().split('T')[0];
}

function fmtData(d: string): string {
  const p = d.split('T')[0]!.split('-');
  if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  return d;
}

interface DossieMedicoProps {
  membros: Membro[];
  medicamentos: Medicamento[];
  exames: Exame[];
  vacinas: Vacina[];
  eventos: Evento[];
  configIA?: ConfigProvedorIA;
}

export function DossieMedico({
  membros,
  medicamentos,
  exames,
  vacinas,
  eventos,
  configIA,
}: DossieMedicoProps) {
  const [membroId, setMembroId] = useState<string>('all');
  const [periodo, setPeriodo] = useState<Periodo>('12m');
  const [resumoIA, setResumoIA] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erroIA, setErroIA] = useState('');

  const temChaveIA = Boolean(configIA?.chave);

  const limite = useMemo(() => dataLimite(periodo), [periodo]);

  const membroSelecionado = membroId === 'all' ? null : membros.find((m) => m.id === membroId);

  const dadosFiltrados = useMemo(() => {
    const filtroMembro = (id?: string) => membroId === 'all' || id === membroId;

    return {
      membros: membroId === 'all' ? membros : [membroSelecionado].filter(Boolean) as Membro[],
      eventos: eventos
        .filter((e) => filtroMembro(e.membro_id) && e.data >= limite)
        .sort((a, b) => b.data.localeCompare(a.data)),
      exames: exames
        .filter((e) => filtroMembro(e.membro_id) && e.data >= limite)
        .sort((a, b) => b.data.localeCompare(a.data)),
      medicamentos: medicamentos
        .filter((m) => filtroMembro(m.membro_id))
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
      vacinas: vacinas
        .filter((v) => filtroMembro(v.membro_id) && v.aplicada_em && v.aplicada_em >= limite)
        .sort((a, b) => (b.aplicada_em || '').localeCompare(a.aplicada_em || '')),
    };
  }, [membroId, periodo, membros, eventos, exames, medicamentos, vacinas, membroSelecionado]);

  const especialidades = useMemo(() => {
    const set = new Set<string>();
    eventos.forEach((e) => {
      if (e.tipo) set.add(e.tipo);
      if (e.profissional) set.add(e.profissional.split('(').pop()?.replace(')', '').trim() || e.profissional);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [eventos]);

  const [especialidadeFiltro, setEspecialidadeFiltro] = useState<string>('');

  const dadosPorEspecialidade = useMemo(() => {
    if (!especialidadeFiltro) return dadosFiltrados.eventos;
    return dadosFiltrados.eventos.filter((e) =>
      e.tipo === especialidadeFiltro || e.profissional?.includes(especialidadeFiltro),
    );
  }, [dadosFiltrados, especialidadeFiltro]);

  const gerarResumo = useCallback(async () => {
    if (!configIA) return;
    setGerando(true);
    setErroIA('');
    setResumoIA(null);

    try {
      const provedor = criarProvedor(configIA);

      const contexto = [
        '=== DOSSIÊ MÉDICO GERADO PELO SALUS ===',
        `Filtro: ${membroSelecionado?.nome ?? 'Todos os membros'} · Período: ${PERIODOS.find((p) => p.value === periodo)?.label}`,
        '',
        '--- FAMILIARES ---',
        ...dadosFiltrados.membros.map((m) =>
          `- ${m.nome} (${m.tipo === 'pessoa' ? 'Pessoa' : m.tipo})${m.nascimento ? `, nasc. ${m.nascimento}` : ''}${m.condicoes_ativas?.length ? `, condições: ${m.condicoes_ativas.join(', ')}` : ''}${m.alergias?.length ? `, alergias: ${m.alergias.join(', ')}` : ''}`,
        ),
        '',
        '--- MEDICAMENTOS EM USO ---',
        ...dadosFiltrados.medicamentos
          .filter((m) => m.status === 'em_uso')
          .map((m) => {
            const nome = dadosFiltrados.membros.find((x) => x.id === m.membro_id)?.nome ?? 'desconhecido';
            return `- ${m.nome} (${nome}) · ${m.dose ?? ''} · ${m.frequencia ?? ''}${m.motivo ? ` — ${m.motivo}` : ''}`;
          }),
        '',
        '--- EVENTOS/CONSULTAS ---',
        ...dadosPorEspecialidade.slice(0, 30).map((e) => {
          const nome = dadosFiltrados.membros.find((x) => x.id === e.membro_id)?.nome ?? 'desconhecido';
          return `- ${fmtData(e.data)}: ${e.descricao} (${nome})${e.profissional ? ` · ${e.profissional}` : ''}`;
        }),
        '',
        '--- EXAMES RECENTES ---',
        ...dadosFiltrados.exames.slice(0, 40).map((e) => {
          const nome = dadosFiltrados.membros.find((x) => x.id === e.membro_id)?.nome ?? 'desconhecido';
          return `- ${e.marcador} (${nome}): ${e.valor}${e.unidade ? ` ${e.unidade}` : ''}${e.flag && e.flag !== 'nao_informado' ? ` [${e.flag}]` : ''}${e.data ? ` em ${fmtData(e.data)}` : ''}`;
        }),
        '',
        '--- VACINAS ---',
        ...dadosFiltrados.vacinas.map((v) => {
          const nome = dadosFiltrados.membros.find((x) => x.id === v.membro_id)?.nome ?? 'desconhecido';
          return `- ${v.nome} (${nome}) · Aplicada: ${v.aplicada_em ? fmtData(v.aplicada_em) : 'N/I'}${v.proxima_em ? ` · Próxima: ${fmtData(v.proxima_em)}` : ''}`;
        }),
      ].join('\n');

      const resposta = await provedor.chat(
        [{ papel: 'usuario' as const, conteudo: `Gere um resumo clínico organizado (dossiê médico) para apresentar a um novo médico. Inclua: 1) perfil do paciente, 2) condições ativas, 3) medicamentos em uso com motivos, 4) eventos recentes, 5) exames com alterações, 6) vacinas pendentes. Formato em tópicos concisos.` }],
        contexto,
      );

      setResumoIA(resposta.conteudo);
    } catch (err) {
      setErroIA(err instanceof Error ? err.message : 'Erro ao gerar resumo');
    } finally {
      setGerando(false);
    }
  }, [configIA, membroId, periodo, especialidadeFiltro, dadosFiltrados, dadosPorEspecialidade, membroSelecionado]);

  const temDados =
    dadosFiltrados.eventos.length > 0 ||
    dadosFiltrados.exames.length > 0 ||
    dadosFiltrados.medicamentos.some((m) => m.status === 'em_uso') ||
    dadosFiltrados.vacinas.length > 0;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={18} className="text-salus-400" />
          <h2 className="font-semibold text-texto">Dossiê Médico</h2>
        </div>
        {(dadosFiltrados.eventos.length > 0 || dadosFiltrados.exames.length > 0) && (
          <Badge variante="salus">Pronto para impressão</Badge>
        )}
      </div>

      {/* Filtros */}
      <Card padding="sm" className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-texto-secundario">
          <Filter size={14} />
          <span className="font-medium uppercase tracking-wider">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Membro */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[10px] text-texto-secundario uppercase tracking-wider mb-1">
              Membro
            </label>
            <select
              value={membroId}
              onChange={(e) => setMembroId(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-fundo-elevado/30 border border-borda/60 text-texto text-sm focus:outline-none focus:border-salus-500"
            >
              <option value="all">Todos os membros</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div>
            <label className="block text-[10px] text-texto-secundario uppercase tracking-wider mb-1">
              Período
            </label>
            <div className="flex gap-1">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodo(p.value)}
                  className={`px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border transition-all touch-target min-h-0 ${
                    periodo === p.value
                      ? 'bg-salus-600/15 border-salus-600/30 text-salus-400'
                      : 'bg-fundo-elevado/20 border-borda/50 text-texto-secundario hover:border-borda'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Especialidade (condicional) */}
        {especialidades.length > 0 && (
          <div>
            <label className="block text-[10px] text-texto-secundario uppercase tracking-wider mb-1">
              Especialidade / Profissional
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setEspecialidadeFiltro('')}
                className={`px-2 py-1 rounded-[var(--radius-sm)] text-xs border transition-all touch-target min-h-0 ${
                  especialidadeFiltro === ''
                    ? 'bg-salus-600/15 border-salus-600/30 text-salus-400'
                    : 'bg-fundo-elevado/20 border-borda/50 text-texto-secundario hover:border-borda'
                }`}
              >
                Todas
              </button>
              {especialidades.map((esp) => (
                <button
                  key={esp}
                  onClick={() => setEspecialidadeFiltro(esp === especialidadeFiltro ? '' : esp)}
                  className={`px-2 py-1 rounded-[var(--radius-sm)] text-xs border transition-all touch-target min-h-0 ${
                    especialidadeFiltro === esp
                      ? 'bg-salus-600/15 border-salus-600/30 text-salus-400'
                      : 'bg-fundo-elevado/20 border-borda/50 text-texto-secundario hover:border-borda'
                  }`}
                >
                  {esp}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Botão de Resumo IA */}
      {temChaveIA && temDados && (
        <div className="flex justify-start">
          <Botao
            tamanho="sm"
            onClick={gerarResumo}
            disabled={gerando}
            icone={gerando ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          >
            {gerando ? 'Gerando resumo...' : 'Sintetizar com IA'}
          </Botao>
        </div>
      )}

      {!temChaveIA && temDados && (
        <p className="text-xs text-alerta-400 flex items-center gap-1">
          <AlertTriangle size={12} />
          Configure uma chave de IA em Ajustes para gerar resumo automático do dossiê.
        </p>
      )}

      {/* Resumo da IA */}
      {resumoIA && (
        <Card className="border-salus-600/30 bg-salus-600/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-salus-400" />
            <span className="text-sm font-semibold text-texto">Resumo Clínico</span>
            <Badge variante="salus">IA</Badge>
          </div>
          <div className="text-sm text-texto whitespace-pre-wrap leading-relaxed">
            {resumoIA}
          </div>
        </Card>
      )}

      {erroIA && (
        <div className="p-3 rounded-[var(--radius-md)] text-sm flex items-start gap-2 border bg-alerta-950/40 border-alerta-500/40 text-alerta-300">
          <AlertTriangle size={16} className="text-alerta-400 shrink-0 mt-0.5" />
          <span>{erroIA}</span>
        </div>
      )}

      {/* Estado vazio */}
      {!temDados && (
        <div className="py-8 text-center text-texto-secundario">
          <Stethoscope size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum registro clínico encontrado para os filtros selecionados.</p>
          <p className="text-xs mt-1">Adicione dados pela Caixa de Entrada ou ajuste os filtros.</p>
        </div>
      )}

      {/* Dados agrupados */}
      {temDados && (
        <SecaoDados dados={dadosFiltrados} eventos={dadosPorEspecialidade} />
      )}
    </div>
  );
}

// ── Subcomponente de dados ──

interface DadosFiltrados {
  membros: Membro[];
  eventos: Evento[];
  exames: Exame[];
  medicamentos: Medicamento[];
  vacinas: Vacina[];
}

function SecaoDados({
  dados,
  eventos,
}: {
  dados: DadosFiltrados;
  eventos: Evento[];
}) {
  const [aberto, setAberto] = useState<string | null>(null);

  const toggle = (s: string) => setAberto((p) => (p === s ? null : s));

  return (
    <div className="space-y-3">
      {/* Eventos/Consultas */}
      <SecaoAccordion
        id="eventos"
        aberto={aberto}
        onToggle={toggle}
        icone={<Calendar size={16} className="text-salus-400" />}
        titulo="Eventos e Consultas"
        contagem={eventos.length}
      >
        {eventos.length === 0 ? (
          <p className="text-sm text-texto-secundario text-center py-4">Nenhum evento no período.</p>
        ) : (
          <div className="space-y-2">
            {eventos.map((e) => (
              <div key={e.id} className="p-3 rounded-[var(--radius-sm)] bg-fundo-elevado/20 border border-borda/40">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-texto">{fmtData(e.data)}</span>
                  <Badge variante="salus">{e.tipo}</Badge>
                </div>
                <p className="text-sm text-texto mt-1">{e.descricao}</p>
                {e.profissional && <p className="text-xs text-texto-secundario mt-0.5">{e.profissional}</p>}
              </div>
            ))}
          </div>
        )}
      </SecaoAccordion>

      {/* Medicamentos */}
      <SecaoAccordion
        id="medicamentos"
        aberto={aberto}
        onToggle={toggle}
        icone={<Pill size={16} className="text-alerta-400" />}
        titulo="Medicamentos"
        contagem={dados.medicamentos.filter((m) => m.status === 'em_uso').length}
      >
        {dados.medicamentos.filter((m) => m.status === 'em_uso').length === 0 ? (
          <p className="text-sm text-texto-secundario text-center py-4">Nenhum medicamento em uso.</p>
        ) : (
          <div className="space-y-2">
            {dados.medicamentos.filter((m) => m.status === 'em_uso').map((m) => (
              <div key={m.id} className="p-3 rounded-[var(--radius-sm)] bg-fundo-elevado/20 border border-borda/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-texto">{m.nome}</span>
                  <Badge variante="salus">Em uso</Badge>
                </div>
                <p className="text-xs text-texto-secundario mt-0.5">
                  {m.dose && `${m.dose}`}{m.dose && m.frequencia && ' · '}{m.frequencia && `${m.frequencia}`}
                  {m.motivo && ` — ${m.motivo}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </SecaoAccordion>

      {/* Exames */}
      <SecaoAccordion
        id="exames"
        aberto={aberto}
        onToggle={toggle}
        icone={<Activity size={16} className="text-salus-400" />}
        titulo="Exames"
        contagem={dados.exames.length}
      >
        {dados.exames.length === 0 ? (
          <p className="text-sm text-texto-secundario text-center py-4">Nenhum exame no período.</p>
        ) : (
          <div className="space-y-2">
            {dados.exames.map((e) => (
              <div key={e.id} className="p-3 rounded-[var(--radius-sm)] bg-fundo-elevado/20 border border-borda/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-texto">{e.marcador}</span>
                  <span className="text-sm text-texto">{e.valor}{e.unidade && <span className="text-texto-secundario text-xs ml-0.5">{e.unidade}</span>}</span>
                  {e.flag && e.flag !== 'nao_informado' && (
                    <Badge variante={e.flag === 'normal' ? 'salus' : 'alerta'}>{e.flag}</Badge>
                  )}
                </div>
                <p className="text-xs text-texto-secundario mt-0.5">{fmtData(e.data)}</p>
              </div>
            ))}
          </div>
        )}
      </SecaoAccordion>

      {/* Vacinas */}
      <SecaoAccordion
        id="vacinas"
        aberto={aberto}
        onToggle={toggle}
        icone={<Heart size={16} className="text-purple-400" />}
        titulo="Vacinas"
        contagem={dados.vacinas.length}
      >
        {dados.vacinas.length === 0 ? (
          <p className="text-sm text-texto-secundario text-center py-4">Nenhuma vacina registrada.</p>
        ) : (
          <div className="space-y-2">
            {dados.vacinas.map((v) => (
              <div key={v.id} className="p-3 rounded-[var(--radius-sm)] bg-fundo-elevado/20 border border-borda/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-texto">{v.nome}</span>
                  {v.aplicada_em && <Badge variante="salus">Aplicada</Badge>}
                </div>
                <p className="text-xs text-texto-secundario mt-0.5">
                  {v.aplicada_em && `Aplicada: ${fmtData(v.aplicada_em)}`}
                  {v.proxima_em && ` · Próxima: ${fmtData(v.proxima_em)}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </SecaoAccordion>
    </div>
  );
}

// ── Accordion Reutilizável ──

function SecaoAccordion({
  id,
  aberto,
  onToggle,
  icone,
  titulo,
  contagem,
  children,
}: {
  id: string;
  aberto: string | null;
  onToggle: (id: string) => void;
  icone: React.ReactNode;
  titulo: string;
  contagem: number;
  children: React.ReactNode;
}) {
  const isOpen = aberto === id;
  return (
    <Card padding="sm">
      <button
        onClick={() => onToggle(id)}
        className="flex items-center gap-2 w-full text-left"
      >
        {icone}
        <span className="text-sm font-semibold text-texto flex-1">{titulo}</span>
        <Badge variante="neutro">{contagem}</Badge>
        {isOpen ? <ChevronUp size={16} className="text-texto-secundario" /> : <ChevronDown size={16} className="text-texto-secundario" />}
      </button>
      {isOpen && <div className="mt-3 pt-3 border-t border-borda">{children}</div>}
    </Card>
  );
}
