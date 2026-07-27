import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BottomSheet } from '../../core/ui';
import { FAQ_LOGIN } from './faqData';

interface FaqProps {
  aberto: boolean;
  onFechar: () => void;
}

export function Faq({ aberto, onFechar }: FaqProps) {
  const [perguntaAberta, setPerguntaAberta] = useState<string | null>(null);

  return (
    <BottomSheet aberto={aberto} onFechar={onFechar} titulo="Dúvidas frequentes">
      <div className="space-y-6">
        {FAQ_LOGIN.map(({ categoria, perguntas }) => (
          <div key={categoria}>
            <h4 className="text-xs font-bold uppercase tracking-wide text-texto-secundario/70 mb-2">
              {categoria}
            </h4>
            <div className="space-y-2">
              {perguntas.map(({ pergunta, resposta }) => {
                const id = `${categoria}::${pergunta}`;
                const isOpen = perguntaAberta === id;
                return (
                  <div key={id} className="rounded-[var(--radius-md)] border border-borda bg-fundo-card">
                    <button
                      onClick={() => setPerguntaAberta(isOpen ? null : id)}
                      className="flex items-center gap-2 w-full text-left px-4 py-3"
                    >
                      <span className="text-sm font-medium text-texto flex-1">{pergunta}</span>
                      {isOpen ? (
                        <ChevronUp size={16} className="text-texto-secundario shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-texto-secundario shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="px-4 pb-3 text-sm text-texto-secundario leading-relaxed">{resposta}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
