import { useState, useRef, useEffect } from 'react';
import { Card, Botao } from '../../componentes/ui';
import { MessageCircle, Send, Sparkles, Info, Settings, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConfiguracao } from '../../core/config/ConfigContext';
import { useAuth } from '../../core/auth/AuthProvider';
import { criarProvedor, type MensagemChat } from '../../core/ia/interface';
import { listarMembros, listarMedicamentos } from '../../core/database/repositorio';

interface Mensagem {
  id: string;
  papel: 'usuario' | 'assistente' | 'sistema';
  conteudo: string;
  timestamp: string;
}

export function Chat() {
  const { config } = useConfiguracao();
  const { usuario } = useAuth();

  const temChaveIA = Boolean(config.provedor_ia?.chave);

  const [mensagens, setMensagens] = useState<Mensagem[]>(() => [
    {
      id: '0',
      papel: 'sistema',
      conteudo: temChaveIA
        ? `Conectado ao provedor ${config.provedor_ia?.tipo === 'gemini' ? 'Google Gemini' : 'OpenAI Compatível'} (${config.provedor_ia?.modelo}). Como posso ajudar com a saúde da família hoje?`
        : 'Para conversar com o Salus usando IA real, configure sua chave de API em Ajustes. Há opções gratuitas disponíveis (Google Gemini, Groq, OpenRouter).',
      timestamp: new Date().toISOString(),
    },
  ]);

  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const [contextoFamilia, setContextoFamilia] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  // Carrega contexto da família do Firestore
  useEffect(() => {
    async function carregarContexto() {
      if (!usuario) return;
      try {
        const [membros, meds] = await Promise.all([
          listarMembros(usuario.uid),
          listarMedicamentos(usuario.uid),
        ]);

        const membrosTxt = membros.map((m) => `${m.nome} (${m.tipo}, id: ${m.id})`).join(', ');
        const medsTxt = meds.map((m) => `${m.nome} (${m.dose || 'dose N/D'}, membroId: ${m.membro_id})`).join(', ');

        const ctxStr = `Familiares cadastrados: ${membrosTxt || 'Nenhum'}. Medicamentos cadastrados: ${medsTxt || 'Nenhum'}.`;
        setContextoFamilia(ctxStr);
      } catch (e) {
        console.warn('[Chat] Erro ao carregar contexto da família:', e);
      }
    }
    carregarContexto();
  }, [usuario]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, pensando]);

  const enviar = async () => {
    if (!entrada.trim() || pensando) return;

    const textoUsuario = entrada.trim();
    const msgUsuario: Mensagem = {
      id: Date.now().toString(),
      papel: 'usuario',
      conteudo: textoUsuario,
      timestamp: new Date().toISOString(),
    };

    const novasMensagens = [...mensagens, msgUsuario];
    setMensagens(novasMensagens);
    setEntrada('');

    if (!temChaveIA) {
      setTimeout(() => {
        setMensagens((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            papel: 'assistente',
            conteudo: 'Provedor de IA não configurado. Por favor, acesse **Ajustes → Provedor de IA** para cadastrar uma chave e desbloquear as respostas inteligentes.',
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 500);
      return;
    }

    setPensando(true);
    try {
      const provedor = criarProvedor(config.provedor_ia);

      const historicoIA: MensagemChat[] = novasMensagens
        .filter((m) => m.papel !== 'sistema')
        .map((m) => ({
          papel: m.papel === 'usuario' ? 'usuario' : 'assistente',
          conteudo: m.conteudo,
        }));

      const resposta = await provedor.chat(historicoIA, contextoFamilia);

      setMensagens((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          papel: 'assistente',
          conteudo: resposta.conteudo || 'Desculpe, não consegui obter uma resposta do provedor de IA.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const msgErro = err instanceof Error ? err.message : String(err);
      setMensagens((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          papel: 'assistente',
          conteudo: `⚠️ Erro de comunicação com o provedor de IA (${config.provedor_ia?.modelo}): ${msgErro}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-6rem)] animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
            <MessageCircle size={24} className="text-salus-500" />
            Chat
          </h1>
          <p className="text-texto-secundario mt-1 text-sm">
            Pergunte sobre a saúde da família em linguagem natural.
          </p>
        </div>

        {!temChaveIA ? (
          <Link
            to="/ajustes"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-alerta-950/40 text-alerta-400 border border-alerta-500/30 hover:bg-alerta-900/50 transition-all"
          >
            <Settings size={14} />
            Configurar IA em Ajustes
          </Link>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-salus-950/40 text-salus-400 border border-salus-500/30 font-medium">
            Provedor: {config.provedor_ia?.modelo}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1">
        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.papel === 'usuario' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-[var(--radius-lg)] shadow-sm
                ${msg.papel === 'usuario'
                  ? 'bg-salus-600 text-white rounded-br-sm'
                  : msg.papel === 'sistema'
                  ? 'bg-fundo-elevado/50 text-texto-secundario border border-borda/50 rounded-bl-sm'
                  : 'bg-fundo-card border border-borda text-texto rounded-bl-sm'
                }
              `}
            >
              {msg.papel === 'sistema' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Info size={14} className="text-salus-400" />
                  <span className="text-xs font-medium text-salus-400">Sistema</span>
                </div>
              )}
              {msg.papel === 'assistente' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-salus-400" />
                  <span className="text-xs font-medium text-salus-400">Salus</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.conteudo}</p>
            </div>
          </div>
        ))}

        {pensando && (
          <div className="flex justify-start">
            <div className="bg-fundo-card border border-borda text-texto-secundario px-4 py-3 rounded-[var(--radius-lg)] rounded-bl-sm flex items-center gap-2 text-sm">
              <RefreshCw size={14} className="animate-spin text-salus-400" />
              Salus está pensando...
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      {/* Input */}
      <Card padding="sm" className="shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); enviar(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            disabled={pensando}
            placeholder="Pergunte sobre medicamentos, sintomas, históricos..."
            className="flex-1 bg-transparent text-texto placeholder:text-texto-secundario/50
                       text-sm py-2 px-3 focus:outline-none disabled:opacity-50"
            aria-label="Mensagem"
          />
          <Botao
            type="submit"
            tamanho="sm"
            disabled={!entrada.trim() || pensando}
            icone={pensando ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          >
            Enviar
          </Botao>
        </form>
      </Card>
    </div>
  );
}
