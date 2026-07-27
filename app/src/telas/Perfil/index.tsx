import { useParams, useSearchParams, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, Badge, Botao, Carregando, EstadoVazio, Campo } from '../../core/ui';
import {
  User, Dog, Cat, FileText, Pill, Activity,
  ChevronLeft, Plus, Heart, X, RefreshCw, Link2, Eye, Download, FileWarning
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthProvider';
import { obterArquivoLocal } from '../../core/storage/indexedDB';
import { buscarMembro } from '../../modulos/membros/casos-de-uso/repositorioMembros';
import { listarMedicamentos, salvarMedicamento } from '../../modulos/medicamentos/casos-de-uso/repositorioMedicamentos';
import { listarExames, salvarExame } from '../../modulos/exames/casos-de-uso/repositorioExames';
import { listarVacinas, salvarVacina } from '../../modulos/vacinas/casos-de-uso/repositorioVacinas';
import type { Membro } from '../../modulos/membros/entidades/membro';
import type { Medicamento, StatusMedicamento } from '../../modulos/medicamentos/entidades/medicamento';
import type { Exame, FlagExame } from '../../modulos/exames/entidades/exame';
import type { Vacina } from '../../modulos/vacinas/entidades/vacina';

const abas = ['Ficha', 'Medicamentos', 'Exames', 'Vacinas'] as const;
type Aba = typeof abas[number];

const iconeMembro = { pessoa: User, cao: Dog, gato: Cat, outro: User };

export function Perfil() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { usuario, familiaId: familiaIdContexto } = useAuth();
  const familiaId = searchParams.get('familia') ?? familiaIdContexto;

  const [abaAtiva, setAbaAtiva] = useState<Aba>('Ficha');
  const [membro, setMembro] = useState<Membro | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modais de Adição
  const [modalTipo, setModalTipo] = useState<'med' | 'exame' | 'vacina' | 'vincular-exame' | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Modal Vincular Exame Existente
  const [examesSemVinculo, setExamesSemVinculo] = useState<Exame[]>([]);
  const [carregandoExamesSemVinculo, setCarregandoExamesSemVinculo] = useState(false);
  const [exameSelecionadoId, setExameSelecionadoId] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);

  // Visualizador de documento
  const [docViewer, setDocViewer] = useState<{ storageId: string; nome: string; mime: string } | null>(null);

  // Form Medicamento
  const [medNome, setMedNome] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medStatus, setMedStatus] = useState<StatusMedicamento>('em_uso');
  const [medRenovaEm, setMedRenovaEm] = useState('');

  // Form Exame
  const [exMarcador, setExMarcador] = useState('');
  const [exValor, setExValor] = useState('');
  const [exUnidade, setExUnidade] = useState('');
  const [exFlag, setExFlag] = useState<FlagExame>('normal');
  const [exData, setExData] = useState(new Date().toISOString().split('T')[0]);

  // Form Vacina
  const [vacNome, setVacNome] = useState('');
  const [vacAplicadaEm, setVacAplicadaEm] = useState('');
  const [vacProximaEm, setVacProximaEm] = useState('');
  const [vacLote, setVacLote] = useState('');

  const carregarTudo = async () => {
    if (!familiaId || !id) return;
    setCarregando(true);
    try {
      const [m, meds, exs, vacs] = await Promise.all([
        buscarMembro(familiaId, id),
        listarMedicamentos(familiaId, id),
        listarExames(familiaId, id),
        listarVacinas(familiaId, id),
      ]);

      setMembro(m);
      setMedicamentos(meds);
      setExames(exs);
      setVacinas(vacs);
    } catch (err) {
      console.error('[Perfil] Erro ao carregar dados do membro:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, [familiaId, id]);

  const handleSalvarMedicamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familiaId || !id || !medNome.trim()) return;
    setSalvando(true);
    try {
      await salvarMedicamento(familiaId, {
        membro_id: id,
        nome: medNome.trim(),
        dose: medDose.trim() || undefined,
        frequencia: medFreq.trim() || undefined,
        status: medStatus,
        renova_em: medRenovaEm || undefined,
      });

      setMedNome('');
      setMedDose('');
      setMedFreq('');
      setMedRenovaEm('');
      setModalTipo(null);
      await carregarTudo();
    } catch (err) {
      alert('Erro ao salvar medicamento: ' + (err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarExame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familiaId || !id || !exMarcador.trim()) return;
    setSalvando(true);
    try {
      await salvarExame(familiaId, {
        membro_id: id,
        marcador: exMarcador.trim(),
        valor: exValor.trim(),
        unidade: exUnidade.trim() || undefined,
        flag: exFlag,
        data: exData || new Date().toISOString().split('T')[0],
      });

      setExMarcador('');
      setExValor('');
      setExUnidade('');
      setModalTipo(null);
      await carregarTudo();
    } catch (err) {
      alert('Erro ao salvar exame: ' + (err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalVincularExame = async () => {
    if (!familiaId) return;
    setModalTipo('vincular-exame');
    setExameSelecionadoId(null);
    setCarregandoExamesSemVinculo(true);
    try {
      const todos = await listarExames(familiaId);
      setExamesSemVinculo(todos.filter((e) => !e.membro_id));
    } catch (err) {
      alert('Erro ao carregar exames sem vínculo: ' + (err as Error).message);
    } finally {
      setCarregandoExamesSemVinculo(false);
    }
  };

  const handleVincularExame = async () => {
    if (!familiaId || !id || !exameSelecionadoId) return;
    setVinculando(true);
    try {
      await salvarExame(familiaId, { id: exameSelecionadoId, membro_id: id });
      setModalTipo(null);
      setExameSelecionadoId(null);
      await carregarTudo();
    } catch (err) {
      alert('Erro ao vincular exame: ' + (err as Error).message);
    } finally {
      setVinculando(false);
    }
  };

  const handleSalvarVacina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familiaId || !id || !vacNome.trim()) return;
    setSalvando(true);
    try {
      await salvarVacina(familiaId, {
        membro_id: id,
        nome: vacNome.trim(),
        aplicada_em: vacAplicadaEm || undefined,
        proxima_em: vacProximaEm || undefined,
        lote: vacLote.trim() || undefined,
      });

      setVacNome('');
      setVacAplicadaEm('');
      setVacProximaEm('');
      setVacLote('');
      setModalTipo(null);
      await carregarTudo();
    } catch (err) {
      alert('Erro ao salvar vacina: ' + (err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return <Carregando texto="Carregando perfil e histórico de saúde..." />;
  }

  if (!membro) {
    return (
      <EstadoVazio
        icone={<User size={48} />}
        titulo="Membro não encontrado"
        descricao="Este membro não existe ou foi removido do seu banco de dados."
        acao={
          <NavLink to="/membros">
            <Botao variante="secundario">Voltar para Membros</Botao>
          </NavLink>
        }
      />
    );
  }

  const Icone = iconeMembro[membro.tipo] ?? User;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <NavLink to="/membros" className="mt-1 p-2 rounded-[var(--radius-md)] hover:bg-fundo-elevado transition-colors">
          <ChevronLeft size={20} className="text-texto-secundario" />
        </NavLink>
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-gradient-to-br from-salus-500 to-salus-700 flex items-center justify-center shadow-lg shrink-0">
          <Icone size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-texto">{membro.nome}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variante="salus">{membro.tipo === 'pessoa' ? 'Pessoa' : membro.tipo}</Badge>
            {membro.tipo_sanguineo && <Badge variante="neutro">{membro.tipo_sanguineo}</Badge>}
            {membro.raca && <Badge variante="neutro">{membro.raca}</Badge>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-borda">
        {abas.map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`
              px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] whitespace-nowrap transition-all
              ${abaAtiva === aba
                ? 'bg-salus-600/15 text-salus-400 border border-salus-600/30'
                : 'text-texto-secundario hover:text-texto hover:bg-fundo-elevado/50 border border-transparent'
              }
            `}
          >
            {aba}
          </button>
        ))}
      </div>

      {/* Tab Content: Ficha */}
      {abaAtiva === 'Ficha' && (
        <Card>
          <h2 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <FileText size={18} className="text-salus-400" />
            Ficha Clínica de Saúde
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-texto-secundario mb-1">Data de Nascimento</p>
              <p className="text-sm font-medium text-texto">{membro.nascimento ?? 'Não informada'}</p>
            </div>
            <div>
              <p className="text-xs text-texto-secundario mb-1">Vínculo Familiar</p>
              <p className="text-sm font-medium text-texto capitalize">{membro.vinculo}</p>
            </div>
            <div>
              <p className="text-xs text-texto-secundario mb-1">Condições / Doenças Ativas</p>
              <div className="flex flex-wrap gap-1">
                {membro.condicoes_ativas && membro.condicoes_ativas.length > 0
                  ? membro.condicoes_ativas.map((c) => <Badge key={c} variante="alerta">{c}</Badge>)
                  : <span className="text-sm text-texto-secundario">Nenhuma registrada</span>
                }
              </div>
            </div>
            <div>
              <p className="text-xs text-texto-secundario mb-1">Alergias Conocidas</p>
              <div className="flex flex-wrap gap-1">
                {membro.alergias && membro.alergias.length > 0
                  ? membro.alergias.map((a) => <Badge key={a} variante="vencido">{a}</Badge>)
                  : <span className="text-sm text-texto-secundario">Nenhuma conhecida</span>
                }
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Content: Medicamentos */}
      {abaAtiva === 'Medicamentos' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-texto flex items-center gap-2">
              <Pill size={18} className="text-salus-400" />
              Medicamentos ({medicamentos.length})
            </h2>
            <Botao variante="secundario" tamanho="sm" icone={<Plus size={16} />} onClick={() => setModalTipo('med')}>
              Adicionar Medicamento
            </Botao>
          </div>

          {medicamentos.length === 0 ? (
            <p className="text-sm text-texto-secundario py-4 text-center">Nenhum medicamento cadastrado para este membro no banco de dados.</p>
          ) : (
            <div className="space-y-2.5">
              {medicamentos.map((med) => (
                <div key={med.id} className="p-3.5 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-texto">{med.nome}</span>
                      {med.dose && <span className="text-xs text-texto-secundario font-medium">({med.dose})</span>}
                      <Badge variante={med.status === 'em_uso' ? 'salus' : 'neutro'}>{med.status}</Badge>
                    </div>
                    {med.frequencia && <p className="text-xs text-texto-secundario">Posologia: {med.frequencia}</p>}
                    {med.renova_em && <p className="text-xs text-alerta-400 mt-0.5">Renovar receita em: {med.renova_em}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab Content: Exames */}
      {abaAtiva === 'Exames' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-texto flex items-center gap-2">
              <Activity size={18} className="text-salus-400" />
              Exames ({exames.length})
            </h2>
            <div className="flex gap-2">
              <Botao variante="secundario" tamanho="sm" icone={<Link2 size={16} />} onClick={abrirModalVincularExame}>
                Vincular Exame Existente
              </Botao>
              <Botao variante="secundario" tamanho="sm" icone={<Plus size={16} />} onClick={() => setModalTipo('exame')}>
                Adicionar Exame
              </Botao>
            </div>
          </div>

          {exames.length === 0 ? (
            <p className="text-sm text-texto-secundario py-4 text-center">Nenhum exame registrado para este membro no banco de dados.</p>
          ) : (
            <div className="space-y-2.5">
              {exames.map((ex) => (
                <div key={ex.id} className="p-3.5 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-texto">{ex.marcador}:</span>
                      <span className="text-sm font-bold text-salus-400">{ex.valor} {ex.unidade}</span>
                      <Badge variante={ex.flag === 'normal' ? 'salus' : 'alerta'}>{ex.flag}</Badge>
                    </div>
                    <p className="text-xs text-texto-secundario">Data do exame: {ex.data}</p>
                  </div>
                  {ex.documento_id && (
                    <button
                      onClick={async () => {
                        if (!usuario) return;
                        const reg = await obterArquivoLocal(usuario.uid, ex.documento_id!);
                        if (reg) {
                          setDocViewer({ storageId: ex.documento_id!, nome: reg.registro.nome, mime: reg.registro.mime });
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-texto-secundario hover:text-salus-400 px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-fundo-elevado transition-colors shrink-0"
                      title="Ver documento original"
                    >
                      <Eye size={14} />
                      Documento
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab Content: Vacinas */}
      {abaAtiva === 'Vacinas' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-texto flex items-center gap-2">
              <Heart size={18} className="text-salus-400" />
              Carteira de Vacinação ({vacinas.length})
            </h2>
            <Botao variante="secundario" tamanho="sm" icone={<Plus size={16} />} onClick={() => setModalTipo('vacina')}>
              Adicionar Vacina
            </Botao>
          </div>

          {vacinas.length === 0 ? (
            <p className="text-sm text-texto-secundario py-4 text-center">Nenhuma vacina registrada para este membro no banco de dados.</p>
          ) : (
            <div className="space-y-2.5">
              {vacinas.map((vac) => (
                <div key={vac.id} className="p-3.5 rounded-[var(--radius-md)] bg-fundo-elevado/40 border border-borda/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-texto">{vac.nome}</span>
                      {vac.lote && <span className="text-xs text-texto-secundario">Lote: {vac.lote}</span>}
                    </div>
                    {vac.aplicada_em && <p className="text-xs text-texto-secundario">Aplicada em: {vac.aplicada_em}</p>}
                    {vac.proxima_em && <p className="text-xs text-alerta-400 mt-0.5">Próxima dose: {vac.proxima_em}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal Adicionar Medicamento */}
      {modalTipo === 'med' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fundo-card border border-borda rounded-[var(--radius-lg)] p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-texto flex items-center gap-2">
                <Pill size={20} className="text-salus-400" />
                Adicionar Medicamento no Banco
              </h3>
              <button onClick={() => setModalTipo(null)} className="text-texto-secundario hover:text-texto"><X size={18} /></button>
            </div>
            <form onSubmit={handleSalvarMedicamento} className="space-y-3">
              <Campo label="Nome do Medicamento *" value={medNome} onChange={(e) => setMedNome(e.target.value)} placeholder="ex: Losartana, Dipirona" required />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Dose" value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder="ex: 50mg, 10ml" />
                <div>
                  <label className="block text-sm font-medium text-texto-secundario mb-1">Status</label>
                  <select value={medStatus} onChange={(e) => setMedStatus(e.target.value as StatusMedicamento)} className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm">
                    <option value="em_uso">Em uso</option>
                    <option value="prescrito">Prescrito</option>
                    <option value="descontinuado">Descontinuado</option>
                  </select>
                </div>
              </div>
              <Campo label="Posologia / Frequência" value={medFreq} onChange={(e) => setMedFreq(e.target.value)} placeholder="ex: 1x ao dia pela manhã" />
              <Campo label="Data para Renovar Receita" type="date" value={medRenovaEm} onChange={(e) => setMedRenovaEm(e.target.value)} />
              <div className="flex justify-end gap-2 pt-2 border-t border-borda">
                <Botao variante="secundario" tamanho="sm" type="button" onClick={() => setModalTipo(null)}>Cancelar</Botao>
                <Botao tamanho="sm" type="submit" disabled={salvando || !medNome.trim()} icone={salvando ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}>
                  {salvando ? 'Salvar...' : 'Salvar no Firestore'}
                </Botao>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Exame */}
      {modalTipo === 'exame' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fundo-card border border-borda rounded-[var(--radius-lg)] p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-texto flex items-center gap-2">
                <Activity size={20} className="text-salus-400" />
                Adicionar Exame no Banco
              </h3>
              <button onClick={() => setModalTipo(null)} className="text-texto-secundario hover:text-texto"><X size={18} /></button>
            </div>
            <form onSubmit={handleSalvarExame} className="space-y-3">
              <Campo label="Marcador / Exame *" value={exMarcador} onChange={(e) => setExMarcador(e.target.value)} placeholder="ex: Glicemia, Colesterol Total" required />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Valor *" value={exValor} onChange={(e) => setExValor(e.target.value)} placeholder="ex: 95, 180" required />
                <Campo label="Unidade" value={exUnidade} onChange={(e) => setExUnidade(e.target.value)} placeholder="ex: mg/dL" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-texto-secundario mb-1">Status / Flag</label>
                  <select value={exFlag} onChange={(e) => setExFlag(e.target.value as FlagExame)} className="w-full px-3 py-2.5 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm">
                    <option value="normal">Normal</option>
                    <option value="alto">Alto</option>
                    <option value="baixo">Baixo</option>
                  </select>
                </div>
                <Campo label="Data do Exame" type="date" value={exData} onChange={(e) => setExData(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-borda">
                <Botao variante="secundario" tamanho="sm" type="button" onClick={() => setModalTipo(null)}>Cancelar</Botao>
                <Botao tamanho="sm" type="submit" disabled={salvando || !exMarcador.trim()} icone={salvando ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}>
                  {salvando ? 'Salvar...' : 'Salvar no Firestore'}
                </Botao>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Vincular Exame Existente */}
      {modalTipo === 'vincular-exame' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fundo-card border border-borda rounded-[var(--radius-lg)] p-6 max-w-md w-full max-h-[85dvh] overflow-y-auto space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-texto flex items-center gap-2">
                <Link2 size={20} className="text-salus-400" />
                Vincular Exame Existente
              </h3>
              <button onClick={() => setModalTipo(null)} className="text-texto-secundario hover:text-texto"><X size={18} /></button>
            </div>

            <p className="text-sm text-texto-secundario">
              Exames enviados antes de cadastrar este membro, ainda sem vínculo. Selecione um para associar a {membro.nome}.
            </p>

            {carregandoExamesSemVinculo ? (
              <p className="text-sm text-texto-secundario py-4 text-center">Carregando exames...</p>
            ) : examesSemVinculo.length === 0 ? (
              <p className="text-sm text-texto-secundario py-4 text-center">Nenhum exame sem vínculo encontrado.</p>
            ) : (
              <div className="space-y-2">
                {examesSemVinculo.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setExameSelecionadoId(ex.id)}
                    className={`w-full text-left p-3 rounded-[var(--radius-md)] border transition-colors ${
                      exameSelecionadoId === ex.id
                        ? 'border-salus-500 bg-salus-600/10'
                        : 'border-borda bg-fundo-elevado/40 hover:bg-fundo-elevado'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-texto">{ex.marcador}:</span>
                      <span className="text-sm font-bold text-salus-400">{ex.valor} {ex.unidade}</span>
                      <Badge variante={ex.flag === 'normal' ? 'salus' : 'alerta'}>{ex.flag}</Badge>
                    </div>
                    <p className="text-xs text-texto-secundario">Data do exame: {ex.data}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-borda">
              <Botao variante="secundario" tamanho="sm" type="button" onClick={() => setModalTipo(null)}>Cancelar</Botao>
              <Botao
                tamanho="sm"
                type="button"
                disabled={vinculando || !exameSelecionadoId}
                onClick={handleVincularExame}
                icone={vinculando ? <RefreshCw size={16} className="animate-spin" /> : <Link2 size={16} />}
              >
                {vinculando ? 'Vinculando...' : 'Vincular'}
              </Botao>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Vacina */}
      {modalTipo === 'vacina' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fundo-card border border-borda rounded-[var(--radius-lg)] p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-texto flex items-center gap-2">
                <Heart size={20} className="text-salus-400" />
                Adicionar Vacina no Banco
              </h3>
              <button onClick={() => setModalTipo(null)} className="text-texto-secundario hover:text-texto"><X size={18} /></button>
            </div>
            <form onSubmit={handleSalvarVacina} className="space-y-3">
              <Campo label="Nome da Vacina *" value={vacNome} onChange={(e) => setVacNome(e.target.value)} placeholder="ex: Influenza, Covid, V8" required />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Data de Aplicação" type="date" value={vacAplicadaEm} onChange={(e) => setVacAplicadaEm(e.target.value)} />
                <Campo label="Data Próxima Dose" type="date" value={vacProximaEm} onChange={(e) => setVacProximaEm(e.target.value)} />
              </div>
              <Campo label="Lote / Observação" value={vacLote} onChange={(e) => setVacLote(e.target.value)} placeholder="ex: Lote 2026-AB" />
              <div className="flex justify-end gap-2 pt-2 border-t border-borda">
                <Botao variante="secundario" tamanho="sm" type="button" onClick={() => setModalTipo(null)}>Cancelar</Botao>
                <Botao tamanho="sm" type="submit" disabled={salvando || !vacNome.trim()} icone={salvando ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}>
                  {salvando ? 'Salvar...' : 'Salvar no Firestore'}
                </Botao>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Visualizador de Documento (portal para evitar corte por overflow do layout pai) */}
      {docViewer && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDocViewer(null)} />
          <div className="relative w-full max-w-3xl max-h-[90dvh] flex flex-col rounded-[var(--radius-lg)] bg-fundo-card border border-borda shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-borda shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-salus-400 shrink-0" />
                <h2 className="text-sm font-semibold text-texto truncate">{docViewer.nome}</h2>
              </div>
              <button onClick={() => setDocViewer(null)} className="text-texto-secundario hover:text-texto p-2" aria-label="Fechar">
                <X size={18} />
              </button>
            </div>
            <VisualizadorDocumentoMVP
              storageId={docViewer.storageId}
              nomeArquivo={docViewer.nome}
              mimeType={docViewer.mime}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function VisualizadorDocumentoMVP({ storageId, nomeArquivo, mimeType }: {
  storageId: string; nomeArquivo: string; mimeType: string;
}) {
  const { usuario } = useAuth();
  const [urlOriginal, setUrlOriginal] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  const isImagem = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  useEffect(() => {
    async function carregar() {
      if (!usuario) return;
      setCarregando(true);
      setErro(false);
      try {
        const resultado = await obterArquivoLocal(usuario.uid, storageId);
        if (!resultado) { setErro(true); return; }
        const blob = new Blob([resultado.arquivo], { type: mimeType });
        setUrlOriginal(URL.createObjectURL(blob));
      } catch { setErro(true); }
      finally { setCarregando(false); }
    }
    carregar();
  }, [usuario, storageId, mimeType]);

  if (carregando) return <div className="flex-1 flex items-center justify-center p-8"><p className="text-sm text-texto-secundario animate-pulse">Carregando documento...</p></div>;
  if (erro) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-texto-secundario">
      <FileWarning size={32} className="mb-2 text-alerta-400" />
      <p className="text-sm font-medium text-alerta-400">Arquivo não encontrado</p>
      <p className="text-xs mt-1">O documento original pode ter sido removido do armazenamento local.</p>
    </div>
  );
  if (!urlOriginal) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col items-center">
      {isImagem ? (
        <img src={urlOriginal} alt={nomeArquivo} className="max-w-full max-h-[60dvh] rounded-[var(--radius-md)] object-contain" />
      ) : isPdf ? (
        <iframe src={urlOriginal} className="w-full h-[60dvh] rounded-[var(--radius-md)]" title={nomeArquivo} />
      ) : (
        <div className="flex flex-col items-center py-8 text-texto-secundario">
          <FileText size={40} className="mb-2 opacity-40" />
          <p className="text-sm">Pré-visualização não disponível para este tipo de arquivo.</p>
        </div>
      )}
      <div className="flex justify-end w-full pt-3">
        <Botao tamanho="sm" variante="secundario" icone={<Download size={14} />} onClick={() => { const a = document.createElement('a'); a.href = urlOriginal; a.download = nomeArquivo; a.click(); }}>
          Baixar
        </Botao>
      </div>
    </div>
  );
}
