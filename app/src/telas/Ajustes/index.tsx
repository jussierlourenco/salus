import { useState, useEffect } from 'react';
import { Card, Botao, Campo } from '../../core/ui';
import {
  Settings, Key, Download, Trash2,
  Shield, ChevronRight, CheckCircle2, AlertTriangle,
  RefreshCw, Eye, EyeOff, Check, X, Sun, Moon, Users, Copy, LogIn, UserPlus
} from 'lucide-react';
import { useConfiguracao } from '../../core/config/ConfigContext';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthProvider';
import { useTema } from '../../core/ui/useTema';
import { buscarFamilia, entrarEmFamilia, listarMembrosDaFamilia, type MembroFamilia } from '../../core/database/repositorioFamilias';
import { listarMembros, listarMembrosCompartilhados, removerCompartilhamento } from '../../modulos/membros/casos-de-uso/repositorioMembros';
import type { Membro } from '../../modulos/membros/entidades/membro';
import type { ConfigProvedorIA, ProvedorIATipo } from '../../types/dominio';
interface PresetItem {
  id: string;
  nome: string;
  tipo: ProvedorIATipo;
  url_base?: string;
  modelo_padrao: string;
  gratis: boolean;
  desc: string;
  url_obter_chave?: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'gemini',
    nome: 'Google Gemini',
    tipo: 'gemini',
    modelo_padrao: 'gemini-2.5-flash',
    gratis: true,
    desc: 'Recomendado · Excelente para PDFs, fotos de exames e chat',
    url_obter_chave: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'groq',
    nome: 'Groq',
    tipo: 'openai_compat',
    url_base: 'https://api.groq.com/openai/v1',
    modelo_padrao: 'llama-3.3-70b-versatile',
    gratis: true,
    desc: 'Ultra rápido · Ideal para o Chat em tempo real',
    url_obter_chave: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter',
    nome: 'OpenRouter',
    tipo: 'openai_compat',
    url_base: 'https://openrouter.ai/api/v1',
    modelo_padrao: 'google/gemini-2.5-flash-lite-001',
    gratis: true,
    desc: 'Catálogo variado com vários modelos gratuitos',
    url_obter_chave: 'https://openrouter.ai/settings/keys',
  },
  {
    id: 'mistral',
    nome: 'Mistral AI',
    tipo: 'openai_compat',
    url_base: 'https://api.mistral.ai/v1',
    modelo_padrao: 'mistral-small-latest',
    gratis: true,
    desc: 'Modelos europeus de alta precisão',
    url_obter_chave: 'https://console.mistral.ai/api-keys',
  },
  {
    id: 'custom',
    nome: 'Personalizado / Local',
    tipo: 'openai_compat',
    url_base: 'http://localhost:11434/v1',
    modelo_padrao: 'llama3',
    gratis: true,
    desc: 'Compatível com OpenAI (Ollama, LM Studio, vLLM)',
  },
];

export function Ajustes() {
  const { config, salvarConfigIA, testarIA, exportarDadosZip, apagarConta } = useConfiguracao();
  const { tema, alternarTema } = useTema();
  const { usuario, familiaId, recarregarUsuarioSalus } = useAuth();

  const [secaoAberta, setSecaoAberta] = useState<string | null>('ia');

  // Família compartilhada
  const [membrosFamilia, setMembrosFamilia] = useState<MembroFamilia[]>([]);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [codigoEntrar, setCodigoEntrar] = useState('');
  const [entrandoFamilia, setEntrandoFamilia] = useState(false);
  const [feedbackFamilia, setFeedbackFamilia] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Compartilhamentos por membro
  const [membrosCompartilhados, setMembrosCompartilhados] = useState<(Membro & { familia_origem_id: string })[]>([]);
  const [meusMembrosCompartilhados, setMeusMembrosCompartilhados] = useState<Membro[]>([]);
  const [uidCopiado, setUidCopiado] = useState(false);
  const [carregandoCompartilhamentos, setCarregandoCompartilhamentos] = useState(false);

  // Estado do formulário de IA
  const [presetSel, setPresetSel] = useState<string>('gemini');
  const [chave, setChave] = useState('');
  const [modelo, setModelo] = useState('gemini-2.5-flash');
  const [urlBase, setUrlBase] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarAvancado, setMostrarAvancado] = useState(false);

  // Status de feedback de IA
  const [testando, setTestando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Modal de exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [confirmacaoTexto, setConfirmacaoTexto] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  // Carrega configurações salvas na montagem
  useEffect(() => {
    if (config.provedor_ia) {
      setChave(config.provedor_ia.chave || '');
      setModelo(config.provedor_ia.modelo || 'gemini-2.5-flash');
      setUrlBase(config.provedor_ia.url_base || '');

      const encontrado = PRESETS.find((p) => {
        if (config.provedor_ia?.tipo === 'gemini' && p.tipo === 'gemini') return true;
        if (p.url_base && config.provedor_ia?.url_base === p.url_base) return true;
        return false;
      });
      if (encontrado) setPresetSel(encontrado.id);
      else setPresetSel('custom');
    }
  }, []);

  useEffect(() => {
    async function carregarMembrosFamilia() {
      if (!familiaId) return;
      try {
        const familia = await buscarFamilia(familiaId);
        if (familia) {
          setMembrosFamilia(await listarMembrosDaFamilia(familia));
        }
      } catch (e) {
        console.warn('[Ajustes] Erro ao carregar membros da família:', e);
      }
    }
    carregarMembrosFamilia();
  }, [familiaId]);

  useEffect(() => {
    async function carregarCompartilhamentos() {
      if (!usuario) return;
      setCarregandoCompartilhamentos(true);
      try {
        const [recebidos, meus] = await Promise.all([
          listarMembrosCompartilhados(usuario.uid),
          familiaId ? listarMembros(familiaId) : Promise.resolve([]),
        ]);
        setMembrosCompartilhados(recebidos);
        setMeusMembrosCompartilhados(meus.filter((m) => m.compartilhado_com_uids && m.compartilhado_com_uids.length > 0));
      } catch (e) {
        console.warn('[Ajustes] Erro ao carregar compartilhamentos:', e);
      } finally {
        setCarregandoCompartilhamentos(false);
      }
    }
    carregarCompartilhamentos();
  }, [usuario, familiaId]);

  const toggleSecao = (id: string) => {
    setSecaoAberta(secaoAberta === id ? null : id);
  };

  const handleCopiarCodigo = async () => {
    if (!familiaId) return;
    await navigator.clipboard.writeText(familiaId);
    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 2000);
  };

  const handleEntrarFamilia = async () => {
    const codigo = codigoEntrar.trim();
    if (!codigo) return;
    setEntrandoFamilia(true);
    setFeedbackFamilia(null);
    try {
      if (!usuario) {
        setFeedbackFamilia({ tipo: 'erro', texto: 'Usuário não autenticado.' });
        return;
      }
      const familia = await buscarFamilia(codigo);
      if (!familia) {
        setFeedbackFamilia({ tipo: 'erro', texto: 'Código de convite inválido ou família não encontrada.' });
        return;
      }
      await entrarEmFamilia(codigo, usuario.uid);
      await recarregarUsuarioSalus();
      setCodigoEntrar('');
      setFeedbackFamilia({ tipo: 'sucesso', texto: 'Você entrou na família com sucesso!' });
    } catch (e) {
      setFeedbackFamilia({ tipo: 'erro', texto: 'Erro ao entrar na família: ' + (e as Error).message });
    } finally {
      setEntrandoFamilia(false);
    }
  };

  const selecionarPreset = (p: PresetItem) => {
    setPresetSel(p.id);
    setModelo(p.modelo_padrao);
    setUrlBase(p.url_base || '');
    setFeedback(null);
  };

  const extrairConfigForm = (): ConfigProvedorIA => {
    const preset = PRESETS.find((p) => p.id === presetSel);
    const tipo = preset ? preset.tipo : 'openai_compat';
    const res: ConfigProvedorIA = {
      tipo,
      chave: chave.trim(),
      modelo: modelo.trim() || (preset ? preset.modelo_padrao : 'gemini-2.5-flash'),
    };
    if (urlBase.trim()) {
      res.url_base = urlBase.trim();
    }
    return res;
  };

  const handleTestar = async () => {
    const cfgIA = extrairConfigForm();
    if (!cfgIA.chave) {
      setFeedback({ tipo: 'erro', texto: 'Insira a chave da API antes de testar.' });
      return;
    }
    setTestando(true);
    setFeedback(null);
    try {
      const res = await testarIA(cfgIA);
      if (res.ok) {
        setFeedback({ tipo: 'sucesso', texto: res.mensagem });
      } else {
        setFeedback({ tipo: 'erro', texto: res.mensagem });
      }
    } catch (e) {
      setFeedback({ tipo: 'erro', texto: 'Erro inesperado: ' + (e as Error).message });
    } finally {
      setTestando(false);
    }
  };

  const handleSalvar = async () => {
    const cfgIA = extrairConfigForm();
    if (!cfgIA.chave) {
      setFeedback({ tipo: 'erro', texto: 'A chave da API não pode estar em branco.' });
      return;
    }
    setSalvando(true);
    setFeedback(null);
    try {
      await salvarConfigIA(cfgIA);
      setFeedback({ tipo: 'sucesso', texto: `Configurações de IA (${cfgIA.modelo}) salvas com sucesso no banco!` });
    } catch (e) {
      setFeedback({ tipo: 'erro', texto: 'Erro ao salvar: ' + (e as Error).message });
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverChave = async () => {
    if (!confirm('Deseja realmente remover a chave de IA salva?')) return;
    await salvarConfigIA(null);
    setChave('');
    setFeedback({ tipo: 'sucesso', texto: 'Chave removida. O Salus continuará funcionando sem IA.' });
  };

  const handleExportarZip = async () => {
    setExportando(true);
    try {
      await exportarDadosZip();
    } catch (e) {
      alert('Erro ao exportar: ' + (e as Error).message);
    } finally {
      setExportando(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (confirmacaoTexto !== 'EXCLUIR') return;
    setExcluindo(true);
    try {
      await apagarConta();
      setModalExcluirAberto(false);
      alert('Todos os dados foram apagados com sucesso.');
    } catch (e) {
      alert('Erro ao apagar dados: ' + (e as Error).message);
    } finally {
      setExcluindo(false);
    }
  };

  const temChaveAtiva = Boolean(config.provedor_ia?.chave);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <Settings size={24} className="text-salus-500" />
          Ajustes
        </h1>
        <p className="text-texto-secundario mt-1">
          Gerencie seu provedor de IA, Google Drive, backups e dados da família.
        </p>
      </div>

      {/* IA Provider Card */}
      <Card>
        <button
          onClick={() => toggleSecao('ia')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-salus-600/15 flex items-center justify-center">
              <Key size={20} className="text-salus-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-texto">Provedor de IA (BYOK)</h2>
                {temChaveAtiva ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-salus-900/40 text-salus-400 font-medium flex items-center gap-1 border border-salus-500/30">
                    <CheckCircle2 size={12} /> Configurado e Ativo
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-fundo-elevado text-texto-secundario font-medium">
                    Não configurado
                  </span>
                )}
              </div>
              <p className="text-xs text-texto-secundario">
                Sua chave fica segura e isolada na sua conta. Há opções gratuitas.
              </p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'ia' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'ia' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-5">
            <p className="text-sm text-texto-secundario leading-relaxed">
              O Salus é 100% funcional offline. Se desejar usar o Chat e a leitura inteligente de exames e receitas,
              selecione um provedor e insira sua chave.
            </p>

            {/* Presets List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESETS.map((p) => {
                const selecionado = presetSel === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selecionarPreset(p)}
                    type="button"
                    className={`flex flex-col text-left p-3.5 rounded-[var(--radius-md)] border transition-all ${
                      selecionado
                        ? 'border-salus-500 bg-salus-950/20 ring-1 ring-salus-500'
                        : 'border-borda hover:border-salus-600/40 bg-fundo-elevado/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-semibold text-texto flex items-center gap-1.5">
                        {p.nome}
                        {selecionado && <Check size={14} className="text-salus-400" />}
                      </span>
                      {p.gratis && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-salus-900/50 text-salus-400 font-medium border border-salus-500/20">
                          Grátis
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-texto-secundario">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* API Key Input */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-texto">
                  Chave da API ({PRESETS.find((p) => p.id === presetSel)?.nome})
                </label>
                {PRESETS.find((p) => p.id === presetSel)?.url_obter_chave && (
                  <a
                    href={PRESETS.find((p) => p.id === presetSel)?.url_obter_chave}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-salus-400 hover:underline"
                  >
                    Como conseguir uma chave grátis →
                  </a>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                  placeholder="Cole sua chave de API aqui"
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm focus:outline-none focus:border-salus-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 text-texto-secundario hover:text-texto"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Advanced toggle */}
            <div>
              <button
                type="button"
                onClick={() => setMostrarAvancado(!mostrarAvancado)}
                className="text-xs text-salus-400 hover:underline flex items-center gap-1"
              >
                {mostrarAvancado ? 'Ocultar opções avançadas de modelo/URL' : 'Configurações avançadas (Modelo e URL Base)'}
              </button>

              {mostrarAvancado && (
                <div className="mt-3 p-3 bg-fundo-elevado/50 rounded-[var(--radius-md)] border border-borda space-y-3 animate-fade-in">
                  <Campo
                    label="Nome do Modelo"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="ex: gemini-2.5-flash, llama-3.3-70b-versatile"
                  />
                  {presetSel !== 'gemini' && (
                    <Campo
                      label="URL Base da API (OpenAI Compatible)"
                      value={urlBase}
                      onChange={(e) => setUrlBase(e.target.value)}
                      placeholder="ex: https://api.groq.com/openai/v1"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Feedback Banner */}
            {feedback && (
              <div
                className={`p-3 rounded-[var(--radius-md)] text-sm flex items-start gap-2.5 border ${
                  feedback.tipo === 'sucesso'
                    ? 'bg-salus-950/40 border-salus-500/40 text-salus-300'
                    : 'bg-alerta-950/40 border-alerta-500/40 text-alerta-300'
                }`}
              >
                {feedback.tipo === 'sucesso' ? (
                  <CheckCircle2 size={18} className="text-salus-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-alerta-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.texto}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-borda">
              <Botao
                type="button"
                onClick={handleSalvar}
                disabled={salvando || testando}
                icone={salvando ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              >
                {salvando ? 'Salvando no banco...' : 'Salvar Configurações'}
              </Botao>

              <Botao
                type="button"
                variante="secundario"
                onClick={handleTestar}
                disabled={testando || salvando}
                icone={testando ? <RefreshCw size={16} className="animate-spin" /> : <Key size={16} />}
              >
                {testando ? 'Testando Conexão...' : 'Testar Conexão'}
              </Botao>

              {temChaveAtiva && (
                <Botao
                  type="button"
                  variante="perigo"
                  tamanho="sm"
                  onClick={handleRemoverChave}
                  icone={<Trash2 size={16} />}
                  className="ml-auto"
                >
                  Remover Chave
                </Botao>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Família Compartilhada Card */}
      <Card>
        <button
          onClick={() => toggleSecao('familia')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-fundo-elevado flex items-center justify-center">
              <Users size={20} className="text-texto-secundario" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Família Compartilhada</h2>
              <p className="text-xs text-texto-secundario">
                {membrosFamilia.length} {membrosFamilia.length === 1 ? 'membro' : 'membros'} com acesso ao painel
              </p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'familia' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'familia' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-texto">Membros com acesso</p>
              <div className="space-y-1.5">
                {membrosFamilia.map((m) => (
                  <div key={m.uid} className="flex items-center gap-2.5 p-2 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                    {m.foto_url ? (
                      <img src={m.foto_url} alt={m.nome ?? m.uid} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-salus-600/20 flex items-center justify-center text-xs font-semibold text-salus-400">
                        {(m.nome ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-texto">{m.nome ?? m.uid}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-borda space-y-2">
              <p className="text-sm font-medium text-texto">Convidar um familiar</p>
              <p className="text-xs text-texto-secundario">
                Compartilhe este código com quem também vai cuidar da família — ao entrar, essa pessoa passa a ver os mesmos dados.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm font-mono truncate">
                  {familiaId ?? '—'}
                </div>
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  onClick={handleCopiarCodigo}
                  icone={codigoCopiado ? <Check size={16} /> : <Copy size={16} />}
                >
                  {codigoCopiado ? 'Copiado!' : 'Copiar código'}
                </Botao>
              </div>
            </div>

            <div className="pt-3 border-t border-borda space-y-2">
              <p className="text-sm font-medium text-texto">Entrar em uma família existente</p>
              <p className="text-xs text-texto-secundario">
                Cole aqui o código de convite recebido para passar a compartilhar o painel dessa família.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codigoEntrar}
                  onChange={(e) => setCodigoEntrar(e.target.value)}
                  placeholder="Cole o código de convite"
                  className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm focus:outline-none focus:border-salus-500"
                />
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  onClick={handleEntrarFamilia}
                  disabled={!codigoEntrar.trim() || entrandoFamilia}
                  icone={entrandoFamilia ? <RefreshCw size={16} className="animate-spin" /> : <LogIn size={16} />}
                >
                  {entrandoFamilia ? 'Entrando...' : 'Entrar'}
                </Botao>
              </div>
              {feedbackFamilia && (
                <div
                  className={`p-3 rounded-[var(--radius-md)] text-sm flex items-start gap-2.5 border ${
                    feedbackFamilia.tipo === 'sucesso'
                      ? 'bg-salus-950/40 border-salus-500/40 text-salus-300'
                      : 'bg-alerta-950/40 border-alerta-500/40 text-alerta-300'
                  }`}
                >
                  {feedbackFamilia.tipo === 'sucesso' ? (
                    <CheckCircle2 size={18} className="text-salus-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="text-alerta-400 shrink-0 mt-0.5" />
                  )}
                  <span>{feedbackFamilia.texto}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Compartilhamentos por Membro Card */}
      <Card>
        <button
          onClick={() => toggleSecao('compartilhamentos')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-fundo-elevado flex items-center justify-center">
              <UserPlus size={20} className="text-texto-secundario" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Compartilhamentos</h2>
              <p className="text-xs text-texto-secundario">
                {membrosCompartilhados.length > 0
                  ? `${membrosCompartilhados.length} membro${membrosCompartilhados.length > 1 ? 's' : ''} compartilhado${membrosCompartilhados.length > 1 ? 's' : ''} com você`
                  : 'Gerencie quem vê cada membro'}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'compartilhamentos' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'compartilhamentos' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-4">
            {/* Meu UID */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-texto">Meu UID</p>
              <p className="text-xs text-texto-secundario">
                Compartilhe este UID com quem deseja compartilhar um membro específico.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm font-mono truncate">
                  {usuario?.uid ?? '—'}
                </div>
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  onClick={async () => {
                    if (!usuario?.uid) return;
                    await navigator.clipboard.writeText(usuario.uid);
                    setUidCopiado(true);
                    setTimeout(() => setUidCopiado(false), 2000);
                  }}
                  icone={uidCopiado ? <Check size={16} /> : <Copy size={16} />}
                >
                  {uidCopiado ? 'Copiado!' : 'Copiar UID'}
                </Botao>
              </div>
            </div>

            {/* Compartilhados comigo */}
            <div className="pt-3 border-t border-borda space-y-2">
              <p className="text-sm font-medium text-texto">Compartilhados comigo</p>
              {carregandoCompartilhamentos ? (
                <p className="text-sm text-texto-secundario animate-pulse">Carregando...</p>
              ) : membrosCompartilhados.length === 0 ? (
                <p className="text-sm text-texto-secundario">Nenhum membro compartilhado com você ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {membrosCompartilhados.map((m) => (
                    <NavLink
                      key={m.id}
                      to={`/membro/${m.id}?familia=${m.familia_origem_id}`}
                      className="flex items-center gap-2.5 p-2 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50 hover:bg-fundo-elevado transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-salus-600/20 flex items-center justify-center text-xs font-semibold text-salus-400">
                        {m.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-texto">{m.nome}</span>
                      <ChevronRight size={14} className="text-texto-secundario/50 ml-auto shrink-0" />
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Meus compartilhamentos */}
            <div className="pt-3 border-t border-borda space-y-2">
              <p className="text-sm font-medium text-texto">Meus compartilhamentos</p>
              {carregandoCompartilhamentos ? (
                <p className="text-sm text-texto-secundario animate-pulse">Carregando...</p>
              ) : meusMembrosCompartilhados.length === 0 ? (
                <p className="text-sm text-texto-secundario">Nenhum membro compartilhado por você ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {meusMembrosCompartilhados.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-salus-600/20 flex items-center justify-center text-xs font-semibold text-salus-400">
                          {m.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm text-texto">{m.nome}</span>
                          <span className="text-xs text-texto-secundario ml-2">
                            Compartilhado com {m.compartilhado_com_uids?.length} uid{m.compartilhado_com_uids && m.compartilhado_com_uids.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!familiaId || !m.compartilhado_com_uids?.length) return;
                          const uid = m.compartilhado_com_uids[0];
                          try {
                            await removerCompartilhamento(familiaId, m.id, uid);
                            setMeusMembrosCompartilhados((prev) => prev.filter((x) => x.id !== m.id));
                          } catch (e) {
                            alert('Erro ao revogar: ' + (e as Error).message);
                          }
                        }}
                        className="text-xs text-vencido-500 hover:text-vencido-400 font-medium px-2 py-1 rounded-[var(--radius-md)] hover:bg-fundo-elevado transition-colors"
                      >
                        Revogar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Aparência Card */}
      <Card>
        <div className="flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-fundo-elevado flex items-center justify-center">
              {tema === 'escuro' ? <Moon size={20} className="text-texto-secundario" /> : <Sun size={20} className="text-texto-secundario" />}
            </div>
            <div>
              <h2 className="font-semibold text-texto">Aparência</h2>
              <p className="text-xs text-texto-secundario">
                {tema === 'escuro' ? 'Modo escuro ativo' : 'Modo claro ativo'}
              </p>
            </div>
          </div>
          <Botao
            type="button"
            variante="secundario"
            tamanho="sm"
            onClick={alternarTema}
            icone={tema === 'escuro' ? <Sun size={16} /> : <Moon size={16} />}
          >
            {tema === 'escuro' ? 'Usar modo claro' : 'Usar modo escuro'}
          </Botao>
        </div>
      </Card>

      {/* Export / Backup Card */}
      <Card>
        <button
          onClick={() => toggleSecao('dados')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-fundo-elevado flex items-center justify-center">
              <Download size={20} className="text-texto-secundario" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Exportar / Backup dos Dados</h2>
              <p className="text-xs text-texto-secundario">Baixe todos os dados em formato Markdown / ZIP</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'dados' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'dados' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-3">
            <p className="text-sm text-texto-secundario">
              Exporte todos os registros da sua família em um único arquivo `.zip` compatível com o Salus.
            </p>
            <div className="flex gap-2">
              <Botao
                variante="secundario"
                tamanho="sm"
                icone={exportando ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                onClick={handleExportarZip}
                disabled={exportando}
              >
                {exportando ? 'Gerando arquivo .zip...' : 'Exportar .zip Completo'}
              </Botao>
            </div>
          </div>
        )}
      </Card>

      {/* Privacy Card */}
      <Card>
        <button
          onClick={() => toggleSecao('privacidade')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-fundo-elevado flex items-center justify-center">
              <Shield size={20} className="text-texto-secundario" />
            </div>
            <div>
              <h2 className="font-semibold text-texto">Privacidade e Exclusão</h2>
              <p className="text-xs text-texto-secundario">Controle seus dados e apague sua conta quando quiser</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'privacidade' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'privacidade' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-4">
            <div className="text-sm text-texto-secundario space-y-3">
              <p className="text-texto font-semibold text-base">LGPD — Lei Geral de Proteção de Dados</p>

              <div className="p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                <p className="font-medium text-texto mb-1">Base legal: Consentimento (Art. 7º, I e Art. 11, II)</p>
                <p>Seus dados de saúde são tratados com consentimento específico. Você pode revogá-lo a qualquer momento.</p>
              </div>

              <div className="p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                <p className="font-medium text-texto mb-1">Seus direitos (LGPD Art. 18)</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Confirmar se tratamos seus dados</li>
                  <li>Acessar, corrigir ou eliminar seus dados</li>
                  <li>Exportar uma cópia (botão Exportar .zip)</li>
                  <li>Revogar o consentimento e apagar a conta</li>
                </ul>
              </div>

              <div className="p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                <p className="font-medium text-texto mb-1">Encarregado (DPO)</p>
                <p>Jussier Silva — <span className="text-salus-400">jussier.silva@gmail.com</span></p>
              </div>

              <div className="p-3 rounded-[var(--radius-md)] bg-fundo/50 border border-borda/50">
                <p className="font-medium text-texto mb-1">Tempo de retenção</p>
                <p>Os dados são mantidos até que você revogue o consentimento ou solicite a exclusão.
                   Chaves de API de IA são armazenadas com criptografia em trânsito e em repouso.</p>
              </div>
            </div>

            <div className="pt-3 border-t border-borda flex flex-col gap-2">
              <p className="text-xs text-texto-secundario">
                Versão do consentimento: {config.versao_consentimento}
                {config.data_consentimento && <> · Aceito em {new Date(config.data_consentimento).toLocaleDateString('pt-BR')}</>}
              </p>
              <Botao
                variante="perigo"
                tamanho="sm"
                icone={<Trash2 size={16} />}
                onClick={() => setModalExcluirAberto(true)}
              >
                Apagar minha conta e todos os dados
              </Botao>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Exclusão */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-fundo-card border border-alerta-500/50 rounded-[var(--radius-lg)] p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-alerta-400 flex items-center gap-2">
                <AlertTriangle size={20} />
                Excluir Todos os Dados
              </h3>
              <button
                onClick={() => setModalExcluirAberto(false)}
                className="text-texto-secundario hover:text-texto"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-texto-secundario">
              Esta ação é <strong>irreversível</strong>. Todos os membros, exames, medicamentos e histórico de saúde serão permanentemente apagados.
            </p>
            <p className="text-xs text-texto-secundario">
              Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
            </p>
            <input
              type="text"
              value={confirmacaoTexto}
              onChange={(e) => setConfirmacaoTexto(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-fundo-elevado border border-borda text-texto text-sm focus:outline-none focus:border-alerta-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Botao
                variante="secundario"
                tamanho="sm"
                onClick={() => setModalExcluirAberto(false)}
              >
                Cancelar
              </Botao>
              <Botao
                variante="perigo"
                tamanho="sm"
                disabled={confirmacaoTexto !== 'EXCLUIR' || excluindo}
                onClick={handleConfirmarExclusao}
                icone={excluindo ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
              >
                {excluindo ? 'Apagando...' : 'Confirmar Exclusão'}
              </Botao>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
