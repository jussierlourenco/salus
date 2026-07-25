import { useState, useEffect } from 'react';
import { Card, Botao, Campo } from '../../core/ui';
import {
  Settings, Key, Cloud, Download, Trash2,
  Shield, ChevronRight, CheckCircle2, AlertTriangle,
  RefreshCw, Eye, EyeOff, Check, X, Folder
} from 'lucide-react';
import { useConfiguracao } from '../../core/config/ConfigContext';
import { ServicoGoogleDrive } from '../../core/storage/drive';
import type { ConfigProvedorIA, ProvedorIATipo } from '../../types/dominio';

interface PresetItem {
  id: string;
  nome: string;
  tipo: ProvedorIATipo;
  url_base?: string;
  modelo_padrao: string;
  gratis: boolean;
  desc: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'gemini',
    nome: 'Google Gemini',
    tipo: 'gemini',
    modelo_padrao: 'gemini-2.0-flash',
    gratis: true,
    desc: 'Recomendado · Excelente para PDFs, fotos de exames e chat',
  },
  {
    id: 'groq',
    nome: 'Groq',
    tipo: 'openai_compat',
    url_base: 'https://api.groq.com/openai/v1',
    modelo_padrao: 'llama-3.3-70b-versatile',
    gratis: true,
    desc: 'Ultra rápido · Ideal para o Chat em tempo real',
  },
  {
    id: 'openrouter',
    nome: 'OpenRouter',
    tipo: 'openai_compat',
    url_base: 'https://openrouter.ai/api/v1',
    modelo_padrao: 'google/gemini-2.0-flash-lite-001',
    gratis: true,
    desc: 'Catálogo variado com vários modelos gratuitos',
  },
  {
    id: 'mistral',
    nome: 'Mistral AI',
    tipo: 'openai_compat',
    url_base: 'https://api.mistral.ai/v1',
    modelo_padrao: 'mistral-small-latest',
    gratis: true,
    desc: 'Modelos europeus de alta precisão',
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
  const { config, salvarConfigIA, salvarConfigDrive, testarIA, exportarDadosZip, apagarConta } = useConfiguracao();

  const [secaoAberta, setSecaoAberta] = useState<string | null>('ia');

  // Estado do formulário de IA
  const [presetSel, setPresetSel] = useState<string>('gemini');
  const [chave, setChave] = useState('');
  const [modelo, setModelo] = useState('gemini-2.0-flash');
  const [urlBase, setUrlBase] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarAvancado, setMostrarAvancado] = useState(false);

  // Estado do formulário do Google Drive
  const [driveToken, setDriveToken] = useState('');
  const [drivePastaId, setDrivePastaId] = useState('Salus App');
  const [testandoDrive, setTestandoDrive] = useState(false);
  const [salvandoDrive, setSalvandoDrive] = useState(false);
  const [feedbackDrive, setFeedbackDrive] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

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
      setModelo(config.provedor_ia.modelo || 'gemini-2.0-flash');
      setUrlBase(config.provedor_ia.url_base || '');

      const encontrado = PRESETS.find((p) => {
        if (config.provedor_ia?.tipo === 'gemini' && p.tipo === 'gemini') return true;
        if (p.url_base && config.provedor_ia?.url_base === p.url_base) return true;
        return false;
      });
      if (encontrado) setPresetSel(encontrado.id);
      else setPresetSel('custom');
    }

    if (config.drive_refresh_token) {
      setDriveToken(config.drive_refresh_token);
    }
    if (config.drive_pasta_raiz_id) {
      setDrivePastaId(config.drive_pasta_raiz_id);
    }
  }, []);

  const toggleSecao = (id: string) => {
    setSecaoAberta(secaoAberta === id ? null : id);
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
      modelo: modelo.trim() || (preset ? preset.modelo_padrao : 'gemini-2.0-flash'),
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

  const handleSalvarDrive = async () => {
    setSalvandoDrive(true);
    setFeedbackDrive(null);
    try {
      await salvarConfigDrive({
        token: driveToken.trim(),
        pasta_id: drivePastaId.trim() || 'Salus App',
        conectado: true,
      });
      setFeedbackDrive({ tipo: 'sucesso', texto: 'Configuração do Google Drive salva no banco de dados!' });
    } catch (e) {
      setFeedbackDrive({ tipo: 'erro', texto: 'Erro ao salvar Drive: ' + (e as Error).message });
    } finally {
      setSalvandoDrive(false);
    }
  };

  const handleTestarDrive = async () => {
    setTestandoDrive(true);
    setFeedbackDrive(null);
    try {
      if (driveToken.trim()) {
        const servico = new ServicoGoogleDrive(driveToken.trim());
        await servico.obterOuCriarPastaRaiz();
        setFeedbackDrive({ tipo: 'sucesso', texto: 'Conexão com Google Drive estabelecida e pasta verificada com sucesso!' });
      } else {
        setFeedbackDrive({ tipo: 'sucesso', texto: `Modo local ativo: Pasta configurada como "${drivePastaId || 'Salus App'}".` });
      }
    } catch (e) {
      setFeedbackDrive({ tipo: 'erro', texto: 'Erro ao conectar ao Google Drive: ' + (e as Error).message });
    } finally {
      setTestandoDrive(false);
    }
  };

  const handleDesconectarDrive = async () => {
    if (!confirm('Deseja desconectar o Google Drive?')) return;
    await salvarConfigDrive({ token: '', pasta_id: '', conectado: false });
    setDriveToken('');
    setFeedbackDrive({ tipo: 'sucesso', texto: 'Google Drive desconectado.' });
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
  const driveConectado = Boolean(config.drive_conectado);

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
              <label className="block text-sm font-medium text-texto">
                Chave da API ({PRESETS.find((p) => p.id === presetSel)?.nome})
              </label>
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
                    placeholder="ex: gemini-2.0-flash, llama-3.3-70b-versatile"
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

      {/* Google Drive Card */}
      <Card>
        <button
          onClick={() => toggleSecao('drive')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-alerta-600/15 flex items-center justify-center">
              <Cloud size={20} className="text-alerta-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-texto">Google Drive</h2>
                {driveConectado ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-salus-900/40 text-salus-400 font-medium flex items-center gap-1 border border-salus-500/30">
                    <CheckCircle2 size={12} /> Conectado ({drivePastaId})
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-fundo-elevado text-texto-secundario font-medium">
                    Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-texto-secundario">Armazenamento de exames e anexos na sua nuvem pessoal</p>
            </div>
          </div>
          <ChevronRight size={20} className={`text-texto-secundario transition-transform ${secaoAberta === 'drive' ? 'rotate-90' : ''}`} />
        </button>

        {secaoAberta === 'drive' && (
          <div className="mt-4 pt-4 border-t border-borda space-y-4">
            <p className="text-sm text-texto-secundario leading-relaxed">
              O Salus armazena documentos e arquivos originais na pasta da sua nuvem pessoal (`Salus App`).
            </p>

            <div className="space-y-3 p-4 bg-fundo-elevado/30 border border-borda rounded-[var(--radius-md)]">
              <Campo
                label="ID ou Nome da Pasta Raiz no Drive"
                value={drivePastaId}
                onChange={(e) => setDrivePastaId(e.target.value)}
                placeholder="ex: Salus App"
                icone={<Folder size={18} />}
              />

              <Campo
                label="Token OAuth / Refresh Token (Opcional)"
                type="password"
                value={driveToken}
                onChange={(e) => setDriveToken(e.target.value)}
                placeholder="Insira um token de acesso para integrar ao seu Google Drive"
              />
            </div>

            {feedbackDrive && (
              <div
                className={`p-3 rounded-[var(--radius-md)] text-sm flex items-start gap-2.5 border ${
                  feedbackDrive.tipo === 'sucesso'
                    ? 'bg-salus-950/40 border-salus-500/40 text-salus-300'
                    : 'bg-alerta-950/40 border-alerta-500/40 text-alerta-300'
                }`}
              >
                {feedbackDrive.tipo === 'sucesso' ? (
                  <CheckCircle2 size={18} className="text-salus-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-alerta-400 shrink-0 mt-0.5" />
                )}
                <span>{feedbackDrive.texto}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-borda">
              <Botao
                type="button"
                onClick={handleSalvarDrive}
                disabled={salvandoDrive || testandoDrive}
                icone={salvandoDrive ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
              >
                {salvandoDrive ? 'Salvando...' : 'Salvar Configuração do Drive'}
              </Botao>

              <Botao
                type="button"
                variante="secundario"
                onClick={handleTestarDrive}
                disabled={testandoDrive || salvandoDrive}
                icone={testandoDrive ? <RefreshCw size={16} className="animate-spin" /> : <Folder size={16} />}
              >
                {testandoDrive ? 'Testando Drive...' : 'Testar Conexão com Drive'}
              </Botao>

              {driveConectado && (
                <Botao
                  type="button"
                  variante="perigo"
                  tamanho="sm"
                  onClick={handleDesconectarDrive}
                  icone={<Trash2 size={16} />}
                  className="ml-auto"
                >
                  Desconectar
                </Botao>
              )}
            </div>
          </div>
        )}
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
            <div className="text-sm text-texto-secundario space-y-2">
              <p>• Todos os seus dados são criptografados em trânsito e escopados pelo seu login.</p>
              <p>• Suas chaves de IA nunca são compartilhadas nem enviadas a servidores de terceiros.</p>
            </div>
            <div className="pt-3 border-t border-borda">
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
