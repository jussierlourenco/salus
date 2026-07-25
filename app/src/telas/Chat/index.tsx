import { useState, useRef, useEffect } from 'react';
import { Card, Botao } from '../../componentes/ui';
import { MessageCircle, Send, Sparkles, Info } from 'lucide-react';

interface Mensagem {
  id: string;
  papel: 'usuario' | 'assistente' | 'sistema';
  conteudo: string;
  timestamp: string;
}

export function Chat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: '0',
      papel: 'sistema',
      conteudo: 'O Chat usa sua chave de IA para responder perguntas sobre a saúde da família. Configure um provedor em Ajustes para começar.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [entrada, setEntrada] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviar = () => {
    if (!entrada.trim()) return;
    const nova: Mensagem = {
      id: Date.now().toString(),
      papel: 'usuario',
      conteudo: entrada.trim(),
      timestamp: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, nova]);
    setEntrada('');

    // Demo response
    setTimeout(() => {
      setMensagens((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          papel: 'assistente',
          conteudo: 'Para usar o Chat, configure uma chave de IA em **Ajustes → Provedor de IA**. Há opções gratuitas disponíveis (Google Gemini, Groq, OpenRouter).',
          timestamp: new Date().toISOString(),
        },
      ]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-6rem)] animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-texto flex items-center gap-2">
          <MessageCircle size={24} className="text-salus-500" />
          Chat
        </h1>
        <p className="text-texto-secundario mt-1">
          Pergunte sobre a saúde da família em linguagem natural.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.papel === 'usuario' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-[var(--radius-lg)]
                ${msg.papel === 'usuario'
                  ? 'bg-salus-600 text-white rounded-br-sm'
                  : msg.papel === 'sistema'
                  ? 'bg-fundo-elevado/50 text-texto-secundario border border-borda/50 rounded-bl-sm'
                  : 'bg-fundo-card border border-borda rounded-bl-sm'
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
              <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
            </div>
          </div>
        ))}
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
            placeholder="Pergunte sobre a saúde da família..."
            className="flex-1 bg-transparent text-texto placeholder:text-texto-secundario/50
                       text-sm py-2 px-3 focus:outline-none"
            aria-label="Mensagem"
          />
          <Botao
            type="submit"
            tamanho="sm"
            disabled={!entrada.trim()}
            icone={<Send size={16} />}
          >
            Enviar
          </Botao>
        </form>
      </Card>
    </div>
  );
}
